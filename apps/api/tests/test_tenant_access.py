from app.core.security import create_access_token
from app.db.models import Branch, Organization, User
from app.db.session import get_db
from fastapi import status


def open_test_db(client):
    generator = client.app.dependency_overrides[get_db]()
    return next(generator), generator


def test_super_admin_can_create_organization_but_member_cannot(app_client) -> None:
    client, organization, branch = app_client
    db, generator = open_test_db(client)
    super_admin = User(
        email="platform@example.com",
        password_hash="not-used",
        full_name="Platform Admin",
        role="SUPER_ADMIN",
    )
    member = User(
        organization_id=organization.id,
        email="member@example.com",
        password_hash="not-used",
        full_name="Member",
        role="MEMBER",
    )
    db.add_all([super_admin, member])
    db.commit()
    super_token = create_access_token(
        user_id=super_admin.id, role=super_admin.role, organization_id=None
    )
    member_token = create_access_token(
        user_id=member.id, role=member.role, organization_id=organization.id
    )
    generator.close()

    created = client.post(
        "/api/v1/admin/organizations",
        json={"name": "Northside Fitness", "slug": "Northside Fitness"},
        headers={"Authorization": f"Bearer {super_token}"},
    )
    denied = client.post(
        "/api/v1/admin/organizations",
        json={"name": "Unauthorized Gym", "slug": "unauthorized-gym"},
        headers={"Authorization": f"Bearer {member_token}"},
    )

    assert created.status_code == status.HTTP_201_CREATED
    assert created.json()["slug"] == "northside-fitness"
    plans = client.get(
        "/api/v1/membership-plans", params={"organization_slug": "northside-fitness"}
    )
    assert plans.status_code == 200
    assert [(plan["code"], plan["price_paise"]) for plan in plans.json()] == [
        ("BASIC", 99900),
        ("PREMIUM", 249900),
        ("ELITE", 799900),
    ]
    owner_response = client.post(
        f"/api/v1/admin/organizations/{created.json()['id']}/owners",
        json={
            "full_name": "Northside Owner",
            "email": "northside-owner@example.com",
            "password": "another-strong-password-456",
        },
        headers={"Authorization": f"Bearer {super_token}"},
    )
    assert denied.status_code == status.HTTP_403_FORBIDDEN
    assert owner_response.status_code == status.HTTP_201_CREATED
    assert owner_response.json()["role"] == "GYM_OWNER"


def test_gym_owner_is_scoped_to_their_organization_and_branches(app_client) -> None:
    client, organization, branch = app_client
    db, generator = open_test_db(client)
    other_org = Organization(name="Other Gym", slug="other-gym")
    db.add(other_org)
    db.flush()
    other_org_id = other_org.id
    other_branch = Branch(
        organization_id=other_org.id,
        name="Other Branch",
        slug="other-branch",
    )
    owner = User(
        organization_id=organization.id,
        email="owner@example.com",
        password_hash="not-used",
        full_name="Gym Owner",
        role="GYM_OWNER",
    )
    db.add_all([other_branch, owner])
    db.commit()
    db.refresh(other_branch)
    token = create_access_token(user_id=owner.id, role=owner.role, organization_id=organization.id)
    headers = {"Authorization": f"Bearer {token}"}
    generator.close()

    visible_branches = client.get("/api/v1/admin/branches", headers=headers)
    foreign_branch = client.patch(
        f"/api/v1/admin/branches/{other_branch.id}",
        json={"name": "Stolen Branch"},
        headers=headers,
    )
    created = client.post(
        "/api/v1/admin/branches",
        json={"organization_id": str(other_org_id), "name": "Local Branch", "slug": "local"},
        headers=headers,
    )

    assert visible_branches.status_code == 200
    assert [item["id"] for item in visible_branches.json()] == [str(branch.id)]
    assert foreign_branch.status_code == status.HTTP_404_NOT_FOUND
    assert created.status_code == status.HTTP_201_CREATED
    assert created.json()["organization_id"] == str(organization.id)
