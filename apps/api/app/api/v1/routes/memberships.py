import html
import hashlib
import hmac
import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.core.config import settings
from app.db.models import (
    Branch,
    Invoice,
    MemberProfile,
    Membership,
    MembershipPlan,
    Organization,
    Payment,
    PaymentWebhookEvent,
    User,
)
from app.db.session import get_db
from app.schemas.membership import (
    MembershipOrderRequest,
    MembershipOrderResponse,
    MembershipPlanCreate,
    MembershipPlanOut,
    MembershipPlanUpdate,
    VerifyPaymentRequest,
)
from app.services.email import membership_confirmation_email
from app.services.payments import (
    activate_paid_payment,
    create_phonepe_order,
    fetch_phonepe_order,
    get_razorpay_client,
    parse_verified_webhook,
    process_webhook_event,
    razorpay_receipt,
    verify_checkout_signature,
    verify_webhook_signature,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["memberships"])


@router.get("/members/me/membership-plans", response_model=list[MembershipPlanOut])
def list_member_membership_plans(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("MEMBER")),
) -> list[MembershipPlan]:
    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == user.id,
            MemberProfile.organization_id == user.organization_id,
            MemberProfile.is_active.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")
    return list(
        db.scalars(
            select(MembershipPlan)
            .where(
                MembershipPlan.organization_id == profile.organization_id,
                MembershipPlan.is_active.is_(True),
                (MembershipPlan.branch_id.is_(None))
                | (MembershipPlan.branch_id == profile.branch_id),
            )
            .order_by(MembershipPlan.price_paise)
        ).all()
    )


@router.get("/membership-plans", response_model=list[MembershipPlanOut])
def list_membership_plans(
    organization_slug: str,
    branch_id: UUID | None = None,
    db: Session = Depends(get_db),
) -> list[MembershipPlan]:
    organization = db.scalar(
        select(Organization).where(
            Organization.slug == organization_slug.lower(), Organization.is_active.is_(True)
        )
    )
    if organization is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    query = select(MembershipPlan).where(
        MembershipPlan.organization_id == organization.id,
        MembershipPlan.is_active.is_(True),
    )
    if branch_id:
        branch = db.scalar(
            select(Branch).where(
                Branch.id == branch_id,
                Branch.organization_id == organization.id,
                Branch.is_active.is_(True),
            )
        )
        if branch is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
        query = query.where(
            (MembershipPlan.branch_id.is_(None)) | (MembershipPlan.branch_id == branch_id)
        )
    else:
        query = query.where(MembershipPlan.branch_id.is_(None))
    return list(db.scalars(query.order_by(MembershipPlan.price_paise)).all())


@router.get("/admin/membership-plans", response_model=list[MembershipPlanOut])
def list_admin_membership_plans(
    organization_id: UUID | None = None,
    branch_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER")),
) -> list[MembershipPlan]:
    if user.role == "SUPER_ADMIN":
        if organization_id is None and branch_id is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "organization_id or branch_id is required",
            )
        selected_branch = db.get(Branch, branch_id) if branch_id is not None else None
        if branch_id is not None and selected_branch is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
        org_id = organization_id or (selected_branch.organization_id if selected_branch else None)
    else:
        org_id = user.organization_id
        if organization_id is not None and organization_id != org_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    query = select(MembershipPlan).where(MembershipPlan.organization_id == org_id)
    if branch_id is not None:
        branch = db.scalar(
            select(Branch).where(
                Branch.id == branch_id,
                Branch.organization_id == org_id,
                Branch.is_active.is_(True),
            )
        )
        if branch is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
        query = query.where(
            (MembershipPlan.branch_id.is_(None)) | (MembershipPlan.branch_id == branch_id)
        )
    return list(db.scalars(query.order_by(MembershipPlan.price_paise)).all())


