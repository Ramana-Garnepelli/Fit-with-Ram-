"""Start the FITWITHRAM migration history.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-13
"""

from collections.abc import Sequence

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Domain tables are introduced in subsequent, reviewable migrations.
    pass


def downgrade() -> None:
    pass
