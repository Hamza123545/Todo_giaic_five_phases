"""add_phase5_fields_recurring_reminders

Revision ID: f39859e829dd
Revises: 3fcae26ea717
Create Date: 2026-01-01 18:12:00.943149

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f39859e829dd'
down_revision: Union[str, Sequence[str], None] = '3fcae26ea717'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add nullable columns for Phase V features (recurring tasks, reminders)
    # Backward compatible: Existing tasks have NULL values for new fields
    op.add_column('tasks', sa.Column('recurring_pattern', sa.String(length=500), nullable=True))
    op.add_column('tasks', sa.Column('recurring_end_date', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('next_occurrence', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('reminder_at', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('reminder_sent', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    
    # Add partial index on next_occurrence for fast queries by Recurring Task Service
    # Partial index: only index rows where next_occurrence IS NOT NULL
    op.execute("""
        CREATE INDEX idx_tasks_next_occurrence
        ON tasks(next_occurrence)
        WHERE next_occurrence IS NOT NULL
    """)
    
    # Add composite partial index on (reminder_at, user_id) for fast queries by Notification Service
    # Partial index: only index pending reminders (not yet sent)
    op.execute("""
        CREATE INDEX idx_tasks_reminder_at
        ON tasks(reminder_at, user_id)
        WHERE reminder_at IS NOT NULL AND reminder_sent = false
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.execute("DROP INDEX IF EXISTS idx_tasks_reminder_at")
    op.execute("DROP INDEX IF EXISTS idx_tasks_next_occurrence")
    
    # Drop columns
    op.drop_column('tasks', 'reminder_sent')
    op.drop_column('tasks', 'reminder_at')
    op.drop_column('tasks', 'next_occurrence')
    op.drop_column('tasks', 'recurring_end_date')
    op.drop_column('tasks', 'recurring_pattern')
