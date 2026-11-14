import csv
import io
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import distinct, func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import accessible_branch_ids, authorize_branch, require_roles
from app.core.security import hash_password
from app.db.models import (
    Branch,
    MemberProfile,
    Membership,
    MembershipPlan,
    Organization,
    Payment,
    RefreshToken,
    TrainerProfile,
    User,
    UserBranchAssignment,
)
from app.db.session import get_db
from app.schemas.auth import AuthUser
from app.schemas.organization import (
    BranchCreate,
    BranchOut,
    BranchUpdate,
    GymOwnerCreate,
    MemberAdminOut,
    MemberCreate,
    MemberListOut,
    MemberProfileUpdate,
    OrganizationCreate,
    OrganizationOut,
    StaffCreate,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles("SUPER_ADMIN")),
) -> list[Organization]:
    return list(db.scalars(select(Organization).order_by(Organization.name)).all())


@router.post("/organizations", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles("SUPER_ADMIN")),
) -> Organization:
    organization = Organization(
        name=payload.name.strip(), slug=payload.slug, legal_name=payload.legal_name
    )
    db.add(organization)
    db.flush()
    db.add_all(
        [
            MembershipPlan(
                organization_id=organization.id,
                name="Basic",
                code="BASIC",
                description="One month of standard gym access and general workout guidance.",
                price_paise=30_000,
                duration_days=30,
                benefits=["Standard gym access", "General workout guidance"],
            ),
            MembershipPlan(
                organization_id=organization.id,
                name="Premium",
                code="PREMIUM",
                description="Three months of gym access with a personalized workout plan.",
                price_paise=30_000,
                duration_days=90,
                benefits=[
                    "Full gym access",
                    "Personalized workout plan",
                    "Fitness progress tracking",
                ],
            ),
            MembershipPlan(
                organization_id=organization.id,
                name="Elite",
                code="ELITE",
                description="A year of premium access, coaching, and priority class booking.",
                price_paise=30_000,
                duration_days=365,
                benefits=[
                    "Premium gym access",
                    "Personal training sessions",
                    "Personalized fitness guidance",
                    "Priority class booking",
                ],
            ),
        ]
    )
    try:
        db.commit()
        db.refresh(organization)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Organization slug is already in use"
        ) from error
    return organization


@router.post(
    "/organizations/{organization_id}/owners",
    response_model=AuthUser,
    status_code=status.HTTP_201_CREATED,
)
def create_gym_owner(
    organization_id: UUID,
    payload: GymOwnerCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles("SUPER_ADMIN")),
) -> User:
    organization = db.get(Organization, organization_id)
    if organization is None or not organization.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    if db.scalar(select(User.id).where(User.email == str(payload.email))):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    owner = User(
        organization_id=organization.id,
        email=str(payload.email),
        password_hash=hash_password(payload.password.get_secret_value()),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role="GYM_OWNER",
    )
    db.add(owner)
    try:
        db.commit()
        db.refresh(owner)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists"
        ) from error
    return owner


@router.get("/branches", response_model=list[BranchOut])
def list_branches(
    organization_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> list[Branch]:
    branch_ids = accessible_branch_ids(db, user)
    query = select(Branch).where(Branch.is_active.is_(True))
    if branch_ids is not None:
        query = query.where(Branch.id.in_(branch_ids))
    if organization_id is not None:
        if user.role == "GYM_OWNER" and organization_id != user.organization_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
        query = query.where(Branch.organization_id == organization_id)
    return list(db.scalars(query.order_by(Branch.name)).all())


@router.post("/branches", response_model=BranchOut, status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER")),
) -> Branch:
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

    branch = Branch(
        organization_id=organization_id,
        name=payload.name.strip(),
        slug=payload.slug,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        timezone=payload.timezone,
        phone=payload.phone,
        business_hours=payload.business_hours,
        facilities=payload.facilities,
    )
    db.add(branch)
    try:
        db.commit()
        db.refresh(branch)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Branch slug is already in use for this organization"
        ) from error
    return branch