@router.post(
    "/admin/membership-plans",
    response_model=MembershipPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def create_membership_plan(
    payload: MembershipPlanCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER")),
) -> MembershipPlan:
    if user.role == "SUPER_ADMIN":
        organization_id = payload.organization_id
        if organization_id is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "organization_id is required")
    else:
        organization_id = user.organization_id
        if organization_id is None:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Owner account has no organization")

    organization = db.get(Organization, organization_id)
    if organization is None or not organization.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    if payload.branch_id:
        branch = db.scalar(
            select(Branch).where(
                Branch.id == payload.branch_id,
                Branch.organization_id == organization_id,
                Branch.is_active.is_(True),
            )
        )
        if branch is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")

    plan = MembershipPlan(
        organization_id=organization_id,
        branch_id=payload.branch_id,
        name=payload.name.strip(),
        code=payload.code,
        description=payload.description,
        price_paise=payload.price_paise,
        duration_days=payload.duration_days,
        discount_bps=payload.discount_bps,
        tax_bps=payload.tax_bps,
        benefits=payload.benefits,
    )
    db.add(plan)
    try:
        db.commit()
        db.refresh(plan)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "A plan with this code already exists"
        ) from error
    return plan


@router.patch("/admin/membership-plans/{plan_id}", response_model=MembershipPlanOut)
def update_membership_plan(
    plan_id: UUID,
    payload: MembershipPlanUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER")),
) -> MembershipPlan:
    plan = db.get(MembershipPlan, plan_id)
    if plan is None or (
        user.role != "SUPER_ADMIN" and plan.organization_id != user.organization_id
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Membership plan not found")
    changes = payload.model_dump(exclude_unset=True)
    if "branch_id" in changes and changes["branch_id"] is not None:
        branch = db.scalar(
            select(Branch).where(
                Branch.id == changes["branch_id"],
                Branch.organization_id == plan.organization_id,
                Branch.is_active.is_(True),
            )
        )
        if branch is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
    for key, value in changes.items():
        setattr(plan, key, value)
    try:
        db.commit()
        db.refresh(plan)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "A plan with this code already exists"
        ) from error
    return plan


@router.post(
    "/memberships", response_model=MembershipOrderResponse, status_code=status.HTTP_201_CREATED
)
def create_membership_order(
    payload: MembershipOrderRequest,
    response: Response,
    idempotency_key: str = Header(alias="Idempotency-Key", min_length=8, max_length=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("MEMBER")),
) -> MembershipOrderResponse:
    # PhonePe checkout is created server-side; secrets never reach the browser.
    if not settings.phonepe_client_id or not settings.phonepe_client_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "PhonePe is not configured")
    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == user.id,
            MemberProfile.organization_id == user.organization_id,
            MemberProfile.is_active.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")

    plan = db.scalar(
        select(MembershipPlan).where(
            MembershipPlan.id == payload.plan_id,
            MembershipPlan.organization_id == profile.organization_id,
            MembershipPlan.is_active.is_(True),
            (MembershipPlan.branch_id.is_(None)) | (MembershipPlan.branch_id == profile.branch_id),
        )
    )
    if plan is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Membership plan not found")

    existing = db.scalar(
        select(Payment).where(
            Payment.organization_id == profile.organization_id,
            Payment.member_user_id == user.id,
            Payment.idempotency_key == idempotency_key,
        )
    )
    if existing:
        if (
            existing.membership_id is None
            or db.get(Membership, existing.membership_id).plan_id != plan.id
        ):
            raise HTTPException(
                status.HTTP_409_CONFLICT, "Idempotency key was used for a different request"
            )
        if existing.provider_order_id:
            return MembershipOrderResponse(
                membership_id=existing.membership_id,
                payment_id=existing.id,
                order_id=existing.provider_order_id,
                amount_paise=existing.amount_paise,
                currency=existing.currency,
                redirect_url=create_phonepe_order(
                    order_id=existing.provider_order_id,
                    amount_paise=existing.amount_paise,
                    redirect_url=f"{settings.web_app_url}/app?phonepe_order_id={existing.provider_order_id}",
                    phone=user.phone,
                ),
            )
        raise HTTPException(
            status.HTTP_409_CONFLICT, "This order request is already being processed"
        )

    discount_paise = plan.price_paise * plan.discount_bps // 10_000
    discounted_paise = plan.price_paise - discount_paise
    tax_paise = discounted_paise * plan.tax_bps // 10_000
    amount_paise = discounted_paise + tax_paise
    if amount_paise <= 0:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Plan total must be greater than zero"
        )

    membership = Membership(
        organization_id=profile.organization_id,
        branch_id=profile.branch_id,
        member_user_id=user.id,
        plan_id=plan.id,
        status="PENDING_PAYMENT",
        amount_paise=amount_paise,
        discount_paise=discount_paise,
        tax_paise=tax_paise,
        plan_name_snapshot=plan.name,
    )
    db.add(membership)
    db.flush()
    payment = Payment(
        organization_id=profile.organization_id,
        branch_id=profile.branch_id,
        member_user_id=user.id,
        membership_id=membership.id,
        provider="phonepe",
        amount_paise=amount_paise,
        currency="INR",
        status="CREATED",
        idempotency_key=idempotency_key,
    )
    db.add(payment)
    try:
        db.commit()
        db.refresh(payment)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Duplicate order request") from error

    order_id = f"FWR-{payment.id.hex}"
    try:
        redirect_url = create_phonepe_order(
            order_id=order_id,
            amount_paise=amount_paise,
            redirect_url=f"{settings.web_app_url}/app?phonepe_order_id={order_id}",
            phone=user.phone,
        )
    except Exception as error:
        logger.warning("PhonePe order creation failed", exc_info=error)
        payment.status = "FAILED"
        membership.status = "CANCELLED"
        db.commit()
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "Unable to create a PhonePe order"
        ) from error

    payment.provider_order_id = order_id
    payment.status = "PENDING"
    db.commit()
    response.status_code = status.HTTP_201_CREATED
    return MembershipOrderResponse(
        membership_id=membership.id,
        payment_id=payment.id,
        order_id=order_id,
        amount_paise=amount_paise,
        currency="INR",
        redirect_url=redirect_url,
    )


