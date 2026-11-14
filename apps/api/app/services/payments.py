import hashlib
import hmac
import json
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4
import time

import httpx
import razorpay
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Invoice, Membership, Notification, Payment, PaymentWebhookEvent, User

logger = logging.getLogger(__name__)
_phonepe_token: str | None = None
_phonepe_token_expiry = 0


def _phonepe_urls() -> tuple[str, str]:
    if settings.phonepe_environment.upper() == "PRODUCTION":
        return "https://api.phonepe.com/apis/identity-manager/v1/oauth/token", "https://api.phonepe.com/apis/pg/checkout/v2"
    return "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token", "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2"


def _phonepe_access_token() -> str:
    global _phonepe_token, _phonepe_token_expiry
    if not settings.phonepe_client_id or not settings.phonepe_client_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "PhonePe is not configured")
    if _phonepe_token and time.time() < _phonepe_token_expiry - 60:
        return _phonepe_token
    token_url, _ = _phonepe_urls()
    try:
        response = httpx.post(token_url, data={
            "client_id": settings.phonepe_client_id,
            "client_version": settings.phonepe_client_version,
            "client_secret": settings.phonepe_client_secret,
            "grant_type": "client_credentials",
        }, timeout=15)
        response.raise_for_status()
        data = response.json()
        _phonepe_token = data["access_token"]
        _phonepe_token_expiry = int(data.get("expires_at", time.time() + 300))
        return _phonepe_token
    except (httpx.HTTPError, KeyError, ValueError) as error:
        logger.warning("PhonePe authorization failed", exc_info=error)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "PhonePe authorization failed") from error


def create_phonepe_order(*, order_id: str, amount_paise: int, redirect_url: str, phone: str | None) -> str:
    _, base_url = _phonepe_urls()
    body: dict[str, Any] = {
        "merchantOrderId": order_id,
        "amount": amount_paise,
        "expireAfter": 1200,
        "paymentFlow": {"type": "PG_CHECKOUT", "merchantUrls": {"redirectUrl": redirect_url}},
    }
    if phone:
        body["prefillUserLoginDetails"] = {"phoneNumber": phone}
    try:
        response = httpx.post(f"{base_url}/pay", json=body,
                              headers={"Authorization": f"O-Bearer {_phonepe_access_token()}"}, timeout=20)
        response.raise_for_status()
        data = response.json()
        if data.get("merchantOrderId") != order_id or not data.get("redirectUrl"):
            raise ValueError("PhonePe returned an invalid checkout order")
        return data["redirectUrl"]
    except (httpx.HTTPError, KeyError, ValueError) as error:
        logger.warning("PhonePe order creation failed", exc_info=error)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Unable to create a PhonePe checkout") from error


def fetch_phonepe_order(order_id: str) -> dict[str, Any]:
    _, base_url = _phonepe_urls()
    try:
        response = httpx.get(f"{base_url}/order/{order_id}/status", params={"details": "true"},
                             headers={"Authorization": f"O-Bearer {_phonepe_access_token()}"}, timeout=15)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as error:
        logger.warning("PhonePe order status lookup failed", exc_info=error)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Unable to confirm payment with PhonePe") from error