@router.patch("/branches/{branch_id}", response_model=BranchOut)
def update_branch(
    branch_id: UUID,
    payload: BranchUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> Branch:
    branch = authorize_branch(db, user, branch_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(branch, key, value)
    db.commit()
    db.refresh(branch)
    return branch


@router.post("/branches/{branch_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_branch(
    branch_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER")),
) -> None:
    branch = authorize_branch(db, user, branch_id)
    branch.is_active = False
    db.commit()


@router.post(
    "/branches/{branch_id}/staff", response_model=AuthUser, status_code=status.HTTP_201_CREATED
)
def create_branch_staff(
    branch_id: UUID,
    payload: StaffCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> User:
    branch = authorize_branch(db, user, branch_id)
    if db.scalar(select(User.id).where(User.email == str(payload.email))):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    staff = User(
        organization_id=branch.organization_id,
        email=str(payload.email),
        password_hash=hash_password(payload.password.get_secret_value()),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role=payload.role,
    )
    db.add(staff)
    try:
        db.flush()
        if payload.role == "TRAINER":
            db.add(
                TrainerProfile(
                    organization_id=branch.organization_id,
                    user_id=staff.id,
                    qualifications=payload.qualifications,
                    specializations=payload.specializations,
                    years_experience=payload.years_experience,
                    bio=payload.bio,
                )
            )
        db.add(
            UserBranchAssignment(
                organization_id=branch.organization_id,
                branch_id=branch.id,
                user_id=staff.id,
                branch_role=payload.role,
            )
        )
        db.commit()
        db.refresh(staff)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists"
        ) from error
    return staff


@router.post("/members", response_model=MemberAdminOut, status_code=status.HTTP_201_CREATED)
def create_member(
    payload: MemberCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> dict:
    branch = authorize_branch(db, user, payload.branch_id)
    if db.scalar(select(User.id).where(User.email == str(payload.email))):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    member = User(
        organization_id=branch.organization_id,
        email=str(payload.email),
        password_hash=hash_password(payload.password.get_secret_value()),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role="MEMBER",
    )
    db.add(member)
    try:
        db.flush()
        db.add(
            MemberProfile(
                organization_id=branch.organization_id,
                branch_id=branch.id,
                user_id=member.id,
                fitness_goals=payload.fitness_goals,
                height_cm=payload.height_cm,
                target_weight_kg=payload.target_weight_kg,
            )
        )
        db.add(
            UserBranchAssignment(
                organization_id=branch.organization_id,
                branch_id=branch.id,
                user_id=member.id,
                branch_role="MEMBER",
            )
        )
        db.commit()
        db.refresh(member)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists"
        ) from error
    return {
        "id": member.id,
        "full_name": member.full_name,
        "email": member.email,
        "phone": member.phone,
        "branch_id": branch.id,
        "is_active": member.is_active,
        "created_at": member.created_at,
    }


@router.get("/members", response_model=MemberListOut)
def list_members(
    branch_id: UUID | None = None,
    q: str | None = Query(default=None, max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> dict:
    branch_ids = accessible_branch_ids(db, user)
    if branch_id is not None:
        authorize_branch(db, user, branch_id)
        branch_ids = [branch_id]
    filters = [User.role == "MEMBER"]
    if branch_ids is not None:
        filters.append(MemberProfile.branch_id.in_(branch_ids))
    if q:
        search = f"%{q.strip()}%"
        filters.append(User.full_name.ilike(search) | User.email.ilike(search))
    total = (
        db.scalar(
            select(func.count(User.id))
            .join(MemberProfile, MemberProfile.user_id == User.id)
            .where(*filters)
        )
        or 0
    )
    rows = db.execute(
        select(User, MemberProfile)
        .join(MemberProfile, MemberProfile.user_id == User.id)
        .where(*filters)
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    member_ids = [account.id for account, _profile in rows]
    membership_by_member: dict[UUID, Membership] = {}
    if member_ids:
        memberships = db.scalars(
            select(Membership)
            .where(
                Membership.member_user_id.in_(member_ids),
                Membership.organization_id == user.organization_id if user.organization_id else True,
                Membership.status.in_(["ACTIVE", "PENDING_PAYMENT"]),
            )
            .order_by(Membership.created_at.desc())
        ).all()
        for membership in memberships:
            membership_by_member.setdefault(membership.member_user_id, membership)
    return {
        "items": [
            {
                "id": account.id,
                "full_name": account.full_name,
                "email": account.email,
                "phone": account.phone,
                "branch_id": profile.branch_id,
                "is_active": account.is_active and profile.is_active,
                "created_at": account.created_at,
                "membership_plan_name": membership_by_member.get(account.id).plan_name_snapshot if account.id in membership_by_member else None,
                "membership_status": membership_by_member.get(account.id).status if account.id in membership_by_member else None,
                "membership_expires_at": membership_by_member.get(account.id).expires_at if account.id in membership_by_member else None,
            }
            for account, profile in rows
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/trainers")
def list_trainers(
    branch_id: UUID | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> list[dict]:
    branch_ids = accessible_branch_ids(db, user)
    query = (
        select(User, TrainerProfile, UserBranchAssignment.branch_id)
        .join(TrainerProfile, TrainerProfile.user_id == User.id)
        .join(UserBranchAssignment, UserBranchAssignment.user_id == User.id)
        .where(
            User.role == "TRAINER",
            User.is_active.is_(True),
            TrainerProfile.is_active.is_(True),
            UserBranchAssignment.branch_role == "TRAINER",
        )
    )
    if branch_ids is not None:
        query = query.where(UserBranchAssignment.branch_id.in_(branch_ids))
    if branch_id is not None:
        authorize_branch(db, user, branch_id)
        query = query.where(UserBranchAssignment.branch_id == branch_id)
    rows = db.execute(query.order_by(User.full_name)).all()
    return [
        {
            "id": trainer.id,
            "full_name": trainer.full_name,
            "email": trainer.email,
            "phone": trainer.phone,
            "branch_id": assignment_branch_id,
            "qualifications": profile.qualifications,
            "specializations": profile.specializations,
            "years_experience": profile.years_experience,
            "bio": profile.bio,
        }
        for trainer, profile, assignment_branch_id in rows
    ]


@router.post("/members/{member_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_member(
    member_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> None:
    profile = db.scalar(select(MemberProfile).where(MemberProfile.user_id == member_id))
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    authorize_branch(db, user, profile.branch_id)
    member = db.get(User, member_id)
    member.is_active = False
    profile.is_active = False
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == member_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()


@router.patch("/members/{member_id}", response_model=MemberAdminOut)
def update_member(
    member_id: UUID,
    payload: MemberProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> dict:
    profile = db.scalar(select(MemberProfile).where(MemberProfile.user_id == member_id))
    member = db.get(User, member_id)
    if profile is None or member is None or member.role != "MEMBER":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member not found")
    authorize_branch(db, user, profile.branch_id)
    changes = payload.model_dump(exclude_unset=True)
    full_name = changes.pop("full_name", None)
    if full_name is not None:
        member.full_name = full_name.strip()
    if "phone" in payload.model_fields_set:
        member.phone = changes.pop("phone", None)
    if "profile_photo_url" in payload.model_fields_set:
        image_url = changes.pop("profile_photo_url", None)
        member.profile_photo_url = str(image_url) if image_url is not None else None
    for field, value in changes.items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(member)
    return {
        "id": member.id,
        "full_name": member.full_name,
        "email": member.email,
        "phone": member.phone,
        "branch_id": profile.branch_id,
        "is_active": member.is_active and profile.is_active,
        "created_at": member.created_at,
    }


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> dict[str, int]:
    branch_ids = accessible_branch_ids(db, user)
    if branch_ids == []:
        return {
            "total_members": 0,
            "active_members": 0,
            "inactive_members": 0,
            "total_trainers": 0,
            "total_branches": 0,
            "monthly_revenue_paise": 0,
            "annual_revenue_paise": 0,
            "pending_payments": 0,
            "expiring_memberships": 0,
        }

    now = datetime.now(UTC)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    def scoped(query, column):
        if branch_ids is not None:
            query = query.where(column.in_(branch_ids))
        return query

    total_members = (
        db.scalar(
            scoped(
                select(func.count(distinct(User.id)))
                .join(UserBranchAssignment, UserBranchAssignment.user_id == User.id)
                .where(User.role == "MEMBER", User.is_active.is_(True)),
                UserBranchAssignment.branch_id,
            )
        )
        or 0
    )
    active_members = (
        db.scalar(
            scoped(
                select(func.count(distinct(Membership.member_user_id))).where(
                    Membership.status == "ACTIVE", Membership.expires_at > now
                ),
                Membership.branch_id,
            )
        )
        or 0
    )
    total_trainers = (
        db.scalar(
            scoped(
                select(func.count(distinct(User.id)))
                .join(UserBranchAssignment, UserBranchAssignment.user_id == User.id)
                .where(User.role == "TRAINER", User.is_active.is_(True)),
                UserBranchAssignment.branch_id,
            )
        )
        or 0
    )
    total_branches_query = select(func.count(Branch.id)).where(Branch.is_active.is_(True))
    if branch_ids is not None:
        total_branches_query = total_branches_query.where(Branch.id.in_(branch_ids))
    total_branches = db.scalar(total_branches_query) or 0

    def revenue_since(start: datetime) -> int:
        query = select(func.coalesce(func.sum(Payment.amount_paise), 0)).where(
            Payment.status == "PAID", Payment.paid_at >= start
        )
        return int(db.scalar(scoped(query, Payment.branch_id)) or 0)

    pending_query = select(func.count(Payment.id)).where(
        Payment.status.in_(["CREATED", "PENDING", "AUTHORIZED"])
    )
    expiring_query = select(func.count(Membership.id)).where(
        Membership.status == "ACTIVE",
        Membership.expires_at > now,
        Membership.expires_at <= now + timedelta(days=30),
    )
    pending_payments = db.scalar(scoped(pending_query, Payment.branch_id)) or 0
    expiring_memberships = db.scalar(scoped(expiring_query, Membership.branch_id)) or 0
    return {
        "total_members": int(total_members),
        "active_members": int(active_members),
        "inactive_members": max(0, int(total_members) - int(active_members)),
        "total_trainers": int(total_trainers),
        "total_branches": int(total_branches),
        "monthly_revenue_paise": revenue_since(month_start),
        "annual_revenue_paise": revenue_since(year_start),
        "pending_payments": int(pending_payments),
        "expiring_memberships": int(expiring_memberships),
    }


@router.get("/payments")
def list_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    branch_id: UUID | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> dict:
    branch_ids = accessible_branch_ids(db, user)
    query = select(Payment, User).join(User, User.id == Payment.member_user_id)
    count_query = select(func.count(Payment.id))
    if branch_ids is not None:
        query = query.where(Payment.branch_id.in_(branch_ids))
        count_query = count_query.where(Payment.branch_id.in_(branch_ids))
    if branch_id is not None:
        authorize_branch(db, user, branch_id)
        query = query.where(Payment.branch_id == branch_id)
        count_query = count_query.where(Payment.branch_id == branch_id)
    if status_filter:
        normalized = status_filter.upper()
        if normalized not in {"CREATED", "PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"}:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unsupported payment status")
        query = query.where(Payment.status == normalized)
        count_query = count_query.where(Payment.status == normalized)
    total = db.scalar(count_query) or 0
    rows = db.execute(
        query.order_by(Payment.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [
            {
                "id": payment.id,
                "member_user_id": member.id,
                "member_name": member.full_name,
                "member_email": member.email,
                "branch_id": payment.branch_id,
                "amount_paise": payment.amount_paise,
                "currency": payment.currency,
                "status": payment.status,
                "provider": payment.provider,
                "provider_payment_id": payment.provider_payment_id,
                "paid_at": payment.paid_at,
                "created_at": payment.created_at,
            }
            for payment, member in rows
        ],
        "page": page,
        "page_size": page_size,
        "total": total,
    }


@router.get("/payments.csv", response_class=Response)
def export_payments_csv(
    branch_id: UUID | None = None,
    payment_status: str | None = Query(default=None, alias="status"),
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("SUPER_ADMIN", "GYM_OWNER", "BRANCH_MANAGER")),
) -> Response:
    branch_ids = accessible_branch_ids(db, user)
    query = select(Payment, User).join(User, User.id == Payment.member_user_id)
    if branch_ids is not None:
        query = query.where(Payment.branch_id.in_(branch_ids))
    if branch_id is not None:
        authorize_branch(db, user, branch_id)
        query = query.where(Payment.branch_id == branch_id)
    if payment_status:
        normalized_status = payment_status.upper()
        if normalized_status not in {
            "CREATED",
            "PENDING",
            "AUTHORIZED",
            "PAID",
            "FAILED",
            "REFUNDED",
        }:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unsupported payment status")
        query = query.where(Payment.status == normalized_status)
    if from_date:
        query = query.where(Payment.created_at >= from_date)
    if to_date:
        query = query.where(Payment.created_at < to_date)
    rows = db.execute(query.order_by(Payment.created_at.desc())).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "payment_id",
            "member_name",
            "member_email",
            "branch_id",
            "amount_inr",
            "currency",
            "status",
            "provider",
            "provider_payment_id",
            "paid_at",
            "created_at",
        ]
    )
    for payment, member in rows:
        writer.writerow(
            [
                payment.id,
                member.full_name,
                member.email,
                payment.branch_id,
                f"{payment.amount_paise / 100:.2f}",
                payment.currency,
                payment.status,
                payment.provider,
                payment.provider_payment_id or "",
                payment.paid_at or "",
                payment.created_at,
            ]
        )
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="fitwithram-payments.csv"'},
    )
