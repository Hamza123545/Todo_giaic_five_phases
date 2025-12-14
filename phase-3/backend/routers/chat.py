"""
Chat API endpoint for AI-powered task management (Phase III).

This module provides the chat endpoint that integrates TodoAgent
with conversation persistence and SSE streaming.

Endpoint: POST /api/{user_id}/chat
"""

import json
from typing import AsyncIterator

from agents import Runner
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from agents.todo_agent import create_todo_agent
from db import get_async_session
from middleware.jwt import verify_jwt_token
from schemas.chat import ChatRequest, ChatResponse
from services.conversation_service import (
    add_message,
    get_conversation_history,
    get_or_create_conversation,
)


# Create router
router = APIRouter(prefix="/api", tags=["chat"])


async def stream_chat_response(
    user_id: str,
    conversation_id: int,
    user_message: str,
    session: AsyncSession,
) -> AsyncIterator[str]:
    """
    Generate SSE stream for chat response.

    This function:
    1. Fetches conversation history from database
    2. Builds message array for agent (history + new message)
    3. Runs TodoAgent with streaming enabled
    4. Streams agent output as SSE events
    5. Persists assistant response to database

    Args:
        user_id: User's unique identifier
        conversation_id: Active conversation ID
        user_message: Current user message
        session: Async database session

    Yields:
        str: SSE formatted events (data: {json}\n\n)

    SSE Event Format:
        - data: {"type": "message", "content": "...", "done": false}
        - data: {"type": "tool_call", "tool": "add_task", "args": {...}}
        - data: {"type": "done", "conversation_id": 1}
    """
    try:
        # 1. Fetch conversation history from database
        history_messages = await get_conversation_history(
            session=session,
            user_id=user_id,
            conversation_id=conversation_id,
            limit=50,  # Last 50 messages for context
        )

        # 2. Build message array for agent
        agent_messages = []

        # Add conversation history
        for msg in history_messages:
            agent_messages.append({
                "role": msg.role,
                "content": msg.content,
            })

        # Add new user message
        agent_messages.append({
            "role": "user",
            "content": user_message,
        })

        # 3. Store user message in database
        await add_message(
            session=session,
            user_id=user_id,
            conversation_id=conversation_id,
            role="user",
            content=user_message,
        )

        # 4. Create TodoAgent and run with streaming
        todo_agent = create_todo_agent()
        agent = todo_agent.get_agent()

        # Track assistant response for persistence
        assistant_response = ""
        tool_calls_log = []

        # 5. Run agent with streaming
        result = Runner.run_streamed(agent, agent_messages)

        # 6. Stream agent output as SSE events
        async for event in result:
            # Handle different event types from Agents SDK
            event_type = event.get("type")

            if event_type == "content_delta":
                # Text content streaming
                content_delta = event.get("content", "")
                assistant_response += content_delta

                # Yield SSE event
                yield f"data: {json.dumps({'type': 'message', 'content': content_delta, 'done': False})}\n\n"

            elif event_type == "tool_call":
                # Tool invocation event
                tool_name = event.get("tool_name", "")
                tool_args = event.get("tool_args", {})

                tool_calls_log.append({
                    "tool": tool_name,
                    "args": tool_args,
                })

                # Yield SSE event
                yield f"data: {json.dumps({'type': 'tool_call', 'tool': tool_name, 'args': tool_args})}\n\n"

            elif event_type == "error":
                # Error event
                error_message = event.get("message", "An error occurred")
                yield f"data: {json.dumps({'type': 'error', 'message': error_message})}\n\n"
                return

        # 7. Store assistant response in database
        await add_message(
            session=session,
            user_id=user_id,
            conversation_id=conversation_id,
            role="assistant",
            content=assistant_response,
            tool_calls={"calls": tool_calls_log} if tool_calls_log else None,
        )

        # 8. Send final "done" event with conversation_id
        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id})}\n\n"

    except Exception as e:
        # Handle unexpected errors
        error_response = {
            "type": "error",
            "message": f"Chat processing error: {str(e)}"
        }
        yield f"data: {json.dumps(error_response)}\n\n"


