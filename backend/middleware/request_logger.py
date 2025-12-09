"""
Request logging middleware for FastAPI.

This middleware logs all incoming HTTP requests with detailed information
including method, path, status code, response time, user info, and client details.
"""

import logging
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable

logger = logging.getLogger(__name__)


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all incoming HTTP requests.

    Logs:
    - HTTP method and path
    - Status code
    - Response time (ms)
    - User ID (if authenticated)
    - IP address
    - User agent
    """

    def __init__(self, app):
        """
        Initialize request logger middleware.

        Args:
            app: FastAPI application instance
        """
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        Process request and log details.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware in chain

        Returns:
            Response: HTTP response
        """
        # Record start time
        start_time = time.time()

        # Extract request information
        method = request.method
        path = request.url.path
        ip_address = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")

        # Get user_id if authenticated (set by JWT middleware)
        user_id = getattr(request.state, "user_id", None)

        # Process request
        response = await call_next(request)

        # Calculate response time
        process_time = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Get status code
        status_code = response.status_code

        # Determine log level based on status code
        if status_code >= 500:
            log_level = logging.ERROR
        elif status_code >= 400:
            log_level = logging.WARNING
        else:
            log_level = logging.INFO

        # Log request details
        logger.log(
            log_level,
            f"{method} {path} - {status_code} - {process_time:.2f}ms",
            extra={
                "method": method,
                "path": path,
                "status_code": status_code,
                "response_time_ms": round(process_time, 2),
                "user_id": user_id,
                "ip_address": ip_address,
                "user_agent": user_agent,
            },
        )

        # Add response time header
        response.headers["X-Response-Time"] = f"{process_time:.2f}ms"

        return response