@router.get("/payments/phonepe/status/{order_id}")
def phonepe_payment_status(
    order_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("MEMBER")),
) -> dict[str, str | bool]:
    payment = db.scalar(select(Payment).where(
        Payment.provider_order_id == order_id,
        Payment.member_user_id == user.id,
        Payment.organization_id == user.organization_id,
        Payment.provider == "phonepe",
    ))
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment order not found")
    if payment.status == "PAID":
        return {"success": True, "status": "PAID", "message": "Membership activated"}
    result = fetch_phonepe_order(order_id)
    if result.get("amount") != payment.amount_paise:
        raise HTTPException(status.HTTP_409_CONFLICT, "PhonePe payment amount does not match")
    state = result.get("state")
    if state == "COMPLETED":
        details = result.get("paymentDetails") or []
        reference = next((item.get("transactionId") for item in details if item.get("transactionId")), None)
        if not reference:
            raise HTTPException(status.HTTP_409_CONFLICT, "PhonePe payment reference is missing")
        activate_paid_payment(db, payment, provider_payment_id=reference)
        db.commit()
        return {"success": True, "status": "PAID", "message": "Membership activated"}
    if state == "FAILED":
        payment.status = "FAILED"
        membership = db.get(Membership, payment.membership_id)
        if membership:
            membership.status = "CANCELLED"
        db.commit()
        return {"success": False, "status": "FAILED", "message": "Payment did not complete"}
    payment.status = "PENDING"
    db.commit()
    return {"success": False, "status": "PENDING", "message": "Payment is still processing"}


@router.post("/payments/phonepe/webhook")
async def phonepe_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, bool]:
    """Handle PhonePe server notifications; browser redirects are never trusted for activation."""
    if not settings.phonepe_webhook_username or not settings.phonepe_webhook_password:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "PhonePe webhook is not configured")
    expected = hashlib.sha256(
        f"{settings.phonepe_webhook_username}:{settings.phonepe_webhook_password}".encode()
    ).hexdigest()
    supplied = request.headers.get("authorization", "")
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "PhonePe webhook authorization is invalid")
    try:
        event = await request.json()
    except ValueError as error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid PhonePe webhook payload") from error
    payload = event.get("payload", {}) if isinstance(event, dict) else {}
    if not isinstance(payload, dict):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid PhonePe webhook payload")
    order_id = payload.get("merchantOrderId")
    state = payload.get("state")
    if not order_id or not state:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "PhonePe webhook order or state is missing")
    payment = db.scalar(select(Payment).where(
        Payment.provider_order_id == order_id,
        Payment.provider == "phonepe",
    ).with_for_update())
    if payment is None:
        return {"received": True, "processed": False}
    details = payload.get("paymentDetails") or []
    transaction_id = next((item.get("transactionId") for item in details if item.get("transactionId")), None)
    event_id = str(event.get("eventId") or f"{order_id}:{state}:{transaction_id or ''}")[:120]
    duplicate = db.scalar(select(PaymentWebhookEvent.id).where(
        PaymentWebhookEvent.provider == "phonepe",
        PaymentWebhookEvent.provider_event_id == event_id,
    ))
    if duplicate:
        return {"received": True, "processed": False}
    db.add(PaymentWebhookEvent(
        provider="phonepe", provider_event_id=event_id,
        event_type=str(event.get("event", state))[:120], payload=event,
    ))
    if state == "COMPLETED":
        if payload.get("amount") != payment.amount_paise or not transaction_id:
            db.rollback()
            raise HTTPException(status.HTTP_409_CONFLICT, "PhonePe webhook amount or transaction does not match")
        activate_paid_payment(db, payment, provider_payment_id=transaction_id)
    elif state == "FAILED":
        payment.status = "FAILED"
        membership = db.get(Membership, payment.membership_id)
        if membership:
            membership.status = "CANCELLED"
    else:
        payment.status = "PENDING"
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"received": True, "processed": False}
    return {"received": True, "processed": True}


