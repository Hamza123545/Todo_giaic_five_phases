"""
Performance monitoring utilities.

This module provides performance monitoring and metrics collection
for tracking API performance and identifying bottlenecks.
"""

import time
from collections import defaultdict
from functools import wraps
from typing import Callable, Dict, List


# Performance metrics storage
metrics: Dict[str, List[float]] = defaultdict(list)
MAX_METRICS_PER_ENDPOINT = 1000  # Limit memory usage


def track_performance(endpoint_name: str):
    """
    Decorator to track endpoint performance.

    Args:
        endpoint_name: Name of the endpoint being tracked

    Returns:
        Callable: Decorated function

    Example:
        ```python
        @track_performance("get_tasks")
        def get_tasks(user_id: str):
            # Endpoint logic
            return tasks
        ```
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = (time.time() - start_time) * 1000  # Convert to ms
                record_metric(endpoint_name, duration)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = (time.time() - start_time) * 1000  # Convert to ms
                record_metric(endpoint_name, duration)

        # Return appropriate wrapper based on function type
        import inspect

        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def record_metric(endpoint_name: str, duration_ms: float):
    """
    Record performance metric for an endpoint.

    Args:
        endpoint_name: Name of the endpoint
        duration_ms: Duration in milliseconds
    """
    # Limit metrics per endpoint to prevent memory issues
    if len(metrics[endpoint_name]) >= MAX_METRICS_PER_ENDPOINT:
        metrics[endpoint_name] = metrics[endpoint_name][-MAX_METRICS_PER_ENDPOINT // 2 :]

    metrics[endpoint_name].append(duration_ms)


def get_endpoint_stats(endpoint_name: str) -> Dict[str, float]:
    """
    Get performance statistics for an endpoint.

    Args:
        endpoint_name: Name of the endpoint

    Returns:
        dict: Performance statistics (avg, min, max, p50, p95, p99)
    """
    if endpoint_name not in metrics or not metrics[endpoint_name]:
        return {
            "count": 0,
            "avg_ms": 0,
            "min_ms": 0,
            "max_ms": 0,
            "p50_ms": 0,
            "p95_ms": 0,
            "p99_ms": 0,
        }

    durations = sorted(metrics[endpoint_name])
    count = len(durations)

    return {
        "count": count,
        "avg_ms": sum(durations) / count,
        "min_ms": durations[0],
        "max_ms": durations[-1],
        "p50_ms": durations[int(count * 0.50)],
        "p95_ms": durations[int(count * 0.95)],
        "p99_ms": durations[int(count * 0.99)],
    }


def get_all_stats() -> Dict[str, Dict[str, float]]:
    """
    Get performance statistics for all endpoints.

    Returns:
        dict: Performance statistics for all tracked endpoints
    """
    return {endpoint: get_endpoint_stats(endpoint) for endpoint in metrics.keys()}


def reset_metrics():
    """
    Reset all performance metrics.
    """
    metrics.clear()


def get_slow_endpoints(threshold_ms: float = 2000) -> List[str]:
    """
    Get list of endpoints with average response time above threshold.

    Args:
        threshold_ms: Threshold in milliseconds (default: 2000ms = 2 seconds)

    Returns:
        list: List of slow endpoint names
    """
    slow_endpoints = []

    for endpoint_name in metrics.keys():
        stats = get_endpoint_stats(endpoint_name)
        if stats["avg_ms"] > threshold_ms:
            slow_endpoints.append(
                {"endpoint": endpoint_name, "avg_ms": stats["avg_ms"], "count": stats["count"]}
            )

    # Sort by average duration (slowest first)
    slow_endpoints.sort(key=lambda x: x["avg_ms"], reverse=True)

    return slow_endpoints