@router.post("/{user_id}/chat")
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    session: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(verify_jwt_token),
):
    """
    Chat endpoint with SSE streaming.

    **Stateless Request Cycle:**
    1. Receive user message
    2. Fetch conversation history from database
    3. Build message array for agent (history + new message)
    4. Store user message in database
    5. Run agent with MCP tools
    6. Agent invokes appropriate MCP tool(s)
    7. Store assistant response in database
    8. Return response to client
    9. Server holds NO state (ready for next request)

    **Authentication:**
    - Requires valid JWT token in Authorization header
    - User ID from JWT must match user_id in URL path

    **Request Body:**
    - conversation_id (int | null): Existing conversation ID or null for new
    - message (str): User's message text (1-5000 characters)

    **Response:**
    - Server-Sent Events (SSE) stream
    - Content-Type: text/event-stream
    - Events: message, tool_call, done, error

    **Example Request:**
    ```bash
    curl -X POST "http://localhost:8000/api/user123/chat" \
      -H "Authorization: Bearer <token>" \
      -H "Content-Type: application/json" \
      -d '{"conversation_id": null, "message": "Add a task to buy groceries"}'
    ```

    **Example SSE Stream:**
    ```
    data: {"type": "message", "content": "I'll add", "done": false}

    data: {"type": "message", "content": " that for you!", "done": false}

    data: {"type": "tool_call", "tool": "add_task", "args": {"user_id": "user123", "title": "Buy groceries"}}

    data: {"type": "message", "content": " Task created!", "done": false}

    data: {"type": "done", "conversation_id": 1}
    ```

    Args:
        user_id: User ID from URL path (must match JWT token)
        request: ChatRequest with conversation_id and message
        session: Async database session (injected)
        current_user: Current user from JWT token (injected)

    Returns:
        StreamingResponse: SSE stream with chat response

    Raises:
        HTTPException: 403 if user_id doesn't match JWT token
        HTTPException: 400 if validation fails
        HTTPException: 404 if conversation not found
    """
    # 1. Verify user_id from JWT matches URL path
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: cannot access other users' conversations"
        )

    # 2. Validate request
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )

    # 3. Get or create conversation
    conversation = await get_or_create_conversation(
        session=session,
        user_id=user_id,
        conversation_id=request.conversation_id,
    )

    # 4. Return SSE streaming response
    return StreamingResponse(
        stream_chat_response(
            user_id=user_id,
            conversation_id=conversation.id,
            user_message=request.message.strip(),
            session=session,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable proxy buffering (nginx)
        },
    )


@router.get("/{user_id}/conversations")
async def get_user_conversations_endpoint(
    user_id: str,
    session: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(verify_jwt_token),
    limit: int = 50,
    offset: int = 0,
):
    """
    Get user's conversation list.

    Retrieve all conversations for authenticated user with pagination.

    **Authentication:**
    - Requires valid JWT token
    - User ID from JWT must match user_id in URL

    **Query Parameters:**
    - limit (int): Maximum conversations to return (default 50, max 100)
    - offset (int): Number of conversations to skip (default 0)

    Args:
        user_id: User ID from URL path
        session: Async database session (injected)
        current_user: Current user from JWT token (injected)
        limit: Maximum conversations to return
        offset: Pagination offset

    Returns:
        dict: List of conversations with metadata

    Raises:
        HTTPException: 403 if user_id doesn't match JWT token
    """
    # Verify user_id matches JWT token
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: cannot access other users' conversations"
        )

    # Validate and cap limit
    limit = min(limit, 100)

    # Get conversations from service
    from services.conversation_service import get_user_conversations

    conversations = await get_user_conversations(
        session=session,
        user_id=user_id,
        limit=limit,
        offset=offset,
    )

    # Format response
    return {
        "success": True,
        "data": {
            "conversations": [
                {
                    "id": conv.id,
                    "created_at": conv.created_at.isoformat(),
                    "updated_at": conv.updated_at.isoformat(),
                }
                for conv in conversations
            ],
            "count": len(conversations),
            "limit": limit,
            "offset": offset,
        },
    }


@router.get("/{user_id}/conversations/{conversation_id}/messages")
async def get_conversation_messages_endpoint(
    user_id: str,
    conversation_id: int,
    session: AsyncSession = Depends(get_async_session),
    current_user: dict = Depends(verify_jwt_token),
    limit: int | None = None,
):
    """
    Get conversation message history.

    Retrieve all messages for a specific conversation.

    **Authentication:**
    - Requires valid JWT token
    - User ID from JWT must match user_id in URL

    **Query Parameters:**
    - limit (int | None): Optional limit on number of messages

    Args:
        user_id: User ID from URL path
        conversation_id: Conversation ID from URL path
        session: Async database session (injected)
        current_user: Current user from JWT token (injected)
        limit: Optional message limit

    Returns:
        dict: List of messages ordered chronologically

    Raises:
        HTTPException: 403 if user_id doesn't match JWT token
        HTTPException: 404 if conversation not found
    """
    # Verify user_id matches JWT token
    if current_user.get("id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User ID mismatch: cannot access other users' conversations"
        )

    # Get messages from service
    messages = await get_conversation_history(
        session=session,
        user_id=user_id,
        conversation_id=conversation_id,
        limit=limit,
    )

    # Format response
    return {
        "success": True,
        "data": {
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "tool_calls": msg.tool_calls,
                    "created_at": msg.created_at.isoformat(),
                }
                for msg in messages
            ],
            "count": len(messages),
        },
    }
