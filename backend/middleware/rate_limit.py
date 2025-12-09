"""
Rate limiting middleware for FastAPI using slowapi.

This module provides rate limiting functionality to prevent API abuse
and protect against DDoS attacks.
"""

import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import logging

logger = logging.getLogger(__name__)
security_logger = logging.getLogger("security")


# Get rate limit from environment (default: 100 requests per minute)
RATE_LIMIT_PER_MINUTE = os.getenv("RATE_LIMIT_PER_MINUTE", "100")

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri="memory://",  # Use in-memory storage (for production, use Redis)
    strategy="fixed-window",  # Rate limiting strategy
)


def get_user_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.

    For authenticated users, use user_id.
    For unauthenticated users, use IP address.

    Args:
        request: FastAPI request object

    Returns:
        str: Unique identifier for rate limiting
    """
    # Try to get user_id from request state (set by JWT middleware)
    if hasattr(request.state, "user_id"):
        return f"user:{request.state.user_id}"

    # Fallback to IP address
    return get_remote_address(request)


def get_rate_limit_key(request: Request) -> str:
    """
    Get rate limit key for the request.

    Args:
        request: FastAPI request object

    Returns:
        str: Rate limit key
    """
    return get_user_identifier(request)


# Custom limiter with user-based rate limiting
user_limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=[f"{RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri="memory://",
    strategy="fixed-window",
)


def is_exempt_path(path: str) -> bool:
    """
    Check if the request path is exempt from rate limiting.

    Health check endpoints are exempt to allow monitoring.

    Args:
        path: Request path

    Returns:
        bool: True if exempt, False otherwise
    """
    exempt_paths = [
        "/health",
        "/api/health",
        "/docs",
        "/redoc",
        "/openapi.json",
    ]
    return path in exempt_paths


def log_rate_limit_exceeded(request: Request):
    """
    Log rate limit exceeded event to security log.

    Args:
        request: FastAPI request object
    """
    ip_address = get_remote_address(request)
    user_id = getattr(request.state, "user_id", None)
    path = request.url.path

    security_logger.warning(
        "Rate limit exceeded",
        extra={
            "event_type": "rate_limit_exceeded",
            "ip_address": ip_address,
            "user_id": user_id,
            "path": path,
            "method": request.method,
        },
    )


# Advanced features rate limiting
# Stricter limits for resource-intensive operations (export/import/bulk)
ADVANCED_FEATURES_RATE_LIMIT = os.getenv("ADVANCED_FEATURES_RATE_LIMIT", "10")

advanced_features_limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=[f"{ADVANCED_FEATURES_RATE_LIMIT}/minute"],
    storage_uri="memory://",
    strategy="fixed-window",
)
