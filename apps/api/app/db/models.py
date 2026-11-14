from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TenantMixin:
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE"), index=True
    )


class Organization(TimestampMixin, Base):
    __tablename__ = "organizations"
    __table_args__ = (UniqueConstraint("slug", name="uq_organizations_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(100), index=True)
    legal_name: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    branches: Mapped[list[Branch]] = relationship(back_populates="organization")
    users: Mapped[list[User]] = relationship(back_populates="organization")
    membership_plans: Mapped[list[MembershipPlan]] = relationship(back_populates="organization")


class Branch(TimestampMixin, Base):
    __tablename__ = "branches"
    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_branches_org_slug"),
        Index("ix_branches_org_active", "organization_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    postal_code: Mapped[str | None] = mapped_column(String(20))
    country: Mapped[str] = mapped_column(String(2), default="IN", server_default="IN")
    timezone: Mapped[str] = mapped_column(
        String(64), default="Asia/Kolkata", server_default="Asia/Kolkata"
    )
    phone: Mapped[str | None] = mapped_column(String(30))
    business_hours: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    facilities: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    organization: Mapped[Organization] = relationship(back_populates="branches")


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        CheckConstraint(
            "role in ('SUPER_ADMIN','GYM_OWNER','BRANCH_MANAGER','TRAINER','MEMBER')",
            name="ck_users_role",
        ),
        Index("ix_users_org_role_active", "organization_id", "role", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), index=True
    )
    email: Mapped[str] = mapped_column(String(320))
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(160))
    phone: Mapped[str | None] = mapped_column(String(30))
    profile_photo_url: Mapped[str | None] = mapped_column(String(2048))
    role: Mapped[str] = mapped_column(String(32), default="MEMBER", server_default="MEMBER")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped[Organization | None] = relationship(back_populates="users")
    branch_assignments: Mapped[list[UserBranchAssignment]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    member_profile: Mapped[MemberProfile | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    trainer_profile: Mapped[TrainerProfile | None] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )


class UserBranchAssignment(TimestampMixin, Base):
    __tablename__ = "user_branch_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "branch_id", name="uq_user_branch_assignment"),
        CheckConstraint(
            "branch_role in ('BRANCH_MANAGER','TRAINER','MEMBER')", name="ck_assignment_role"
        ),
        Index("ix_assignments_branch_role", "branch_id", "branch_role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    branch_role: Mapped[str] = mapped_column(String(32))

    user: Mapped[User] = relationship(back_populates="branch_assignments")


class MemberProfile(TimestampMixin, Base):
    __tablename__ = "member_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_member_profiles_user"),
        Index("ix_member_profiles_branch_active", "branch_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(24))
    address: Mapped[str | None] = mapped_column(Text)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(160))
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(30))
    height_cm: Mapped[int | None] = mapped_column(Integer)
    current_weight_kg: Mapped[float | None]
    target_weight_kg: Mapped[float | None]
    fitness_goals: Mapped[list[str]] = mapped_column(JSON, default=list)
    preferred_training_type: Mapped[str | None] = mapped_column(String(80))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    user: Mapped[User] = relationship(back_populates="member_profile")


class TrainerProfile(TimestampMixin, Base):
    __tablename__ = "trainer_profiles"
    __table_args__ = (UniqueConstraint("user_id", name="uq_trainer_profiles_user"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    qualifications: Mapped[list[str]] = mapped_column(JSON, default=list)
    specializations: Mapped[list[str]] = mapped_column(JSON, default=list)
    years_experience: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    bio: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    user: Mapped[User] = relationship(back_populates="trainer_profile")


class MembershipPlan(TimestampMixin, Base):
    __tablename__ = "membership_plans"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_membership_plan_org_code"),
        CheckConstraint("price_paise >= 0", name="ck_plan_price_nonnegative"),
        CheckConstraint("duration_days > 0", name="ck_plan_duration_positive"),
        CheckConstraint("discount_bps between 0 and 10000", name="ck_plan_discount_range"),
        Index("ix_membership_plans_org_active", "organization_id", "is_active"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(120))
    code: Mapped[str] = mapped_column(String(40))
    description: Mapped[str | None] = mapped_column(Text)
    price_paise: Mapped[int] = mapped_column(BigInteger)
    duration_days: Mapped[int] = mapped_column(Integer)
    discount_bps: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tax_bps: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    benefits: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    organization: Mapped[Organization] = relationship(back_populates="membership_plans")


class Membership(TimestampMixin, Base):
    __tablename__ = "memberships"
    __table_args__ = (
        CheckConstraint(
            "status in ('PENDING_PAYMENT','ACTIVE','EXPIRED','CANCELLED','SUSPENDED')",
            name="ck_memberships_status",
        ),
        CheckConstraint("amount_paise >= 0", name="ck_membership_amount_nonnegative"),
        Index("ix_memberships_tenant_status", "organization_id", "branch_id", "status"),
        Index("ix_memberships_member_expiry", "member_user_id", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("membership_plans.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(
        String(24), default="PENDING_PAYMENT", server_default="PENDING_PAYMENT"
    )
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    discount_paise: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    tax_paise: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    plan_name_snapshot: Mapped[str | None] = mapped_column(String(120))
    renewal_of_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("memberships.id")
    )

    member: Mapped[User] = relationship(foreign_keys=[member_user_id])
    plan: Mapped[MembershipPlan] = relationship()


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount_paise >= 0", name="ck_payment_amount_nonnegative"),
        CheckConstraint(
            "status in ('CREATED','PENDING','AUTHORIZED','PAID','FAILED','REFUNDED')",
            name="ck_payment_status",
        ),
        UniqueConstraint("provider", "provider_payment_id", name="uq_payment_provider_payment"),
        UniqueConstraint(
            "organization_id", "member_user_id", "idempotency_key", name="uq_payment_idempotency"
        ),
        Index("ix_payments_tenant_date", "organization_id", "branch_id", "created_at"),
        Index("ix_payments_member_status", "member_user_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    membership_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("memberships.id", ondelete="RESTRICT")
    )
    provider: Mapped[str] = mapped_column(String(24), default="phonepe", server_default="phonepe")
    provider_order_id: Mapped[str | None] = mapped_column(String(100), unique=True)
    provider_payment_id: Mapped[str | None] = mapped_column(String(100))
    idempotency_key: Mapped[str | None] = mapped_column(String(100))
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3), default="INR", server_default="INR")
    status: Mapped[str] = mapped_column(String(16), default="CREATED", server_default="CREATED")
    failure_code: Mapped[str | None] = mapped_column(String(80))
    failure_message: Mapped[str | None] = mapped_column(String(500))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    membership: Mapped[Membership] = relationship()


class PaymentWebhookEvent(TimestampMixin, Base):
    __tablename__ = "payment_webhook_events"
    __table_args__ = (
        UniqueConstraint("provider", "provider_event_id", name="uq_webhook_provider_event"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(24))
    provider_event_id: Mapped[str] = mapped_column(String(120))
    event_type: Mapped[str] = mapped_column(String(120))
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processing_error: Mapped[str | None] = mapped_column(String(500))


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"
    __table_args__ = (
        UniqueConstraint("organization_id", "invoice_number", name="uq_invoice_org_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    payment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("payments.id", ondelete="RESTRICT"), unique=True
    )
    invoice_number: Mapped[str] = mapped_column(String(48))
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    amount_paise: Mapped[int] = mapped_column(BigInteger)
    tax_paise: Mapped[int] = mapped_column(BigInteger, default=0, server_default="0")
    currency: Mapped[str] = mapped_column(String(3), default="INR", server_default="INR")


class Attendance(TimestampMixin, Base):
    __tablename__ = "attendance"
    __table_args__ = (
        CheckConstraint(
            "checked_out_at is null or checked_out_at >= checked_in_at",
            name="ck_attendance_time_order",
        ),
        Index("ix_attendance_branch_checkin", "branch_id", "checked_in_at"),
        Index("ix_attendance_member_checkin", "member_user_id", "checked_in_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    checked_out_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checked_in_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id")
    )
    source: Mapped[str] = mapped_column(String(16), default="STAFF", server_default="STAFF")


class WorkoutPlan(TimestampMixin, Base):
    __tablename__ = "workout_plans"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    trainer_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    schedule: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")


class WorkoutExercise(TimestampMixin, Base):
    __tablename__ = "workout_exercises"
    __table_args__ = (Index("ix_workout_exercises_plan_order", "workout_plan_id", "sort_order"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    workout_plan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("workout_plans.id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(160))
    sets: Mapped[int] = mapped_column(Integer)
    repetitions: Mapped[str] = mapped_column(String(32))
    rest_seconds: Mapped[int] = mapped_column(Integer, default=60, server_default="60")
    sort_order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    notes: Mapped[str | None] = mapped_column(Text)


class WorkoutLog(TimestampMixin, Base):
    __tablename__ = "workout_logs"
    __table_args__ = (Index("ix_workout_logs_member_date", "member_user_id", "completed_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    workout_plan_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("workout_plans.id", ondelete="SET NULL")
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    exercise_results: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)


class FitnessProgress(TimestampMixin, Base):
    __tablename__ = "fitness_progress"
    __table_args__ = (Index("ix_fitness_progress_member_date", "member_user_id", "recorded_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    weight_kg: Mapped[float | None]
    body_fat_percent: Mapped[float | None]
    measurements: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    notes: Mapped[str | None] = mapped_column(Text)


class FitnessClass(TimestampMixin, Base):
    __tablename__ = "fitness_classes"
    __table_args__ = (
        CheckConstraint("capacity > 0", name="ck_class_capacity_positive"),
        Index("ix_classes_branch_start", "branch_id", "starts_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    trainer_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT")
    )
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    capacity: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")


class ClassBooking(TimestampMixin, Base):
    __tablename__ = "class_bookings"
    __table_args__ = (
        UniqueConstraint("fitness_class_id", "member_user_id", name="uq_class_booking_member"),
        CheckConstraint(
            "status in ('BOOKED','CANCELLED','ATTENDED','NO_SHOW')", name="ck_class_booking_status"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    fitness_class_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("fitness_classes.id", ondelete="CASCADE")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    status: Mapped[str] = mapped_column(String(16), default="BOOKED", server_default="BOOKED")
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TrainerAssignment(TimestampMixin, Base):
    __tablename__ = "trainer_assignments"
    __table_args__ = (
        UniqueConstraint("trainer_user_id", "member_user_id", name="uq_trainer_member_assignment"),
        Index("ix_trainer_assignments_branch", "branch_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="RESTRICT")
    )
    trainer_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    member_user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_created", "user_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="SET NULL")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(40))
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class ContactEnquiry(TimestampMixin, Base):
    __tablename__ = "contact_enquiries"
    __table_args__ = (Index("ix_enquiries_org_created", "organization_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(320))
    phone: Mapped[str | None] = mapped_column(String(30))
    subject: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(24), default="NEW", server_default="NEW")


class GymSetting(TimestampMixin, Base):
    __tablename__ = "gym_settings"
    __table_args__ = (UniqueConstraint("organization_id", "key", name="uq_gym_setting_org_key"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE")
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="CASCADE")
    )
    key: Mapped[str] = mapped_column(String(100))
    value: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    __table_args__ = (Index("ix_password_reset_user_expiry", "user_id", "expires_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    token_hash: Mapped[str] = mapped_column(String(128), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = (
        UniqueConstraint("token_hash", name="uq_refresh_token_hash"),
        Index("ix_refresh_tokens_user_expiry", "user_id", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    token_hash: Mapped[str] = mapped_column(String(128))
    csrf_hash: Mapped[str | None] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_tenant_created", "organization_id", "branch_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL")
    )
    branch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("branches.id", ondelete="SET NULL")
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    action: Mapped[str] = mapped_column(String(120))
    entity_type: Mapped[str] = mapped_column(String(80))
    entity_id: Mapped[str | None] = mapped_column(String(80))
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    ip_address: Mapped[str | None] = mapped_column(String(45))
