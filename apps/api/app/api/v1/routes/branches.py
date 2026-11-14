from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Branch, ContactEnquiry, Organization
from app.db.session import get_db
from app.schemas.organization import BranchOut, ContactEnquiryCreate

router = APIRouter(prefix="/organizations", tags=["branches"])


@router.get("/{organization_slug}/branches", response_model=list[BranchOut])
def list_public_branches(organization_slug: str, db: Session = Depends(get_db)) -> list[Branch]:
    organization = db.scalar(
        select(Organization).where(
            Organization.slug == organization_slug.lower(), Organization.is_active.is_(True)
        )
    )
    if organization is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    return list(
        db.scalars(
            select(Branch)
            .where(Branch.organization_id == organization.id, Branch.is_active.is_(True))
            .order_by(Branch.name)
        ).all()
    )


@router.post("/{organization_slug}/enquiries", status_code=201)
def create_public_enquiry(
    organization_slug: str,
    payload: ContactEnquiryCreate,
    db: Session = Depends(get_db),
):
    organization = db.scalar(
        select(Organization).where(
            Organization.slug == organization_slug.lower(), Organization.is_active.is_(True)
        )
    )
    if organization is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organization not found")
    branch = None
    if payload.branch_id:
        branch = db.scalar(
            select(Branch).where(
                Branch.id == payload.branch_id,
                Branch.organization_id == organization.id,
                Branch.is_active.is_(True),
            )
        )
        if branch is None:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Branch is not available")
    enquiry = ContactEnquiry(
        organization_id=organization.id,
        branch_id=branch.id if branch else None,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(enquiry)
    db.commit()
    return {"id": enquiry.id, "message": "Thank you. Your enquiry has been sent to the gym team."}
