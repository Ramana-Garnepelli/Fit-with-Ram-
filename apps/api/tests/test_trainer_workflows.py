from datetime import UTC, datetime, timedelta
from uuid import UUID

from app.core.security import create_access_token
from app.db.models import (
    FitnessClass,
    MemberProfile,
    Membership,
    MembershipPlan,
    TrainerAssignment,
    TrainerProfile,
    User,
    UserBranchAssignment,
)
from app.db.session import get_db


def open_test_db(client):
    generator = client.app.dependency_overrides[get_db]()
    return next(generator), generator


def test_trainer_can_view_and_assign_work_only_for_assigned_members(app_client) -> None:
    client, organization, branch = app_client
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Assigned Member",
            "email": "assigned-member@example.com",
            "password": "strong-member-password-123",
            "organization_slug": organization.slug,
            "branch_id": str(branch.id),
        },
    )
    assert registration.status_code == 201
    member_id = registration.json()["user"]["id"]

    db, generator = open_test_db(client)
    trainer = User(
        organization_id=organization.id,
        email="coach@example.com",
        password_hash="not-used",
        full_name="Coach One",
        role="TRAINER",
    )
    other_trainer = User(
        organization_id=organization.id,
        email="other-coach@example.com",
        password_hash="not-used",
        full_name="Coach Two",
        role="TRAINER",
    )
    db.add_all([trainer, other_trainer])
    db.flush()
    db.add_all(
        [
            TrainerProfile(organization_id=organization.id, user_id=trainer.id),
            TrainerProfile(organization_id=organization.id, user_id=other_trainer.id),
            UserBranchAssignment(
                organization_id=organization.id,
                branch_id=branch.id,
                user_id=trainer.id,
                branch_role="TRAINER",
            ),
            TrainerAssignment(
                organization_id=organization.id,
                branch_id=branch.id,
                trainer_user_id=trainer.id,
                member_user_id=UUID(member_id),
            ),
        ]
    )
    db.commit()
    trainer_token = create_access_token(
        user_id=trainer.id, role=trainer.role, organization_id=organization.id
    )
    other_token = create_access_token(
        user_id=other_trainer.id, role=other_trainer.role, organization_id=organization.id
    )
    generator.close()

    listed = client.get(
        "/api/v1/trainer/members",
        headers={"Authorization": f"Bearer {trainer_token}"},
    )
    created = client.post(
        "/api/v1/trainer/workout-plans",
        headers={"Authorization": f"Bearer {trainer_token}"},
        json={
            "member_user_id": member_id,
            "title": "Strength foundations",
            "exercises": [
                {"name": "Goblet squat", "sets": 3, "repetitions": "10", "rest_seconds": 60}
            ],
        },
    )
    denied = client.post(
        "/api/v1/trainer/workout-plans",
        headers={"Authorization": f"Bearer {other_token}"},
        json={
            "member_user_id": member_id,
            "title": "Unauthorized plan",
            "exercises": [{"name": "Squat", "sets": 3, "repetitions": "10", "rest_seconds": 60}],
        },
    )
    class_start = datetime.now(UTC) + timedelta(days=1)
    scheduled_class = client.post(
        f"/api/v1/branches/{branch.id}/classes",
        headers={"Authorization": f"Bearer {trainer_token}"},
        json={
            "trainer_user_id": trainer.id.__str__(),
            "title": "Strength Circuit",
            "starts_at": class_start.isoformat(),
            "ends_at": (class_start + timedelta(hours=1)).isoformat(),
            "capacity": 12,
        },
    )
    forbidden_class = client.post(
        f"/api/v1/branches/{branch.id}/classes",
        headers={"Authorization": f"Bearer {other_token}"},
        json={
            "trainer_user_id": str(UUID(registration.json()["user"]["id"])),
            "title": "Unauthorized class",
            "starts_at": class_start.isoformat(),
            "ends_at": (class_start + timedelta(hours=1)).isoformat(),
            "capacity": 12,
        },
    )

    assert [member["id"] for member in listed.json()] == [member_id]
    assert created.status_code == 201
    assert created.json()["member_user_id"] == member_id
    assert denied.status_code == 404
    assert scheduled_class.status_code == 201
    assert forbidden_class.status_code == 404


