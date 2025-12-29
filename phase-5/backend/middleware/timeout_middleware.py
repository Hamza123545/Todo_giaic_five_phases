"""
Timeout handling middleware for API requests.

This module implements request timeout handling to prevent
long-running requests from blocking the server.
"""

import asyncio
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class TimeoutMiddleware(BaseHTTPMiddleware):
    """
    Middleware to enforce request timeouts.

    Configuration:
        - Default timeout: 30 seconds
        - Can be configured per environment
        - Returns 504 Gateway Timeout on timeout
    """

    def __init__(self, app, timeout_seconds: int = 30):
        """
        Initialize timeout middleware.

        Args:
            app: FastAPI application
            timeout_seconds: Maximum request duration in seconds (default: 30)
        """
        super().__init__(app)
        self.timeout_seconds = timeout_seconds

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request with timeout enforcement.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware or route handler

        Returns:
            Response: HTTP response or timeout error
        """
        try:
            # Execute request with timeout
            response = await asyncio.wait_for(
                call_next(request), timeout=self.timeout_seconds
            )
            return response

        except asyncio.TimeoutError:
            # Request timed out
            return JSONResponse(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                content={
                    "success": False,
                    "error": {
                        "code": "REQUEST_TIMEOUT",
                        "message": f"Request timed out after {self.timeout_seconds} seconds",
                    },
                },
            )

        except Exception as exc:
            # Other errors should be handled by error handling middleware
            raise exc
