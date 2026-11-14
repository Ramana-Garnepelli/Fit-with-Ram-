import re
from datetime import date, datetime
from uuid import UUID

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    field_validator,
    model_validator,
)


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=100)
    legal_name: str | None = Field(default=None, max_length=200)

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        if len(slug) < 2:
            raise ValueError("Organization slug must contain at least two letters or digits")
        return slug


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    legal_name: str | None
    is_active: bool


class ContactEnquiryCreate(BaseModel):
    branch_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    subject: str = Field(min_length=2, max_length=160)
    message: str = Field(min_length=10, max_length=5000)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("name", "subject", "message")
    @classmethod
    def trim_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field cannot be blank")
        return normalized


class GymOwnerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: SecretStr = Field(min_length=12, max_length=128)
    phone: str | None = Field(default=None, max_length=30)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: SecretStr = Field(min_length=12, max_length=128)
    phone: str | None = Field(default=None, max_length=30)
    role: str = Field(pattern="^(BRANCH_MANAGER|TRAINER)$")
    qualifications: list[str] = Field(default_factory=list, max_length=30)
    specializations: list[str] = Field(default_factory=list, max_length=30)
    years_experience: int = Field(default=0, ge=0, le=80)
    bio: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class MemberCreate(BaseModel):
    branch_id: UUID
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    password: SecretStr = Field(min_length=12, max_length=128)
    phone: str | None = Field(default=None, max_length=30)
    fitness_goals: list[str] = Field(default_factory=list, max_length=20)
    height_cm: int | None = Field(default=None, ge=80, le=260)
    target_weight_kg: float | None = Field(default=None, ge=20, le=400)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class MemberProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    phone: str | None = Field(default=None, max_length=30)
    profile_photo_url: AnyHttpUrl | None = None
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=24)
    address: str | None = Field(default=None, max_length=1000)
    emergency_contact_name: str | None = Field(default=None, max_length=160)
    emergency_contact_phone: str | None = Field(default=None, max_length=30)
    height_cm: int | None = Field(default=None, ge=80, le=260)
    current_weight_kg: float | None = Field(default=None, ge=20, le=400)
    target_weight_kg: float | None = Field(default=None, ge=20, le=400)
    fitness_goals: list[str] | None = Field(default=None, max_length=20)
    preferred_training_type: str | None = Field(default=None, max_length=80)

    @field_validator("profile_photo_url")
    @classmethod
    def secure_profile_image_url(cls, value: AnyHttpUrl | None):
        if value is not None and value.scheme != "https":
            raise ValueError("Profile image URLs must use HTTPS")
        return value


class MemberPasswordChange(BaseModel):
    current_password: SecretStr
    new_password: SecretStr = Field(min_length=12, max_length=128)


class MemberAdminOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: str | None
    branch_id: UUID
    is_active: bool
    created_at: datetime
    membership_plan_name: str | None = None
    membership_status: str | None = None
    membership_expires_at: datetime | None = None


class MemberListOut(BaseModel):
    items: list[MemberAdminOut]
    page: int
    page_size: int
    total: int


class TrainerAssignmentCreate(BaseModel):
    trainer_user_id: UUID
    member_user_id: UUID


class WorkoutExerciseInput(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    sets: int = Field(ge=1, le=50)
    repetitions: str = Field(min_length=1, max_length=32)
    rest_seconds: int = Field(default=60, ge=0, le=3600)
    notes: str | None = None


class TrainerWorkoutCreate(BaseModel):
    member_user_id: UUID
    title: str = Field(min_length=2, max_length=160)
    description: str | None = None
    schedule: dict = Field(default_factory=dict)
    exercises: list[WorkoutExerciseInput] = Field(min_length=1, max_length=40)


class ProgressCreate(BaseModel):
    weight_kg: float | None = Field(default=None, ge=20, le=400)
    body_fat_percent: float | None = Field(default=None, ge=1, le=80)
    measurements: dict = Field(default_factory=dict)
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def require_measurement(self):
        if self.weight_kg is None and self.body_fat_percent is None and not self.measurements:
            raise ValueError("Provide a weight, body-fat value, or measurement")
        return self


class WorkoutLogCreate(BaseModel):
    workout_plan_id: UUID | None = None
    duration_minutes: int | None = Field(default=None, ge=1, le=600)
    notes: str | None = Field(default=None, max_length=2000)
    exercise_results: list[dict] = Field(default_factory=list, max_length=50)


class FitnessClassCreate(BaseModel):
    trainer_user_id: UUID
    title: str = Field(min_length=2, max_length=160)
    description: str | None = None
    starts_at: datetime
    ends_at: datetime
    capacity: int = Field(ge=1, le=500)

    @field_validator("ends_at")
    @classmethod
    def end_after_start(cls, value: datetime, info):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Class times must include a timezone")
        starts_at = info.data.get("starts_at")
        if starts_at is not None and value <= starts_at:
            raise ValueError("Class end time must be after its start time")
        return value

    @field_validator("starts_at")
    @classmethod
    def start_has_timezone(cls, value: datetime):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Class times must include a timezone")
        return value


class BranchCreate(BaseModel):
    organization_id: UUID | None = None
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(min_length=2, max_length=100)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str = Field(default="IN", min_length=2, max_length=2)
    timezone: str = Field(default="Asia/Kolkata", max_length=64)
    phone: str | None = Field(default=None, max_length=30)
    business_hours: dict = Field(default_factory=dict)
    facilities: list[str] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
        if len(slug) < 2:
            raise ValueError("Branch slug must contain at least two letters or digits")
        return slug

    @field_validator("country")
    @classmethod
    def uppercase_country(cls, value: str) -> str:
        return value.upper()


class BranchUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, min_length=2, max_length=2)
    timezone: str | None = Field(default=None, max_length=64)
    phone: str | None = Field(default=None, max_length=30)
    business_hours: dict | None = None
    facilities: list[str] | None = None


class BranchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    slug: str
    address: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    country: str
    timezone: str
    phone: str | None
    business_hours: dict
    facilities: list[str]
    is_active: bool