def test_class_booking_and_checkin_require_active_membership(app_client) -> None:
    client, organization, branch = app_client
    registration = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Gym Member",
            "email": "gym-member@example.com",
            "password": "strong-member-password-123",
            "organization_slug": organization.slug,
            "branch_id": str(branch.id),
        },
    )
    assert registration.status_code == 201
    member_id = UUID(registration.json()["user"]["id"])
    token = registration.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    db, generator = open_test_db(client)
    trainer = User(
        organization_id=organization.id,
        email="class-coach@example.com",
        password_hash="not-used",
        full_name="Class Coach",
        role="TRAINER",
    )
    db.add(trainer)
    db.flush()
    now = datetime.now(UTC)
    fitness_class = FitnessClass(
        organization_id=organization.id,
        branch_id=branch.id,
        trainer_user_id=trainer.id,
        title="Strength Circuit",
        starts_at=now + timedelta(days=1),
        ends_at=now + timedelta(days=1, hours=1),
        capacity=12,
    )
    plan = MembershipPlan(
        organization_id=organization.id,
        name="Monthly",
        code="MONTHLY",
        price_paise=99900,
        duration_days=30,
    )
    db.add_all([fitness_class, plan])
    db.commit()
    db.refresh(fitness_class)
    db.refresh(plan)
    class_id = fitness_class.id
    plan_id = plan.id
    generator.close()

    no_membership_booking = client.post(f"/api/v1/classes/{class_id}/book", headers=headers)
    no_membership_checkin = client.post(
        f"/api/v1/branches/{branch.id}/attendance/check-in", headers=headers
    )
    assert no_membership_booking.status_code == 403
    assert no_membership_checkin.status_code == 403

    db, generator = open_test_db(client)
    profile = db.query(MemberProfile).filter_by(user_id=member_id).one()
    db.add(
        Membership(
            organization_id=organization.id,
            branch_id=branch.id,
            member_user_id=member_id,
            plan_id=plan_id,
            status="ACTIVE",
            starts_at=now - timedelta(days=1),
            expires_at=now + timedelta(days=29),
            amount_paise=99900,
            plan_name_snapshot="Monthly",
        )
    )
    assert profile.branch_id == branch.id
    db.commit()
    generator.close()

    booked = client.post(f"/api/v1/classes/{class_id}/book", headers=headers)
    checked_in = client.post(f"/api/v1/branches/{branch.id}/attendance/check-in", headers=headers)
    duplicate_checkin = client.post(
        f"/api/v1/branches/{branch.id}/attendance/check-in", headers=headers
    )
    assert booked.status_code == 201
    assert checked_in.status_code == 201
    assert duplicate_checkin.status_code == 409

    attendance = client.get("/api/v1/members/me/attendance", headers=headers)
    assert attendance.status_code == 200
    assert attendance.json()[0]["method"] == "MEMBER"
    assert attendance.json()[0]["checked_out_at"] is None

    checked_out = client.post(
        f"/api/v1/branches/{branch.id}/attendance/check-out", headers=headers
    )
    duplicate_checkout = client.post(
        f"/api/v1/branches/{branch.id}/attendance/check-out", headers=headers
    )
    assert checked_out.status_code == 200
    assert checked_out.json()["checked_out_at"] is not None
    assert duplicate_checkout.status_code == 409

    attendance_after_checkout = client.get("/api/v1/members/me/attendance", headers=headers)
    assert attendance_after_checkout.status_code == 200
    assert attendance_after_checkout.json()[0]["checked_out_at"] is not None
