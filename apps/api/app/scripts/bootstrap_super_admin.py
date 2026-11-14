import os
import re
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.models import User
from app.db.session import SessionLocal


def main() -> int:
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    full_name = os.getenv("BOOTSTRAP_ADMIN_NAME", "").strip()
    phone = os.getenv("BOOTSTRAP_ADMIN_PHONE", "").strip()
    if phone and not re.fullmatch(r"\+?[0-9]{8,15}", phone):
        print("BOOTSTRAP_ADMIN_PHONE must be an international phone number.", file=sys.stderr)
        return 2
    if not email and phone:
        # The legacy account model requires an email column. This reserved
        # non-delivery address is only an internal identifier for phone login.
        phone_digits = re.sub("[^0-9]", "", phone)
        email = f"phone-only-{phone_digits}@example.com"
    if not email or not phone or not full_name or len(password) < 12:
        print(
            "Set BOOTSTRAP_ADMIN_PHONE, BOOTSTRAP_ADMIN_NAME, and a fresh 12+ character "
            "BOOTSTRAP_ADMIN_PASSWORD. BOOTSTRAP_ADMIN_EMAIL is optional.",
            file=sys.stderr,
        )
        return 2

    with SessionLocal() as db:
        existing = db.scalar(select(User).where((User.email == email) | (User.phone == phone)))
        if existing is not None:
            print(
                "An account already exists for that phone/email; no changes were made.", file=sys.stderr
            )
            return 1
        db.add(
            User(
                email=email,
                password_hash=hash_password(password),
                full_name=full_name,
                phone=phone or None,
                role="SUPER_ADMIN",
            )
        )
        db.commit()
        print(f"Created initial platform administrator for phone {phone}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
