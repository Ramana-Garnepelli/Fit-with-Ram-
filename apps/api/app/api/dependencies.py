from collections.abc import Callable
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.models import Branch, User, UserBranchAssignment
from app.db.session import get_db

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError) as error:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired access token"
        ) from error

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is unavailable")
    return user


def require_roles(*roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "You do not have permission for this action"
            )
        return user

    return dependency


def authorize_branch(db: Session, user: User, branch_id: UUID) -> Branch:
    branch = db.get(Branch, branch_id)
    if branch is None or not branch.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")

    if user.role == "SUPER_ADMIN":
        return branch
    if user.organization_id != branch.organization_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
    if user.role == "GYM_OWNER":
        return branch

    assignment = db.scalar(
        select(UserBranchAssignment.id).where(
            UserBranchAssignment.user_id == user.id,
            UserBranchAssignment.branch_id == branch_id,
            UserBranchAssignment.organization_id == branch.organization_id,
            UserBranchAssignment.branch_role == user.role,
        )
    )
    if assignment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
    return branch


def accessible_branch_ids(db: Session, user: User) -> list[UUID] | None:
    if user.role == "SUPER_ADMIN":
        return None
    if user.role == "GYM_OWNER":
        return list(
            db.scalars(
                select(Branch.id).where(Branch.organization_id == user.organization_id)
            ).all()
        )
    return list(
        db.scalars(
            select(UserBranchAssignment.branch_id).where(
                UserBranchAssignment.user_id == user.id,
                UserBranchAssignment.organization_id == user.organization_id,
                UserBranchAssignment.branch_role == user.role,
            )
        ).all()
    )
