"""
Rate limiting middleware to prevent API abuse.

This module provides configurable rate limiting using slowapi
to protect against excessive requests from a single IP address.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address


def get_limiter() -> Limiter:
    """
    Create and configure the rate limiter.

    Returns:
        Limiter: Configured slowapi limiter instance

    Configuration:
        - Default: 100 requests per minute per IP
        - Can be overridden per-endpoint using decorators
        - Uses IP address as key for rate limiting
    """
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["100/minute"],
        storage_uri="memory://",
        strategy="fixed-window",
    )
    return limiter


# Create global limiter instance
limiter = get_limiter()


def get_rate_limit_exceeded_handler():
    """
    Return the rate limit exceeded handler function.

    Returns:
        Callable: Handler function for rate limit exceeded errors
    """
    return _rate_limit_exceeded_handler
