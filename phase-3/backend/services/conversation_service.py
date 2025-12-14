"""
Conversation service layer for AI chatbot Phase III.

This module provides async functions for conversation and message management,
shared by chat endpoints and MCP tools.
"""

from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from models.conversation import Conversation
from models.message import Message


async def get_or_create_conversation(
    session: AsyncSession,
    user_id: str,
    conversation_id: Optional[int] = None
) -> Conversation:
    """
    Get existing conversation or create new one for user.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        conversation_id: Optional existing conversation ID

    Returns:
        Conversation: Existing or newly created conversation

    Raises:
        HTTPException: 404 if conversation_id provided but not found
        HTTPException: 403 if conversation belongs to different user
    """
    if conversation_id is not None:
        # Fetch existing conversation
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            )
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found or access denied"
            )

        # Update last activity timestamp
        conversation.updated_at = datetime.utcnow()
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)

        return conversation

    else:
        # Create new conversation
        new_conversation = Conversation(
            user_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(new_conversation)
        await session.commit()
        await session.refresh(new_conversation)

        return new_conversation


async def add_message(
    session: AsyncSession,
    user_id: str,
    conversation_id: int,
    role: str,
    content: str,
    tool_calls: Optional[dict] = None
) -> Message:
    """
    Add a new message to conversation.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        conversation_id: Target conversation ID
        role: Message sender ("user" | "assistant" | "system")
        content: Message text content (non-empty)
        tool_calls: Optional tool invocations (assistant role only)

    Returns:
        Message: Created message instance

    Raises:
        HTTPException: 400 if validation fails (invalid role, empty content)
        HTTPException: 404 if conversation not found
        HTTPException: 403 if conversation belongs to different user
    """
    # Validate role
    if role not in ["user", "assistant", "system"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}. Must be 'user', 'assistant', or 'system'"
        )

    # Validate content
    if not content or not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    # Verify conversation exists and user has access
    result = await session.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found or access denied"
        )

    # Create message
    new_message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content.strip(),
        tool_calls=tool_calls,
        created_at=datetime.utcnow()
    )

    session.add(new_message)
    await session.commit()
    await session.refresh(new_message)

    return new_message


async def get_conversation_history(
    session: AsyncSession,
    user_id: str,
    conversation_id: int,
    limit: Optional[int] = None
) -> List[Message]:
    """
    Retrieve conversation history ordered chronologically.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        conversation_id: Target conversation ID
        limit: Optional limit on number of messages (most recent N)

    Returns:
        List[Message]: Messages ordered by created_at (oldest first)

    Raises:
        HTTPException: 404 if conversation not found
        HTTPException: 403 if conversation belongs to different user
    """
    # Verify conversation exists and user has access
    result = await session.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found or access denied"
        )

    # Build query
    query = select(Message).where(
        Message.conversation_id == conversation_id,
        Message.user_id == user_id
    ).order_by(Message.created_at)

    # Apply limit if provided (get last N messages)
    if limit and limit > 0:
        # Get total count
        count_result = await session.execute(
            select(Message).where(Message.conversation_id == conversation_id)
        )
        total_count = len(count_result.scalars().all())

        # Calculate offset to get last N messages
        if total_count > limit:
            query = query.offset(total_count - limit)

    # Execute query
    result = await session.execute(query)
    messages = result.scalars().all()

    return list(messages)


async def get_user_conversations(
    session: AsyncSession,
    user_id: str,
    limit: int = 50,
    offset: int = 0
) -> List[Conversation]:
    """
    Retrieve all conversations for a user (most recent first).

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        limit: Maximum number of conversations to return (default 50)
        offset: Number of conversations to skip (pagination)

    Returns:
        List[Conversation]: User's conversations ordered by updated_at (newest first)
    """
    query = (
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )

    result = await session.execute(query)
    conversations = result.scalars().all()

    return list(conversations)
