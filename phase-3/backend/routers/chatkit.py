"""
ChatKit endpoint for processing chat requests.

This module provides the /chatkit endpoint that handles all ChatKit
protocol requests, including message streaming and widget rendering.
"""

import logging
from fastapi import APIRouter, Request, Depends
from fastapi.responses import Response, StreamingResponse
from chatkit.server import StreamingResult

from middleware.jwt import verify_jwt_token
from services.chatkit_server import TaskChatKitServer
from services.chatkit_store import MemoryStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chatkit"])

# Global ChatKit server instance
_store = MemoryStore()
_chatkit_server = TaskChatKitServer(_store)


def get_current_user_info(user_data: dict = Depends(verify_jwt_token)) -> dict:
    """
    Extract user information from JWT token for ChatKit context.

    Args:
        user_data: User data from JWT verification (user_id, email)

    Returns:
        dict: User information (id, name, email)
    """
    return {
        "id": user_data["user_id"],
        "name": user_data.get("name", "there"),
        "email": user_data.get("email"),
    }


@router.post("/chatkit")
async def chatkit_endpoint(
    request: Request,
    user_info: dict = Depends(get_current_user_info),
) -> Response:
    """
    ChatKit endpoint that processes all chat requests.

    This endpoint:
    1. Authenticates the user via JWT
    2. Extracts the request payload
    3. Processes it through the ChatKit server
    4. Returns streaming (SSE) or JSON response

    Args:
        request: FastAPI request object
        user_info: Authenticated user information from JWT (id, name, email)

    Returns:
        Response: StreamingResponse for SSE or JSON Response
    """
    user_id = user_info["id"]
    user_name = user_info.get("name", "there")
    logger.info(f"ChatKit request from authenticated user {user_id} ({user_name})")

    try:
        # Read request body
        payload = await request.body()
        logger.info(f"Received payload: {len(payload)} bytes")
        logger.debug(f"Payload content: {payload.decode('utf-8')}")

        # Add user info to context for the ChatKit server
        context = {
            "user_id": user_id,
            "user_name": user_name,
            "user_email": user_info.get("email"),
        }

        # Process through ChatKit server
        result = await _chatkit_server.process(payload, context)

        # Return appropriate response type
        if isinstance(result, StreamingResult):
            logger.info(f"Returning streaming response for user {user_id}")
            return StreamingResponse(
                result,
                media_type="text/event-stream",
            )

        # JSON response
        logger.info(f"Returning JSON response for user {user_id}")
        return Response(
            content=result.json,
            media_type="application/json",
        )

    except Exception as e:
        logger.error(f"ChatKit error for user {user_id}: {e}", exc_info=True)
        return Response(
            content={"error": "Internal server error"},
            status_code=500,
            media_type="application/json",
        )
