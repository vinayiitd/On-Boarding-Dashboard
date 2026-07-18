"""fnd003 persistence baseline

Revision ID: 9db3d4d8d143
Revises:
Create Date: 2026-07-18 06:04:10.185387

Empty baseline — no business tables in FND-003. Future revisions add mappings
discovered under `infrastructure/persistence/mappings/`.
"""

from __future__ import annotations

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "9db3d4d8d143"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Apply this revision."""
    pass


def downgrade() -> None:
    """Revert this revision."""
    pass