def get_razorpay_client():
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Razorpay is not configured")
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def verify_checkout_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if not settings.razorpay_key_secret:
        return False
    expected = hmac.new(
        settings.razorpay_key_secret.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    if not settings.razorpay_webhook_secret or not signature:
        return False
    expected = hmac.new(
        settings.razorpay_webhook_secret.encode(), raw_body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def activate_paid_payment(
    db: Session,
    payment: Payment,
    *,
    provider_payment_id: str,
    paid_at: datetime | None = None,
) -> bool:
    """Atomically activate an order once, then create its receipt record."""
    locked_payment = db.scalar(select(Payment).where(Payment.id == payment.id).with_for_update())
    if locked_payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment was not found")
    if locked_payment.status == "PAID":
        if locked_payment.provider_payment_id != provider_payment_id:
            raise HTTPException(
                status.HTTP_409_CONFLICT, "Order is already paid by another payment"
            )
        return False

    membership = db.scalar(
        select(Membership).where(Membership.id == locked_payment.membership_id).with_for_update()
    )
    if membership is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Membership record is missing")

    # Serialize membership activation per member so two paid renewals cannot overlap.
    db.scalar(select(User.id).where(User.id == membership.member_user_id).with_for_update())
    now = paid_at or datetime.now(UTC)
    prior_membership = db.scalar(
        select(Membership)
        .where(
            Membership.member_user_id == membership.member_user_id,
            Membership.organization_id == membership.organization_id,
            Membership.status == "ACTIVE",
            Membership.expires_at > now,
            Membership.id != membership.id,
        )
        .order_by(Membership.expires_at.desc())
        .with_for_update()
    )
    starts_at = now
    if prior_membership is not None and prior_membership.expires_at is not None:
        prior_expiry = prior_membership.expires_at
        if prior_expiry.tzinfo is None:
            prior_expiry = prior_expiry.replace(tzinfo=UTC)
        starts_at = max(now, prior_expiry)
        membership.renewal_of_id = prior_membership.id
    membership.status = "ACTIVE"
    membership.starts_at = starts_at
    membership.expires_at = starts_at + timedelta(days=membership.plan.duration_days)
    locked_payment.status = "PAID"
    locked_payment.provider_payment_id = provider_payment_id
    locked_payment.paid_at = now

    invoice_number = f"FWR-{now:%Y%m%d}-{uuid4().hex[:8].upper()}"
    db.add(
        Invoice(
            organization_id=membership.organization_id,
            branch_id=membership.branch_id,
            payment_id=locked_payment.id,
            invoice_number=invoice_number,
            amount_paise=locked_payment.amount_paise,
            tax_paise=membership.tax_paise,
            currency=locked_payment.currency,
        )
    )
    db.add(
        Notification(
            organization_id=membership.organization_id,
            branch_id=membership.branch_id,
            user_id=membership.member_user_id,
            title="Membership activated",
            body=(
                f"Your {membership.plan_name_snapshot or 'membership'} is active through "
                f"{membership.expires_at:%d %b %Y}."
            ),
            category="MEMBERSHIP",
            data={"membership_id": str(membership.id), "payment_id": str(locked_payment.id)},
        )
    )
    return True


def process_webhook_event(
    db: Session,
    *,
    event_id: str,
    payload: dict[str, Any],
) -> bool:
    event_type = str(payload.get("event", "unknown"))[:120]
    event = PaymentWebhookEvent(
        provider="razorpay",
        provider_event_id=event_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(event)
    try:
        db.flush()
    except IntegrityError as error:
        db.rollback()
        # Unique event IDs are the gateway delivery idempotency key.
        existing = db.scalar(
            select(PaymentWebhookEvent.id).where(
                PaymentWebhookEvent.provider == "razorpay",
                PaymentWebhookEvent.provider_event_id == event_id,
            )
        )
        if existing:
            return False
        logger.warning("Could not persist Razorpay webhook event", exc_info=error)
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Webhook event could not be recorded"
        ) from error

    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = entity.get("order_id")
    event_type = payload.get("event")
    payment = None
    if order_id and event_type in {"payment.captured", "order.paid"}:
        payment = db.scalar(
            select(Payment).where(Payment.provider_order_id == order_id).with_for_update()
        )
        if payment:
            amount_matches = entity.get("amount") == payment.amount_paise
            currency_matches = entity.get("currency") == payment.currency
            paid = event_type == "order.paid" or entity.get("status") == "captured"
            if amount_matches and currency_matches and paid and entity.get("id"):
                activate_paid_payment(
                    db,
                    payment,
                    provider_payment_id=entity["id"],
                )
            else:
                event.processing_error = "Payment state or amount did not match the stored order"
    elif order_id and event_type == "payment.failed":
        payment = db.scalar(
            select(Payment).where(Payment.provider_order_id == order_id).with_for_update()
        )
        if payment and payment.status not in {"PAID", "REFUNDED"}:
            payment.status = "FAILED"
            payment.failure_code = str(entity.get("error_code", ""))[:80] or None
            payment.failure_message = str(entity.get("error_description", ""))[:500] or None
            membership = db.get(Membership, payment.membership_id)
            if membership and membership.status == "PENDING_PAYMENT":
                membership.status = "CANCELLED"

    event.processed_at = datetime.now(UTC)
    db.commit()
    return True


def razorpay_receipt() -> str:
    return f"fwr_{secrets.token_hex(12)}"


def parse_verified_webhook(raw_body: bytes) -> dict[str, Any]:
    try:
        payload = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Webhook body is not valid JSON"
        ) from error
    if not isinstance(payload, dict):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Webhook payload must be an object")
    return payload
