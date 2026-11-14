import hashlib
import hmac
import json
from uuid import UUID

from app.core.config import settings
from app.db.models import (
    Invoice,
    Membership,
    MembershipPlan,
    Notification,
    Payment,
)
from app.db.session import get_db
from sqlalchemy import func, select


class FakeOrderAPI:
    def __init__(self):
        self.calls = []
        self.order_count = 0

    def create(self, *, data):
        self.calls.append(data)
        self.order_count += 1
        return {
            "id": f"order_test_{self.order_count:03d}",
            "amount": data["amount"],
            "currency": data["currency"],
        }


class FakePaymentAPI:
    def __init__(self):
        self.order_id = "order_test_001"

    def fetch(self, payment_id):
        return {
            "id": payment_id,
            "order_id": self.order_id,
            "amount": self.amount,
            "currency": "INR",
            "status": "captured",
            "captured": True,
        }


class FakeRazorpayClient:
    def __init__(self):
        self.order = FakeOrderAPI()
        self.payment = FakePaymentAPI()


def open_test_db(client):
    generator = client.app.dependency_overrides[get_db]()
    return next(generator), generator


def create_member_and_plan(client, organization, branch):
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Member Test",
            "email": "payments@example.com",
            "password": "strong-payment-password-123",
            "organization_slug": organization.slug,
            "branch_id": str(branch.id),
        },
    )
    assert registration.status_code == 201
    token = registration.json()["access_token"]
    db, generator = open_test_db(client)
    plan = MembershipPlan(
        organization_id=organization.id,
        name="Premium 3 months",
        code="PREMIUM-3M",
        price_paise=249900,
        duration_days=90,
        discount_bps=1000,
        tax_bps=1800,
        benefits=["Personalized program", "Progress tracking"],
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    plan_id = plan.id
    generator.close()
    return token, plan_id


def test_membership_purchase_uses_server_price_and_idempotency(app_client, monkeypatch) -> None:
    client, organization, branch = app_client
    token, plan_id = create_member_and_plan(client, organization, branch)
    fake_client = FakeRazorpayClient()
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_public")
    monkeypatch.setattr(settings, "razorpay_key_secret", "checkout-test-secret")
    monkeypatch.setattr("app.api.v1.routes.memberships.get_razorpay_client", lambda: fake_client)
    headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": "checkout-request-001"}
    body = {"plan_id": str(plan_id)}

    first = client.post("/api/v1/memberships", json=body, headers=headers)
    repeated = client.post("/api/v1/memberships", json=body, headers=headers)

    assert first.status_code == 201
    assert first.json()["amount_paise"] == 265393
    assert first.json()["order_id"] == "order_test_001"
    assert repeated.status_code == 201
    assert repeated.json()["membership_id"] == first.json()["membership_id"]
    assert len(fake_client.order.calls) == 1
    assert fake_client.order.calls[0]["amount"] == 265393
    assert fake_client.order.calls[0]["currency"] == "INR"


def test_checkout_signature_and_razorpay_capture_activate_membership_once(
    app_client, monkeypatch
) -> None:
    client, organization, branch = app_client
    token, plan_id = create_member_and_plan(client, organization, branch)
    fake_client = FakeRazorpayClient()
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_public")
    monkeypatch.setattr(settings, "razorpay_key_secret", "checkout-test-secret")
    monkeypatch.setattr("app.api.v1.routes.memberships.get_razorpay_client", lambda: fake_client)
    headers = {"Authorization": f"Bearer {token}", "Idempotency-Key": "checkout-request-002"}
    order = client.post("/api/v1/memberships", json={"plan_id": str(plan_id)}, headers=headers)
    assert order.status_code == 201

    fake_client.payment.amount = order.json()["amount_paise"]
    payment_id = "pay_test_001"
    signature = hmac.new(
        b"checkout-test-secret",
        f"{order.json()['order_id']}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    verify_body = {
        "razorpay_order_id": order.json()["order_id"],
        "razorpay_payment_id": payment_id,
        "razorpay_signature": signature,
    }
    verified = client.post("/api/v1/payments/verify", json=verify_body, headers=headers)
    repeated = client.post("/api/v1/payments/verify", json=verify_body, headers=headers)

    assert verified.status_code == 200
    assert verified.json()["success"] is True
    assert repeated.status_code == 200
    db, generator = open_test_db(client)
    try:
        membership = db.get(Membership, UUID(order.json()["membership_id"]))
        payment = db.get(Payment, UUID(order.json()["payment_id"]))
        assert membership.status == "ACTIVE"
        assert membership.expires_at > membership.starts_at
        assert payment.status == "PAID"
        assert db.scalar(select(func.count(Invoice.id))) == 1
        assert db.scalar(select(func.count(Notification.id))) == 1
    finally:
        generator.close()
    invoice = client.get(
        f"/api/v1/members/me/payments/{order.json()['payment_id']}/invoice",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invoice.status_code == 200
    assert invoice.headers["content-type"].startswith("text/html")
    assert "FITWITHRAM" in invoice.text
    assert "₹" in invoice.text


def test_paid_renewal_starts_after_existing_membership_expires(app_client, monkeypatch) -> None:
    client, organization, branch = app_client
    token, plan_id = create_member_and_plan(client, organization, branch)
    fake_client = FakeRazorpayClient()
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_public")
    monkeypatch.setattr(settings, "razorpay_key_secret", "checkout-test-secret")
    monkeypatch.setattr("app.api.v1.routes.memberships.get_razorpay_client", lambda: fake_client)
    auth_headers = {"Authorization": f"Bearer {token}"}

    first_order = client.post(
        "/api/v1/memberships",
        json={"plan_id": str(plan_id)},
        headers={**auth_headers, "Idempotency-Key": "renewal-order-first"},
    )
    assert first_order.status_code == 201
    first_payment_id = "pay_renewal_first"
    fake_client.payment.amount = first_order.json()["amount_paise"]
    fake_client.payment.order_id = first_order.json()["order_id"]
    first_signature = hmac.new(
        b"checkout-test-secret",
        f"{first_order.json()['order_id']}|{first_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    first_verified = client.post(
        "/api/v1/payments/verify",
        headers=auth_headers,
        json={
            "razorpay_order_id": first_order.json()["order_id"],
            "razorpay_payment_id": first_payment_id,
            "razorpay_signature": first_signature,
        },
    )
    assert first_verified.status_code == 200

    second_order = client.post(
        "/api/v1/memberships",
        json={"plan_id": str(plan_id)},
        headers={**auth_headers, "Idempotency-Key": "renewal-order-second"},
    )
    assert second_order.status_code == 201
    second_payment_id = "pay_renewal_second"
    fake_client.payment.amount = second_order.json()["amount_paise"]
    fake_client.payment.order_id = second_order.json()["order_id"]
    second_signature = hmac.new(
        b"checkout-test-secret",
        f"{second_order.json()['order_id']}|{second_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    second_verified = client.post(
        "/api/v1/payments/verify",
        headers=auth_headers,
        json={
            "razorpay_order_id": second_order.json()["order_id"],
            "razorpay_payment_id": second_payment_id,
            "razorpay_signature": second_signature,
        },
    )
    assert second_verified.status_code == 200

    db, generator = open_test_db(client)
    try:
        first_membership = db.get(Membership, UUID(first_order.json()["membership_id"]))
        second_membership = db.get(Membership, UUID(second_order.json()["membership_id"]))
        assert second_membership.renewal_of_id == first_membership.id
        assert second_membership.starts_at == first_membership.expires_at
        assert second_membership.expires_at > first_membership.expires_at
    finally:
        generator.close()


def test_verified_webhook_is_idempotent_and_bad_signature_is_rejected(
    app_client, monkeypatch
) -> None:
    client, organization, branch = app_client
    token, plan_id = create_member_and_plan(client, organization, branch)
    fake_client = FakeRazorpayClient()
    monkeypatch.setattr(settings, "razorpay_key_id", "rzp_test_public")
    monkeypatch.setattr(settings, "razorpay_key_secret", "checkout-test-secret")
    monkeypatch.setattr(settings, "razorpay_webhook_secret", "webhook-test-secret")
    monkeypatch.setattr("app.api.v1.routes.memberships.get_razorpay_client", lambda: fake_client)
    sent_membership_emails = []
    monkeypatch.setattr(
        "app.api.v1.routes.memberships.membership_confirmation_email",
        lambda **kwargs: sent_membership_emails.append(kwargs) or True,
    )
    order = client.post(
        "/api/v1/memberships",
        json={"plan_id": str(plan_id)},
        headers={
            "Authorization": f"Bearer {token}",
            "Idempotency-Key": "checkout-request-003",
        },
    )
    assert order.status_code == 201

    event = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_webhook_001",
                    "order_id": order.json()["order_id"],
                    "amount": order.json()["amount_paise"],
                    "currency": "INR",
                    "status": "captured",
                }
            }
        },
    }
    raw = json.dumps(event, separators=(",", ":")).encode()
    signature = hmac.new(b"webhook-test-secret", raw, hashlib.sha256).hexdigest()
    headers = {
        "Content-Type": "application/json",
        "X-Razorpay-Event-Id": "evt_test_001",
        "X-Razorpay-Signature": signature,
    }
    rejected = client.post(
        "/api/v1/payments/webhook", content=raw, headers={**headers, "X-Razorpay-Signature": "bad"}
    )
    first = client.post("/api/v1/payments/webhook", content=raw, headers=headers)
    duplicate = client.post("/api/v1/payments/webhook", content=raw, headers=headers)

    assert rejected.status_code == 400
    assert first.status_code == 200 and first.json() == {"received": True, "processed": True}
    assert duplicate.status_code == 200 and duplicate.json() == {
        "received": True,
        "processed": False,
    }
    assert len(sent_membership_emails) == 1
    db, generator = open_test_db(client)
    try:
        membership = db.get(Membership, UUID(order.json()["membership_id"]))
        assert membership.status == "ACTIVE"
        assert db.scalar(select(func.count(Invoice.id))) == 1
    finally:
        generator.close()
