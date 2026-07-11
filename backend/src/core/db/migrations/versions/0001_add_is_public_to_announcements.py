# RCA/backend/src/core/db/migrations/versions/0001_add_is_public_to_announcements.py
"""add is_public column to announcements

Revision ID: 0001
Revises: None
Create Date: 2026-07-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the column only if it doesn't already exist (idempotent)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'announcements'
                AND column_name = 'is_public'
            ) THEN
                ALTER TABLE announcements ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE;
            END IF;
        END
        $$;
        """
    )


def downgrade() -> None:
    # Remove the column if it exists
    op.execute(
        """
        ALTER TABLE announcements DROP COLUMN IF EXISTS is_public;
        """
    )

# end of RCA/backend/src/core/db/migrations/versions/0001_add_is_public_to_announcements.py