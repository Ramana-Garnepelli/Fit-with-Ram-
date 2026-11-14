from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.db.models import Branch, MemberProfile, RefreshToken, User
from app.db.session import get_db
from app.schemas.auth import AuthUser
from app.schemas.organization import MemberPasswordChange, MemberProfileUpdate

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/me")
def get_my_member_profile(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if user.role != "MEMBER":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Member profile is not available for this role"
        )

    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == user.id,
            MemberProfile.organization_id == user.organization_id,
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")
    branch = db.scalar(
        select(Branch).where(
            Branch.id == profile.branch_id,
            Branch.organization_id == profile.organization_id,
        )
    )
    if branch is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")

    return {
        "user": AuthUser.model_validate(user).model_dump(mode="json"),
        "profile": {
            "id": str(profile.id),
            "branch_id": str(profile.branch_id),
            "profile_photo_url": user.profile_photo_url,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "address": profile.address,
            "emergency_contact_name": profile.emergency_contact_name,
            "emergency_contact_phone": profile.emergency_contact_phone,
            "height_cm": profile.height_cm,
            "current_weight_kg": profile.current_weight_kg,
            "target_weight_kg": profile.target_weight_kg,
            "fitness_goals": profile.fitness_goals,
            "preferred_training_type": profile.preferred_training_type,
        },
        "branch": {"id": str(branch.id), "name": branch.name, "slug": branch.slug},
    }


@router.put("/me")
def update_my_member_profile(
    payload: MemberProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if user.role != "MEMBER":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Member profile is not available for this role"
        )
    profile = db.scalar(
        select(MemberProfile).where(
            MemberProfile.user_id == user.id,
            MemberProfile.organization_id == user.organization_id,
            MemberProfile.is_active.is_(True),
        )
    )
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Member profile not found")
    changes = payload.model_dump(exclude_unset=True)
    full_name = changes.pop("full_name", None)
    if full_name is not None:
        user.full_name = full_name.strip()
    phone = changes.pop("phone", None)
    if "phone" in payload.model_fields_set:
        user.phone = phone
    profile_photo_url = changes.pop("profile_photo_url", None)
    if "profile_photo_url" in payload.model_fields_set:
        user.profile_photo_url = str(profile_photo_url) if profile_photo_url is not None else None
    for key, value in changes.items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(user)
    db.refresh(profile)
    return {
        "user": AuthUser.model_validate(user).model_dump(mode="json"),
        "profile": {
            "id": str(profile.id),
            "branch_id": str(profile.branch_id),
            "profile_photo_url": user.profile_photo_url,
            "date_of_birth": profile.date_of_birth,
            "gender": profile.gender,
            "address": profile.address,
            "emergency_contact_name": profile.emergency_contact_name,
            "emergency_contact_phone": profile.emergency_contact_phone,
            "height_cm": profile.height_cm,
            "current_weight_kg": profile.current_weight_kg,
            "target_weight_kg": profile.target_weight_kg,
            "fitness_goals": profile.fitness_goals,
            "preferred_training_type": profile.preferred_training_type,
        },
    }


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_my_password(
    payload: MemberPasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if user.role != "MEMBER":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Password change is not available for this role"
        )
    if not verify_password(payload.current_password.get_secret_value(), user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    user.password_hash = hash_password(payload.new_password.get_secret_value())
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()
