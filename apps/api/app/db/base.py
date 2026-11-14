from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Import models so metadata discovery works for Alembic and tests.
from app.db import models as models  # noqa: E402,F401
