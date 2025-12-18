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
        title: Conversation title (auto-generated or user-set)
        is_active: Whether conversation is still active
        created_at: Conversation creation timestamp
        updated_at: Last message timestamp
    """

    __tablename__ = "conversations"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Keys & Indexes
    user_id: str = Field(index=True, nullable=False)  # User isolation (indexed for queries)

    # Conversation metadata
    title: str = Field(max_length=500, nullable=False)  # Conversation title
    is_active: bool = Field(default=True, nullable=False, index=True)  # Active status

    # Timestamps with default_factory
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False, index=True)

    # Validation: user_id non-empty, created_at <= updated_at enforced at service layer
