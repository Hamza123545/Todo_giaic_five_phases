"""
Query result caching utilities for performance optimization.

This module provides caching functionality for frequently accessed
data to reduce database load and improve response times.
"""

import hashlib
import json
from functools import wraps
from typing import Any, Callable, Optional

from cachetools import TTLCache


# Create cache with TTL (Time To Live)
# Max 1000 items, 5 minute TTL
query_cache = TTLCache(maxsize=1000, ttl=300)


def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate cache key from function arguments.

    Args:
        prefix: Cache key prefix (usually function name)
        *args: Positional arguments
        **kwargs: Keyword arguments

    Returns:
        str: Unique cache key
    """
    # Create deterministic key from arguments
    key_data = {
        "prefix": prefix,
        "args": str(args),
        "kwargs": json.dumps(kwargs, sort_keys=True, default=str),
    }
    key_string = json.dumps(key_data, sort_keys=True)

    # Hash for shorter key
    return hashlib.md5(key_string.encode()).hexdigest()


def cached_query(ttl: int = 300, key_prefix: Optional[str] = None):
    """
    Decorator to cache query results.

    Args:
        ttl: Time to live in seconds (default: 300 = 5 minutes)
        key_prefix: Optional key prefix (default: function name)

    Returns:
        Callable: Decorated function

    Example:
        ```python
        @cached_query(ttl=600)
        def get_user_tasks(user_id: str):
            # Query database
            return tasks
        ```
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            # Generate cache key
            prefix = key_prefix or func.__name__
            cache_key = generate_cache_key(prefix, *args, **kwargs)

            # Check cache
            if cache_key in query_cache:
                return query_cache[cache_key]

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            query_cache[cache_key] = result

            return result

        # Add cache clearing method
        wrapper.clear_cache = lambda: query_cache.clear()

        return wrapper

    return decorator


def invalidate_cache(pattern: Optional[str] = None):
    """
    Invalidate cache entries matching pattern.

    Args:
        pattern: Optional pattern to match (None = clear all)
    """
    if pattern is None:
        query_cache.clear()
    else:
        # Remove entries matching pattern
        keys_to_remove = [key for key in query_cache.keys() if pattern in key]
        for key in keys_to_remove:
            del query_cache[key]


def get_cache_stats() -> dict:
    """
    Get cache statistics.

    Returns:
        dict: Cache statistics (size, max size, hit rate)
    """
    return {
        "current_size": len(query_cache),
        "max_size": query_cache.maxsize,
        "ttl_seconds": query_cache.ttl,
    }
