from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.models import Notification, User
from app.db.session import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    limit: int = Query(default=30, ge=1, le=100),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        query = query.where(Notification.read_at.is_(None))
    rows = db.scalars(query.order_by(Notification.created_at.desc()).limit(limit)).all()
    unread_count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.user_id == user.id, Notification.read_at.is_(None)
        )
    )
    return {
        "items": [
            {
                "id": str(row.id),
                "title": row.title,
                "body": row.body,
                "category": row.category,
                "created_at": row.created_at,
                "read_at": row.read_at,
                "data": row.data,
            }
            for row in rows
        ],
        "unread_count": unread_count or 0,
    }


@router.post("/{notification_id}/read", status_code=204)
def mark_notification_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user.id
        )
    )
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    if row.read_at is None:
        row.read_at = datetime.now(UTC)
        db.commit()


@router.post("/read-all", status_code=204)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.read_at.is_(None))
        .values(read_at=datetime.now(UTC))
    )
    db.commit()