@router.post("/payments/verify")
def verify_checkout_payment(
    payload: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("MEMBER")),
) -> dict[str, str | bool]:
    order_id = payload.razorpay_order_id
    payment_id = payload.razorpay_payment_id
    signature = payload.razorpay_signature
    payment = db.scalar(
        select(Payment).where(
            Payment.provider_order_id == order_id,
            Payment.member_user_id == user.id,
            Payment.provider == "razorpay",
        )
    )
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payment order not found")
    if payment.status == "PAID" and payment.provider_payment_id == payment_id:
        return {"success": True, "message": "Payment is already confirmed"}
    if not verify_checkout_signature(order_id, payment_id, signature):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Payment signature is invalid")

    client = get_razorpay_client()
    try:
        provider_payment = client.payment.fetch(payment_id)
    except Exception as error:
        logger.warning("Razorpay payment lookup failed", exc_info=error)
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, "Unable to confirm the payment with Razorpay"
        ) from error
    if (
        provider_payment.get("order_id") != order_id
        or provider_payment.get("amount") != payment.amount_paise
        or provider_payment.get("currency") != payment.currency
        or provider_payment.get("status") != "captured"
        or provider_payment.get("captured") is not True
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Razorpay has not confirmed a matching captured payment"
        )

    activate_paid_payment(db, payment, provider_payment_id=payment_id)
    db.commit()
    return {"success": True, "message": "Membership activated"}


