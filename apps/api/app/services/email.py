import logging
from datetime import datetime
from html import escape

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(*, to: str, subject: str, html_body: str) -> bool:
    """Send email through Resend when configured; callers must not depend on delivery."""
    if not settings.resend_api_key or not settings.resend_from_email:
        logger.info("Email delivery is not configured; skipped email to %s", to)
        return False
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.resend_from_email,
                "to": [to],
                "subject": subject,
                "html": html_body,
            },
            timeout=8.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.exception("Resend delivery failed for %s", to)
        return False
    return True


def membership_confirmation_email(*, to: str, member_name: str, plan_name: str, expires_at) -> bool:
    return send_email(
        to=to,
        subject="Your FITWITHRAM membership is active",
        html_body=(
            f"<p>Hello {escape(member_name)},</p>"
            f"<p>Your <strong>{escape(plan_name)}</strong> membership is active.</p>"
            f"<p>Membership valid through {escape(str(expires_at))}.</p>"
            "<p>Train hard. Stay consistent.</p>"
        ),
    )


def class_booking_email(
    *, to: str, member_name: str, class_title: str, starts_at: datetime, cancelled: bool = False
) -> bool:
    safe_title = escape(class_title)
    if cancelled:
        return send_email(
            to=to,
            subject="Your FITWITHRAM class booking was cancelled",
            html_body=(
                f"<p>Hello {escape(member_name)},</p>"
                f"<p>Your booking for <strong>{safe_title}</strong> has been cancelled.</p>"
            ),
        )
    return send_email(
        to=to,
        subject="Your FITWITHRAM class is booked",
        html_body=(
            f"<p>Hello {escape(member_name)},</p>"
            f"<p>Your booking for <strong>{safe_title}</strong> is confirmed.</p>"
            f"<p>Class starts at {escape(starts_at.strftime('%d %b %Y, %I:%M %p UTC'))}.</p>"
        ),
    )
