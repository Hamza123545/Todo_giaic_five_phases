"""
Request and error logging middleware with structured logging.

This module provides comprehensive request/response logging and
enhanced error handling with structured JSON logging.
"""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from pythonjsonlogger import jsonlogger
from starlette.middleware.base import BaseHTTPMiddleware

# Configure structured JSON logging
logger = logging.getLogger("todo_api")
log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(name)s %(levelname)s %(message)s %(request_id)s %(method)s %(path)s %(status_code)s %(duration_ms)s"
)
log_handler.setFormatter(formatter)
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

# Security event logger (separate logger for security events)
security_logger = logging.getLogger("todo_api.security")
security_handler = logging.StreamHandler()
security_handler.setFormatter(formatter)
security_logger.addHandler(security_handler)
security_logger.setLevel(logging.WARNING)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging all incoming requests and outgoing responses.

    Logs:
        - Request method, path, headers
        - Response status code
        - Request duration in milliseconds
        - Request ID for tracing
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log details.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware or route handler

        Returns:
            Response: HTTP response from handler
        """
        # Generate unique request ID for tracing
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Record start time
        start_time = time.time()

        # Log incoming request
        logger.info(
            "Incoming request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_host": request.client.host if request.client else "unknown",
            },
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000

            # Log response
            logger.info(
                "Request completed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": f"{duration_ms:.2f}",
                },
            )

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as exc:
            # Calculate duration even on error
            duration_ms = (time.time() - start_time) * 1000

            # Log error
            logger.error(
                f"Request failed: {str(exc)}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": f"{duration_ms:.2f}",
                    "error": str(exc),
                },
                exc_info=True,
            )

            # Return 500 error response
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An internal server error occurred",
                        "request_id": request_id,
                    },
                },
                headers={"X-Request-ID": request_id},
            )


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Enhanced error handling middleware with structured logging.

    Catches unhandled exceptions and returns standardized error responses
    while logging detailed error information.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request with error handling.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware or route handler

        Returns:
            Response: HTTP response from handler or error response
        """
        try:
            response = await call_next(request)
            return response

        except ValueError as exc:
            # Validation errors
            logger.warning(
                f"Validation error: {str(exc)}",
                extra={
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": "validation_error",
                },
            )

            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": str(exc),
                    },
                },
            )

        except PermissionError as exc:
            # Permission errors
            logger.warning(
                f"Permission denied: {str(exc)}",
                extra={
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": "permission_error",
                },
            )

            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": str(exc),
                    },
                },
            )

        except Exception as exc:
            # Generic unhandled errors
            logger.error(
                f"Unhandled error: {str(exc)}",
                extra={
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "method": request.method,
                    "path": request.url.path,
                    "error_type": type(exc).__name__,
                },
                exc_info=True,
            )

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An internal server error occurred",
                    },
                },
            )


def log_security_event(
    event_type: str,
    message: str,
    request: Request = None,
    user_id: str = None,
    severity: str = "warning",
    **extra_fields,
):
    """
    Log security events (auth failures, unauthorized access, etc.).

    Args:
        event_type: Type of security event (e.g., "auth_failure", "unauthorized_access")
        message: Human-readable message describing the event
        request: Optional HTTP request object
        user_id: Optional user ID involved in the event
        severity: Log severity level ("info", "warning", "error", "critical")
        **extra_fields: Additional fields to include in log
    """
    extra = {
        "event_type": event_type,
        "user_id": user_id or "unknown",
        **extra_fields,
    }

    if request:
        extra.update(
            {
                "request_id": getattr(request.state, "request_id", "unknown"),
                "method": request.method,
                "path": request.url.path,
                "client_host": request.client.host if request.client else "unknown",
            }
        )

    # Log at appropriate level
    log_func = getattr(security_logger, severity, security_logger.warning)
    log_func(message, extra=extra)
