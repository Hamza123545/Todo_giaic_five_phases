"""Add conversation and message tables with retention policy

Revision ID: 0eeaf6a35d2a
Revises: 
Create Date: 2025-12-18 01:02:16.286812

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0eeaf6a35d2a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Note: Better Auth tables (session, verification, account, user, jwks) are managed by Better Auth
    # and should NOT be dropped here.

    # Add new columns to conversations table
    op.add_column('conversations', sa.Column('title', sa.String(length=500), nullable=False, server_default='Untitled'))
    op.add_column('conversations', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))

    # Create indexes for conversations table
    op.create_index(op.f('ix_conversations_created_at'), 'conversations', ['created_at'], unique=False)
    op.create_index(op.f('ix_conversations_is_active'), 'conversations', ['is_active'], unique=False)
    op.create_index(op.f('ix_conversations_updated_at'), 'conversations', ['updated_at'], unique=False)

    # Add expires_at column to messages table
    op.add_column('messages', sa.Column('expires_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    # Create index for messages table
    op.create_index(op.f('ix_messages_expires_at'), 'messages', ['expires_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Note: Better Auth tables are NOT recreated on downgrade.
    # This migration only manages chat-related schema changes.

    # Remove indexes for messages table
    op.drop_index(op.f('ix_messages_expires_at'), table_name='messages')
    op.drop_column('messages', 'expires_at')

    # Remove indexes and columns for conversations table
    op.drop_index(op.f('ix_conversations_updated_at'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_is_active'), table_name='conversations')
    op.drop_index(op.f('ix_conversations_created_at'), table_name='conversations')
    op.drop_column('conversations', 'is_active')
    op.drop_column('conversations', 'title')
