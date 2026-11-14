import os
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Branch, MembershipPlan, Organization
from app.db.session import SessionLocal

DEFAULT_PLANS = (
    {
        "name": "Basic",
        "code": "BASIC",
        "description": "One month of standard gym access and general workout guidance.",
        "price_paise": 30_000,
        "duration_days": 30,
        "benefits": ["Standard gym access", "General workout guidance"],
    },
    {
        "name": "Premium",
        "code": "PREMIUM",
        "description": "Three months of gym access with a personalized workout plan.",
        "price_paise": 30_000,
        "duration_days": 90,
        "benefits": [
            "Full gym access",
            "Personalized workout plan",
            "Fitness progress tracking",
        ],
    },
    {
        "name": "Elite",
        "code": "ELITE",
        "description": "A year of premium access, coaching, and priority class booking.",
        "price_paise": 30_000,
        "duration_days": 365,
        "benefits": [
            "Premium gym access",
            "Personal training sessions",
            "Personalized fitness guidance",
            "Priority class booking",
        ],
    },
)


def ensure_demo_tenant(db: Session) -> tuple[Organization, Branch]:
    organization_slug = os.getenv("DEMO_ORGANIZATION_SLUG", "fitwithram").strip().lower()
    organization = db.scalar(
        select(Organization).where(Organization.slug == organization_slug)
    )
    if organization is None:
        organization = Organization(
            name=os.getenv("DEMO_ORGANIZATION_NAME", "FITWITHRAM"),
            slug=organization_slug,
        )
        db.add(organization)
        db.flush()

    branch_slug = os.getenv("DEMO_BRANCH_SLUG", "central").strip().lower()
    branch = db.scalar(
        select(Branch).where(
            Branch.organization_id == organization.id,
            Branch.slug == branch_slug,
        )
    )
    if branch is None:
        branch = Branch(
            organization_id=organization.id,
            name=os.getenv("DEMO_BRANCH_NAME", "Central"),
            slug=branch_slug,
            timezone="Asia/Kolkata",
            facilities=["Strength training", "Cardio", "Personal training"],
        )
        db.add(branch)

    existing_plans = {
        plan.code: plan for plan in db.scalars(
            select(MembershipPlan).where(
                MembershipPlan.organization_id == organization.id,
                MembershipPlan.branch_id.is_(None),
            )
        ).all()
    }
    for plan in DEFAULT_PLANS:
        if plan["code"] in existing_plans:
            existing_plans[plan["code"]].price_paise = 30_000
        else:
            db.add(MembershipPlan(organization_id=organization.id, **plan))

    db.commit()
    db.refresh(organization)
    db.refresh(branch)
    return organization, branch


def main() -> int:
    if settings.app_env.lower() not in {"development", "test"}:
        print("Refusing to create demo data outside development/test.", file=sys.stderr)
        return 2
    with SessionLocal() as db:
        organization, branch = ensure_demo_tenant(db)
    print(f"Development tenant ready: {organization.slug}/{branch.slug}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
