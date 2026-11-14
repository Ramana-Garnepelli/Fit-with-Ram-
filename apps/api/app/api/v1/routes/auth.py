import hmac
from datetime import UTC, datetime, timedelta
from html import escape

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_opaque_token,
    hash_password,
    new_opaque_token,
    verify_password,
)
from app.db.models import (
    Branch,
    MemberProfile,
    Organization,
    PasswordResetToken,
    RefreshToken,
    User,
    UserBranchAssignment,
)
from app.db.session import get_db
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.email import send_email

router = APIRouter(prefix="/auth", tags=["auth"])
_refresh_cookie = "fitwithram_refresh"
_csrf_cookie = "fitwithram_csrf"


def _set_auth_cookies(response: Response, refresh_token: str, csrf_token: str) -> None:
    secure = settings.app_env.lower() == "production"
    max_age = settings.refresh_token_days * 24 * 60 * 60
    response.set_cookie(
        _refresh_cookie,
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        _csrf_cookie,
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    secure = settings.app_env.lower() == "production"
    response.delete_cookie(_refresh_cookie, path="/", secure=secure, httponly=True, samesite="lax")
    response.delete_cookie(_csrf_cookie, path="/", secure=secure, httponly=False, samesite="lax")


def _create_session(db: Session, user: User) -> tuple[str, str, str]:
    refresh_token = new_opaque_token()
    csrf_token = new_opaque_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_opaque_token(refresh_token),
            csrf_hash=hash_opaque_token(csrf_token),
            expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
        )
    )
    db.commit()
    access_token = create_access_token(
        user_id=user.id, role=user.role, organization_id=user.organization_id
    )
    return access_token, refresh_token, csrf_token


def _auth_payload(db: Session, response: Response, user: User) -> AuthResponse:
    access_token, refresh_token, csrf_token = _create_session(db, user)
    _set_auth_cookies(response, refresh_token, csrf_token)
    return AuthResponse(
        access_token=access_token,
        csrf_token=csrf_token,
        user=user,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    organization = db.scalar(
        select(Organization).where(
            Organization.slug == payload.organization_slug.lower(), Organization.is_active.is_(True)
        )
    )
    if organization is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    branch = db.scalar(
        select(Branch).where(
            Branch.id == payload.branch_id,
            Branch.organization_id == organization.id,
            Branch.is_active.is_(True),
        )
    )
    if branch is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Branch not found")
    if db.scalar(select(User.id).where(User.email == str(payload.email))):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        organization_id=organization.id,
        email=str(payload.email),
        password_hash=hash_password(payload.password.get_secret_value()),
        full_name=payload.full_name.strip(),
        phone=payload.phone,
        role="MEMBER",
    )
    try:
        db.add(user)
        db.flush()
        db.add(
            MemberProfile(
                organization_id=organization.id,
                branch_id=branch.id,
                user_id=user.id,
            )
        )
        db.add(
            UserBranchAssignment(
                organization_id=organization.id,
                branch_id=branch.id,
                user_id=user.id,
                branch_role="MEMBER",
            )
        )
        db.commit()
        db.refresh(user)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with this email already exists"
        ) from error

    send_email(
        to=user.email,
        subject="Welcome to FITWITHRAM",
        html_body=(
            f"<p>Welcome, {escape(user.full_name)}.</p>"
            "<p>Your member account is ready. Sign in to explore your membership, "
            "classes, training plans, and progress.</p>"
        ),
    )
    return _auth_payload(db, response, user)


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    identifier = payload.email.strip()
    user = db.scalar(select(User).where(
        or_(User.email == identifier.lower(), User.phone == identifier),
        User.is_active.is_(True),
    ))
    if user is None or not verify_password(payload.password.get_secret_value(), user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Phone/email or password is incorrect")

    user.last_login_at = datetime.now(UTC)
    db.commit()
    db.refresh(user)
    return _auth_payload(db, response, user)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user = db.scalar(select(User).where(User.email == str(payload.email), User.is_active.is_(True)))
    if (
        user is not None
        and not user.email.endswith("@example.com")
        and settings.resend_api_key
        and settings.resend_from_email
    ):
        raw_token = new_opaque_token()
        now = datetime.now(UTC)
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_opaque_token(raw_token),
                expires_at=now + timedelta(minutes=30),
            )
        )
        db.commit()
        reset_link = f"{settings.web_app_url.rstrip('/')}/reset-password?token={raw_token}"
        send_email(
            to=user.email,
            subject="Reset your FITWITHRAM password",
            html_body=(
                f"<p>Hello {escape(user.full_name)},</p>"
                "<p>Use the link below to reset your password. "
                "It expires in 30 minutes.</p>"
                f'<p><a href="{escape(reset_link, quote=True)}">Reset password</a></p>'
            ),
        )
    return {"message": "If an account exists for this email, reset instructions will be sent."}


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    reset_token = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_opaque_token(payload.token),
            PasswordResetToken.used_at.is_(None),
        )
    )
    now = datetime.now(UTC)
    if reset_token is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Password reset link is invalid or expired"
        )
    expires_at = reset_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= now:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Password reset link is invalid or expired"
        )
    user = db.get(User, reset_token.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Password reset link is invalid or expired"
        )
    reset_token.used_at = now
    user.password_hash = hash_password(payload.new_password.get_secret_value())
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    db.commit()
    return {"message": "Password reset successful"}


def _get_valid_refresh_session(
    db: Session,
    request: Request,
    csrf_header: str | None,
) -> tuple[RefreshToken, User]:
    refresh_token = request.cookies.get(_refresh_cookie)
    csrf_cookie = request.cookies.get(_csrf_cookie)
    if not refresh_token or not csrf_cookie or not csrf_header:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session refresh is unavailable")
    if not hmac.compare_digest(csrf_cookie, csrf_header):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF validation failed")

    token_row = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_opaque_token(refresh_token))
    )
    now = datetime.now(UTC)
    if token_row is None or token_row.revoked_at is not None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session is no longer valid")
    expires_at = token_row.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= now:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session has expired")
    if not token_row.csrf_hash or not hmac.compare_digest(
        hash_opaque_token(csrf_cookie), token_row.csrf_hash
    ):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "CSRF validation failed")

    user = db.get(User, token_row.user_id)
    if user is None or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account is unavailable")
    return token_row, user


@router.post("/refresh", response_model=AuthResponse)
def refresh(
    request: Request,
    response: Response,
    x_csrf_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> AuthResponse:
    old_session, user = _get_valid_refresh_session(db, request, x_csrf_token)
    old_session.revoked_at = datetime.now(UTC)
    db.commit()
    return _auth_payload(db, response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    x_csrf_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Response:
    refresh_token = request.cookies.get(_refresh_cookie)
    csrf_cookie = request.cookies.get(_csrf_cookie)
    if refresh_token and csrf_cookie and x_csrf_token:
        if hmac.compare_digest(csrf_cookie, x_csrf_token):
            token_row = db.scalar(
                select(RefreshToken).where(
                    RefreshToken.token_hash == hash_opaque_token(refresh_token),
                    RefreshToken.csrf_hash == hash_opaque_token(csrf_cookie),
                )
            )
            if token_row and token_row.revoked_at is None:
                token_row.revoked_at = datetime.now(UTC)
                db.commit()
    _clear_auth_cookies(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
