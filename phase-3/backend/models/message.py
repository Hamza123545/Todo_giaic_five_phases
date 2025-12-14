"""
Message model for conversation history in AI chatbot Phase III.

This module defines the Message database model for storing
individual messages within conversations.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON
from sqlmodel import Column, Field, SQLModel


class Message(SQLModel, table=True):
    """
    Message model for conversation history.

    Immutable: No state transitions, messages are never modified after creation.

    Attributes:
        id: Unique message identifier (auto-increment)
        conversation_id: Parent conversation (foreign key, indexed)
        user_id: Message owner (denormalized for user isolation queries)
        role: Message sender ("user" | "assistant" | "system")
        content: Message text content
        tool_calls: JSON array of tool invocations (assistant role only)
        created_at: Message creation timestamp (indexed for ordering)
    """

    __tablename__ = "messages"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Keys & Indexes
    conversation_id: int = Field(foreign_key="conversations.id", index=True, nullable=False)
    user_id: str = Field(index=True, nullable=False)  # Denormalized for user isolation queries

    # Message Data
    role: str = Field(nullable=False)  # "user" | "assistant" | "system" (validated at service layer)
    content: str = Field(nullable=False)  # Message content (non-empty, validated at service layer)

    # Tool Calls (JSON) - only for "assistant" role
    tool_calls: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True, nullable=False)

    # Validation Rules (enforced at service layer):
    # - conversation_id must exist in conversations table
    # - user_id must match parent conversation.user_id
    # - role must be in ["user", "assistant", "system"]
    # - content must be non-empty
    # - tool_calls must be valid JSON (assistant role only)
