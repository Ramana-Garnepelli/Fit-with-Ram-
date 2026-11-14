from app.db.models import Branch, ContactEnquiry, MembershipPlan
from app.db.session import get_db
from app.scripts.seed_demo_tenant import ensure_demo_tenant
from sqlalchemy import select


def test_public_enquiry_is_validated_and_saved_to_the_requested_branch(app_client) -> None:
    client, organization, branch = app_client
    response = client.post(
        f"/api/v1/organizations/{organization.slug}/enquiries",
        json={
            "branch_id": str(branch.id),
            "name": "  Alex Member  ",
            "email": " ALEX@example.com ",
            "phone": "+919876543210",
            "subject": "Membership options",
            "message": "I would like to learn more about joining.",
        },
    )
    assert response.status_code == 201
    assert response.json()["message"].startswith("Thank you")

    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)
    try:
        enquiry = db.scalar(select(ContactEnquiry))
        assert enquiry is not None
        assert enquiry.organization_id == organization.id
        assert enquiry.branch_id == branch.id
        assert enquiry.name == "Alex Member"
        assert enquiry.email == "alex@example.com"
        assert enquiry.status == "NEW"
    finally:
        generator.close()


def test_public_enquiry_rejects_a_branch_from_another_organization(app_client) -> None:
    client, organization, branch = app_client
    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)
    other_organization = type(organization)(name="Other Gym", slug="other-gym")
    db.add(other_organization)
    db.flush()
    other_branch = Branch(
        organization_id=other_organization.id,
        name="Other Location",
        slug="other-location",
    )
    db.add(other_branch)
    db.commit()
    other_branch_id = str(other_branch.id)
    generator.close()

    response = client.post(
        f"/api/v1/organizations/{organization.slug}/enquiries",
        json={
            "branch_id": other_branch_id,
            "name": "Alex Member",
            "email": "alex@example.com",
            "subject": "Membership",
            "message": "Please contact me about membership options.",
        },
    )
    assert response.status_code == 422


def test_public_enquiry_rejects_missing_fields(app_client) -> None:
    client, organization, _ = app_client
    response = client.post(
        f"/api/v1/organizations/{organization.slug}/enquiries",
        json={"name": "A", "email": "bad", "subject": "?", "message": "short"},
    )
    assert response.status_code == 422


def test_development_tenant_seed_is_idempotent_and_includes_membership_plans(app_client) -> None:
    client, organization, branch = app_client
    generator = client.app.dependency_overrides[get_db]()
    db = next(generator)
    try:
        first_organization, first_branch = ensure_demo_tenant(db)
        first_ids = (first_organization.id, first_branch.id)
        second_organization, second_branch = ensure_demo_tenant(db)
        assert (second_organization.id, second_branch.id) == first_ids
        assert first_organization.id == organization.id
        assert first_branch.id == branch.id
        assert set(
            db.scalars(
                select(MembershipPlan.code).where(
                    MembershipPlan.organization_id == organization.id,
                    MembershipPlan.branch_id.is_(None),
                )
            ).all()
        ) >= {"BASIC", "PREMIUM", "ELITE"}
    finally:
        generator.close()
