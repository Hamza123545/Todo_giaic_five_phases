"""
Conversation model for AI chatbot Phase III.

This module defines the Conversation database model for tracking
user conversations with the AI assistant.
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """
    Conversation model for AI chatbot.

    State Transitions: [New] → [Active] → [Archived/Deleted]
    Current Scope: Active only (no archived/deleted states implemented)

    Attributes:
        id: Unique conversation identifier (auto-increment)
        user_id: Owner of the conversation (indexed for user isolation)
        created_at: Conversation creation timestamp
        updated_at: Last message timestamp
    """

    __tablename__ = "conversations"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Keys & Indexes
    user_id: str = Field(index=True, nullable=False)  # User isolation (indexed for queries)

    # Timestamps with default_factory
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Validation: user_id non-empty, created_at <= updated_at enforced at service layer
