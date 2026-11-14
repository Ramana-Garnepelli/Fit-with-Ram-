from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MembershipPlanCreate(BaseModel):
    organization_id: UUID | None = None
    branch_id: UUID | None = None
    name: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=2, max_length=40)
    description: str | None = None
    price_paise: int = Field(ge=0, le=100_000_000)
    duration_days: int = Field(gt=0, le=3650)
    discount_bps: int = Field(default=0, ge=0, le=10_000)
    tax_bps: int = Field(default=0, ge=0, le=10_000)
    benefits: list[str] = Field(default_factory=list, max_length=30)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper().replace(" ", "-")


class MembershipPlanUpdate(BaseModel):
    branch_id: UUID | None = None
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    price_paise: int | None = Field(default=None, ge=0, le=100_000_000)
    duration_days: int | None = Field(default=None, gt=0, le=3650)
    discount_bps: int | None = Field(default=None, ge=0, le=10_000)
    tax_bps: int | None = Field(default=None, ge=0, le=10_000)
    benefits: list[str] | None = Field(default=None, max_length=30)
    is_active: bool | None = None


class MembershipPlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    branch_id: UUID | None
    name: str
    code: str
    description: str | None
    price_paise: int
    duration_days: int
    discount_bps: int
    tax_bps: int
    benefits: list[str]
    is_active: bool


class MembershipOrderRequest(BaseModel):
    plan_id: UUID


class MembershipOrderResponse(BaseModel):
    membership_id: UUID
    payment_id: UUID
    order_id: str
    amount_paise: int
    currency: str
    redirect_url: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str = Field(min_length=1, max_length=100)
    razorpay_payment_id: str = Field(min_length=1, max_length=100)
    razorpay_signature: str = Field(min_length=64, max_length=128)
