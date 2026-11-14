from urllib.parse import parse_qs, urlparse
from uuid import UUID

from app.db.models import MemberProfile, Notification, RefreshToken, User, UserBranchAssignment
from sqlalchemy import select


def member_payload(organization_slug: str, branch_id: str) -> dict:
    return {
        "full_name": "Ram Member",
        "email": "member@example.com",
        "password": "a-strong-password-123",
        "phone": "+919876543210",
        "organization_slug": organization_slug,
        "branch_id": branch_id,
        "role": "SUPER_ADMIN",
    }


def test_register_creates_a_member_and_persisted_branch_assignment(app_client, monkeypatch) -> None:
    client, organization, branch = app_client
    from app.db.session import get_db

    response = client.post(
        "/api/v1/auth/register", json=member_payload(organization.slug, str(branch.id))
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["role"] == "MEMBER"
    assert body["user"]["organization_id"] == str(organization.id)
    assert body["access_token"]
    assert "password" not in body["user"]
    assert client.cookies.get("fitwithram_refresh")
    assert client.cookies.get("fitwithram_csrf") == body["csrf_token"]
    assert client.cookies.get("fitwithram_refresh")

    db_dependency = client.app.dependency_overrides[get_db]
    db = next(db_dependency())
    try:
        user = db.scalar(select(User).where(User.email == "member@example.com"))
        assert user is not None
        assert user.password_hash != "a-strong-password-123"
        assert db.scalar(select(MemberProfile.id).where(MemberProfile.user_id == user.id))
        assert db.scalar(
            select(UserBranchAssignment.id).where(UserBranchAssignment.user_id == user.id)
        )
        assert db.scalar(select(RefreshToken.id).where(RefreshToken.user_id == user.id))
    finally:
        db.close()


def test_duplicate_registration_is_rejected(app_client) -> None:
    client, organization, branch = app_client
    payload = member_payload(organization.slug, str(branch.id))

    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    duplicate = client.post("/api/v1/auth/register", json=payload)

    assert duplicate.status_code == 409


def test_login_and_csrf_protected_refresh_rotation(app_client) -> None:
    client, organization, branch = app_client
    registration = client.post(
        "/api/v1/auth/register", json=member_payload(organization.slug, str(branch.id))
    )
    assert registration.status_code == 201
    client.cookies.clear()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": " MEMBER@example.com ", "password": "a-strong-password-123"},
    )
    assert login.status_code == 200
    csrf = login.json()["csrf_token"]
    old_refresh_cookie = client.cookies.get("fitwithram_refresh")

    missing_csrf = client.post("/api/v1/auth/refresh")
    assert missing_csrf.status_code == 401

    rotated = client.post("/api/v1/auth/refresh", headers={"X-CSRF-Token": csrf})
    assert rotated.status_code == 200
    assert rotated.json()["csrf_token"] != csrf
    assert client.cookies.get("fitwithram_refresh") != old_refresh_cookie


def test_member_access_token_authenticates_against_database(app_client) -> None:
    client, organization, branch = app_client
    registered = client.post(
        "/api/v1/auth/register", json=member_payload(organization.slug, str(branch.id))
    )

    profile = client.get(
        "/api/v1/members/me",
        headers={"Authorization": f"Bearer {registered.json()['access_token']}"},
    )

    assert profile.status_code == 200
    assert profile.json()["user"]["email"] == "member@example.com"


