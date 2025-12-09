"""
Performance monitoring middleware for FastAPI.

This middleware tracks request/response times and logs slow requests
to help identify performance bottlenecks.
"""

import logging
import os
import time
from collections import defaultdict
from datetime import datetime, timedelta
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable, Dict, List

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor performance and log slow requests.

    Tracks:
    - Request/response times
    - Slow requests (above threshold)
    - Endpoint-specific metrics
    - Percentile calculations (p50, p95, p99)
    """

    def __init__(self, app):
        """
        Initialize performance monitoring middleware.

        Args:
            app: FastAPI application instance
        """
        super().__init__(app)

        # Get slow request threshold from environment (in milliseconds)
        self.slow_threshold_ms = float(
            os.getenv("SLOW_REQUEST_THRESHOLD_MS", "1000")
        )

        # Store request times for percentile calculations
        self.request_times: Dict[str, List[float]] = defaultdict(list)
        self.last_percentile_log = datetime.utcnow()
        self.percentile_log_interval = timedelta(minutes=5)  # Log every 5 minutes

        # Maximum stored times per endpoint (to prevent memory growth)
        self.max_stored_times = 1000

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """
        Process request and monitor performance.

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

        # Process request
        response = await call_next(request)

        # Calculate response time
        process_time_ms = (time.time() - start_time) * 1000

        # Store request time for percentile calculations
        endpoint_key = f"{method} {path}"
        self._store_request_time(endpoint_key, process_time_ms)

        # Log slow requests
        if process_time_ms > self.slow_threshold_ms:
            logger.warning(
                f"Slow request detected: {method} {path} took {process_time_ms:.2f}ms (threshold: {self.slow_threshold_ms}ms)",
                extra={
                    "method": method,
                    "path": path,
                    "response_time_ms": round(process_time_ms, 2),
                    "threshold_ms": self.slow_threshold_ms,
                    "status_code": response.status_code,
                    "slow_request": True,
                },
            )

        # Log percentiles periodically
        self._log_percentiles_if_due()

        # Add performance header
        response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"

        return response

    def _store_request_time(self, endpoint: str, time_ms: float):
        """
        Store request time for percentile calculations.

        Args:
            endpoint: Endpoint identifier
            time_ms: Request processing time in milliseconds
        """
        # Limit stored times to prevent memory growth
        if len(self.request_times[endpoint]) >= self.max_stored_times:
            # Keep only the most recent times
            self.request_times[endpoint] = self.request_times[endpoint][
                -self.max_stored_times // 2 :
            ]

        self.request_times[endpoint].append(time_ms)

    def _log_percentiles_if_due(self):
        """
        Log percentile statistics if interval has elapsed.
        """
        now = datetime.utcnow()
        if now - self.last_percentile_log >= self.percentile_log_interval:
            self._log_percentiles()
            self.last_percentile_log = now

    def _log_percentiles(self):
        """
        Calculate and log percentile statistics for all endpoints.
        """
        if not self.request_times:
            return

        logger.info("Performance percentiles:")

        for endpoint, times in self.request_times.items():
            if not times:
                continue

            # Sort times for percentile calculation
            sorted_times = sorted(times)
            count = len(sorted_times)

            # Calculate percentiles
            p50 = self._calculate_percentile(sorted_times, 50)
            p95 = self._calculate_percentile(sorted_times, 95)
            p99 = self._calculate_percentile(sorted_times, 99)
            avg = sum(sorted_times) / count
            max_time = max(sorted_times)

            logger.info(
                f"  {endpoint}: p50={p50:.2f}ms, p95={p95:.2f}ms, p99={p99:.2f}ms, avg={avg:.2f}ms, max={max_time:.2f}ms (n={count})",
                extra={
                    "endpoint": endpoint,
                    "p50_ms": round(p50, 2),
                    "p95_ms": round(p95, 2),
                    "p99_ms": round(p99, 2),
                    "avg_ms": round(avg, 2),
                    "max_ms": round(max_time, 2),
                    "sample_count": count,
                },
            )

    def _calculate_percentile(
        self, sorted_times: List[float], percentile: int
    ) -> float:
        """
        Calculate the specified percentile from sorted times.

        Args:
            sorted_times: Sorted list of times
            percentile: Percentile to calculate (0-100)

        Returns:
            float: Percentile value
        """
        if not sorted_times:
            return 0.0

        index = int((percentile / 100) * len(sorted_times))
        # Ensure index is within bounds
        index = min(index, len(sorted_times) - 1)
        return sorted_times[index]
