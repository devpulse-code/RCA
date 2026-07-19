# RCA/backend/src/core/db/migrations/versions/0000_initial.py
"""initial database schema

Revision ID: 0000
Revises: None
Create Date: 2026-07-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0000'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Groups table (no FK, depends on nothing)
    op.create_table(
        'groups',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), unique=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('contact', sa.String(), nullable=True),
        sa.Column('encrypted_passcode', sa.String(), nullable=False),
        sa.Column('passcode_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Admins table
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('username', sa.String(), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('must_change_password', sa.Boolean(), default=True),
        sa.Column('totp_secret', sa.String(), nullable=True),
        sa.Column('totp_enabled', sa.Boolean(), default=False),
        sa.Column('recovery_codes_hashed', sa.String(), nullable=True),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('failed_attempts', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Files table – the Enum type will be auto-created by SQLAlchemy during table creation
    op.create_table(
        'files',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), default=''),
        sa.Column('storage_type', sa.Enum('LOCAL', 'TERABOX', name='storagetype'), nullable=False),
        sa.Column('local_path', sa.String(), nullable=True),
        sa.Column('encrypted_terabox_url', sa.String(), nullable=True),
        sa.Column('mime_type', sa.String(), nullable=True),
        sa.Column('size', sa.Integer(), nullable=True),
        sa.Column('uploader_id', sa.Integer(), nullable=True),
        sa.Column('uploader_type', sa.String(), nullable=True),
        sa.Column('status', sa.String(), default='active'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Announcements table
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('expiry', sa.DateTime(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Audit logs table (no TimestampMixin, uses its own timestamp)
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('admin_username', sa.String(), nullable=True),
        sa.Column('target_type', sa.String(), nullable=True),
        sa.Column('target_id', sa.String(), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # System settings table
    op.create_table(
        'system_settings',
        sa.Column('key', sa.String(), primary_key=True),
        sa.Column('value', sa.String(), nullable=False),
    )

    # Notifications table (FK to users)
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('read', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Association tables
    op.create_table(
        'user_group',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('groups.id'), primary_key=True),
    )

    op.create_table(
        'file_group',
        sa.Column('file_id', sa.Integer(), sa.ForeignKey('files.id'), primary_key=True),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('groups.id'), primary_key=True),
    )

    op.create_table(
        'announcement_groups',
        sa.Column('announcement_id', sa.Integer(), sa.ForeignKey('announcements.id'), primary_key=True),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('groups.id'), primary_key=True),
    )


def downgrade() -> None:
    # Drop association tables first (no circular dependencies)
    op.drop_table('announcement_groups')
    op.drop_table('file_group')
    op.drop_table('user_group')

    # Drop tables with FK constraints
    op.drop_table('notifications')
    op.drop_table('system_settings')
    op.drop_table('audit_logs')
    op.drop_table('announcements')
    op.drop_table('files')
    op.drop_table('admins')
    op.drop_table('users')
    op.drop_table('groups')

    # Drop the enum type
    sa.Enum(name='storagetype').drop(op.get_bind(), checkfirst=True)

# end of RCA/backend/src/core/db/migrations/versions/0000_initial.py