def test_member_can_update_permitted_profile_fields_and_change_password(app_client) -> None:
    client, organization, branch = app_client
    registered = client.post(
        "/api/v1/auth/register", json=member_payload(organization.slug, str(branch.id))
    )
    token = registered.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    updated = client.put(
        "/api/v1/members/me",
        headers=headers,
        json={
            "full_name": "Ram Updated",
            "height_cm": 178,
            "target_weight_kg": 76,
            "fitness_goals": ["Strength", "Mobility"],
            "profile_photo_url": "https://images.example.com/member.jpg",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["user"]["full_name"] == "Ram Updated"
    assert updated.json()["profile"]["height_cm"] == 178
    assert updated.json()["profile"]["fitness_goals"] == ["Strength", "Mobility"]

    wrong_password = client.post(
        "/api/v1/members/me/password",
        headers=headers,
        json={
            "current_password": "incorrect-password",
            "new_password": "another-strong-password-456",
        },
    )
    changed_password = client.post(
        "/api/v1/members/me/password",
        headers=headers,
        json={
            "current_password": "a-strong-password-123",
            "new_password": "another-strong-password-456",
        },
    )
    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "member@example.com", "password": "a-strong-password-123"},
    )
    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "member@example.com", "password": "another-strong-password-456"},
    )
    assert wrong_password.status_code == 400
    assert changed_password.status_code == 204
    assert old_login.status_code == 401
    assert new_login.status_code == 200


def test_password_reset_sends_one_time_link_and_revokes_refresh_sessions(app_client, monkeypatch):
    client, organization, branch = app_client
    client.post("/api/v1/auth/register", json=member_payload(organization.slug, str(branch.id)))
    email_messages = []
    monkeypatch.setattr("app.api.v1.routes.auth.settings.resend_api_key", "resend-test-key")
    monkeypatch.setattr("app.api.v1.routes.auth.settings.resend_from_email", "team@example.com")
    monkeypatch.setattr(
        "app.api.v1.routes.auth.send_email",
        lambda **kwargs: email_messages.append(kwargs) or True,
    )

    requested = client.post("/api/v1/auth/forgot-password", json={"email": "member@example.com"})
    unknown = client.post("/api/v1/auth/forgot-password", json={"email": "missing@example.com"})
    assert requested.status_code == unknown.status_code == 202
    assert requested.json() == unknown.json()
    assert len(email_messages) == 1
    reset_url = urlparse(email_messages[0]["html_body"].split('href="')[1].split('"')[0])
    token = parse_qs(reset_url.query)["token"][0]

    reset = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "reset-password-is-strong-456"},
    )
    reused = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "reset-password-is-strong-789"},
    )
    assert reset.status_code == 200
    assert reused.status_code == 400
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "member@example.com", "password": "a-strong-password-123"},
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"email": "member@example.com", "password": "reset-password-is-strong-456"},
        ).status_code
        == 200
    )


def test_notifications_are_private_and_can_be_marked_read(app_client) -> None:
    client, organization, branch = app_client
    first = client.post(
        "/api/v1/auth/register", json=member_payload(organization.slug, str(branch.id))
    )
    second_payload = member_payload(organization.slug, str(branch.id))
    second_payload["email"] = "second-member@example.com"
    second = client.post("/api/v1/auth/register", json=second_payload)
    assert first.status_code == second.status_code == 201

    from app.db.session import get_db

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)
    notification = Notification(
        organization_id=organization.id,
        branch_id=branch.id,
        user_id=UUID(first.json()["user"]["id"]),
        title="Membership activated",
        body="Your plan is active.",
        category="MEMBERSHIP",
    )
    db.add(notification)
    db.commit()
    notification_id = str(notification.id)
    generator.close()

    first_headers = {"Authorization": f"Bearer {first.json()['access_token']}"}
    second_headers = {"Authorization": f"Bearer {second.json()['access_token']}"}
    listing = client.get("/api/v1/notifications", headers=first_headers)
    assert listing.status_code == 200
    assert listing.json()["unread_count"] == 1
    assert listing.json()["items"][0]["id"] == notification_id
    assert client.get("/api/v1/notifications", headers=second_headers).json()["items"] == []
    assert client.post(
        f"/api/v1/notifications/{notification_id}/read", headers=second_headers
    ).status_code == 404
    assert client.post(
        f"/api/v1/notifications/{notification_id}/read", headers=first_headers
    ).status_code == 204
    assert client.get("/api/v1/notifications", headers=first_headers).json()["unread_count"] == 0