@router.post("/payments/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, bool]:
    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    if not verify_webhook_signature(raw_body, signature):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Webhook signature is invalid")
    event_id = request.headers.get("x-razorpay-event-id")
    if not event_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Webhook event ID is required")
    event_payload = parse_verified_webhook(raw_body)
    processed = process_webhook_event(db, event_id=event_id, payload=event_payload)
    if processed and event_payload.get("event") in {"payment.captured", "order.paid"}:
        entity = event_payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = entity.get("order_id")
        payment = (
            db.scalar(select(Payment).where(Payment.provider_order_id == order_id))
            if order_id
            else None
        )
        if payment is not None and payment.status == "PAID":
            membership = db.get(Membership, payment.membership_id)
            member = db.get(User, payment.member_user_id)
            if member is not None and membership is not None and membership.expires_at is not None:
                membership_confirmation_email(
                    to=member.email,
                    member_name=member.full_name,
                    plan_name=membership.plan_name_snapshot or "Membership",
                    expires_at=membership.expires_at,
                )
    return {"received": True, "processed": processed}


@router.get("/members/me/payments")
def list_my_payments(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    page_size = min(100, max(1, limit))
    start = max(0, offset)
    payments = list(
        db.scalars(
            select(Payment)
            .where(
                Payment.member_user_id == user.id, Payment.organization_id == user.organization_id
            )
            .order_by(Payment.created_at.desc())
            .offset(start)
            .limit(page_size)
        ).all()
    )
    items = []
    for payment in payments:
        membership = db.get(Membership, payment.membership_id)
        invoice = db.scalar(select(Invoice).where(Invoice.payment_id == payment.id))
        items.append(
            {
                "id": str(payment.id),
                "membership_id": str(payment.membership_id),
                "plan_name": membership.plan_name_snapshot if membership else None,
                "amount_paise": payment.amount_paise,
                "currency": payment.currency,
                "status": payment.status,
                "provider": payment.provider,
                "provider_order_id": payment.provider_order_id,
                "provider_payment_id": payment.provider_payment_id,
                "paid_at": payment.paid_at,
                "created_at": payment.created_at,
                "invoice_number": invoice.invoice_number if invoice else None,
            }
        )
    return {"items": items, "limit": page_size, "offset": start}


@router.get("/members/me/payments/{payment_id}/invoice")
def download_my_invoice(
    payment_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("MEMBER")),
) -> Response:
    payment = db.scalar(
        select(Payment).where(
            Payment.id == payment_id,
            Payment.member_user_id == user.id,
            Payment.organization_id == user.organization_id,
            Payment.status == "PAID",
        )
    )
    invoice = db.scalar(select(Invoice).where(Invoice.payment_id == payment_id))
    if payment is None or invoice is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Paid invoice not found")
    membership = db.get(Membership, payment.membership_id)
    branch = db.get(Branch, payment.branch_id)
    organization = db.get(Organization, payment.organization_id)
    invoice_no = html.escape(invoice.invoice_number)
    org_name = html.escape(organization.name if organization else "FITWITHRAM")
    member_name = html.escape(user.full_name)
    member_email = html.escape(user.email)
    branch_name = html.escape(branch.name if branch else "")
    plan_name = html.escape(membership.plan_name_snapshot if membership else "Membership")
    paid_at = html.escape(str(payment.paid_at or invoice.issued_at))
    amount = f"₹{invoice.amount_paise / 100:,.2f}"
    payment_reference = html.escape(payment.provider_payment_id or str(payment.id))
    currency = html.escape(invoice.currency)
    document = f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Invoice {invoice_no}</title>
<style>
body {{ font: 16px Arial, sans-serif; color: #222; max-width: 760px; margin: 50px auto;
  padding: 0 24px; }}
header {{ display: flex; justify-content: space-between; border-bottom: 3px solid #f97316;
  padding-bottom: 20px; }}
h1 {{ font-size: 28px; }} table {{ width: 100%; border-collapse: collapse; margin-top: 36px; }}
td, th {{ padding: 14px; border-bottom: 1px solid #ddd; text-align: left; }}
.total {{ text-align: right; font-size: 22px; font-weight: bold; margin-top: 24px; }}
small {{ color: #666; }}
</style></head>
<body>
<header><div><h1>{org_name}</h1><small>Tax invoice / payment receipt</small></div>
<div><strong>{invoice_no}</strong><br><small>{paid_at}</small></div></header>
<p><strong>Billed to</strong><br>{member_name}<br>{member_email}<br>{branch_name}</p>
<table><thead><tr><th>Description</th><th>Currency</th><th>Amount</th></tr></thead>
<tbody><tr><td>{plan_name}</td><td>{currency}</td><td>{amount}</td></tr></tbody></table>
<p class="total">Total paid: {amount}</p>
<small>Payment reference: {payment_reference}<br>Generated by FITWITHRAM.</small>
</body></html>"""
    return Response(
        content=document,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="{invoice_no}.html"'},
    )


@router.get("/members/me/membership")
def get_my_membership(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("MEMBER")),
) -> dict | None:
    now = datetime.now(UTC)
    membership = db.scalar(
        select(Membership)
        .where(
            Membership.member_user_id == user.id,
            Membership.organization_id == user.organization_id,
            Membership.status == "ACTIVE",
            Membership.starts_at <= now,
            Membership.expires_at > now,
        )
        .order_by(Membership.expires_at.desc())
        .limit(1)
    )
    if membership is None:
        membership = db.scalar(
            select(Membership)
            .where(
                Membership.member_user_id == user.id,
                Membership.organization_id == user.organization_id,
                Membership.status == "ACTIVE",
                Membership.starts_at > now,
            )
            .order_by(Membership.starts_at)
            .limit(1)
        )
    if membership is None:
        membership = db.scalar(
            select(Membership)
            .where(
                Membership.member_user_id == user.id,
                Membership.organization_id == user.organization_id,
            )
            .order_by(Membership.created_at.desc())
            .limit(1)
        )
    if membership is None:
        return None
    return {
        "id": membership.id,
        "plan_name": membership.plan_name_snapshot,
        "status": membership.status,
        "starts_at": membership.starts_at,
        "expires_at": membership.expires_at,
        "amount_paise": membership.amount_paise,
    }
