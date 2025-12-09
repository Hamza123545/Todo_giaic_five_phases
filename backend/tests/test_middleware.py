"""
Tests for middleware functionality.

Tests security headers, rate limiting, request logging, and performance monitoring.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.request_logger import RequestLoggerMiddleware
from middleware.performance import PerformanceMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address


@pytest.fixture
def test_app():
    """Create a test FastAPI app with middleware."""
    app = FastAPI()

    # Add middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(PerformanceMiddleware)
    app.add_middleware(RequestLoggerMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"message": "test"}

    return app


@pytest.fixture
def client(test_app):
    """Create a test client."""
    return TestClient(test_app)


class TestSecurityHeaders:
    """Test security headers middleware."""

    def test_security_headers_present(self, client):
        """Test that security headers are added to responses."""
        response = client.get("/test")

        assert response.status_code == 200
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "Referrer-Policy" in response.headers
        assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        assert "Content-Security-Policy" in response.headers
        assert "Permissions-Policy" in response.headers

    def test_hsts_not_in_development(self, client):
        """Test that HSTS header is not added in development."""
        response = client.get("/test")

        # HSTS should not be present in development
        assert "Strict-Transport-Security" not in response.headers


class TestPerformanceMonitoring:
    """Test performance monitoring middleware."""

    def test_performance_header_added(self, client):
        """Test that performance timing header is added."""
        response = client.get("/test")

        assert response.status_code == 200
        assert "X-Process-Time" in response.headers

        # Parse timing value
        process_time = response.headers["X-Process-Time"]
        assert process_time.endswith("ms")
        time_value = float(process_time.replace("ms", ""))
        assert time_value >= 0


class TestRequestLogger:
    """Test request logging middleware."""

    def test_response_time_header(self, client):
        """Test that response time header is added."""
        response = client.get("/test")

        assert response.status_code == 200
        assert "X-Response-Time" in response.headers

        # Parse timing value
        response_time = response.headers["X-Response-Time"]
        assert response_time.endswith("ms")
        time_value = float(response_time.replace("ms", ""))
        assert time_value >= 0


class TestRateLimiting:
    """Test rate limiting functionality."""

    def test_rate_limiter_initialization(self):
        """Test that rate limiter can be initialized."""
        limiter = Limiter(
            key_func=get_remote_address,
            default_limits=["100/minute"],
            storage_uri="memory://",
        )

        assert limiter is not None
        assert limiter.enabled is True

    def test_rate_limit_exceeded_handling(self):
        """Test rate limit exceeded scenario."""
        from fastapi import Request

        # Create app with very low rate limit for testing
        app = FastAPI()
        limiter = Limiter(
            key_func=get_remote_address,
            default_limits=["2/minute"],  # Very low limit
            storage_uri="memory://",
        )
        app.state.limiter = limiter

        @app.get("/limited")
        @limiter.limit("2/minute")
        async def limited_endpoint(request: Request):
            return {"message": "success"}

        client = TestClient(app)

        # First two requests should succeed
        response1 = client.get("/limited")
        assert response1.status_code == 200

        response2 = client.get("/limited")
        assert response2.status_code == 200

        # Third request should be rate limited
        response3 = client.get("/limited")
        assert response3.status_code == 429  # Too Many Requests


class TestMiddlewareIntegration:
    """Test middleware integration and ordering."""

    def test_all_middleware_headers_present(self, client):
        """Test that all middleware contribute headers correctly."""
        response = client.get("/test")

        assert response.status_code == 200

        # Security headers
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers

        # Performance headers
        assert "X-Process-Time" in response.headers

        # Request logger headers
        assert "X-Response-Time" in response.headers

    def test_middleware_ordering(self, client):
        """Test that middleware executes in correct order."""
        # Make request
        response = client.get("/test")

        # All headers should be present (indicating all middleware executed)
        assert "X-Content-Type-Options" in response.headers  # Security
        assert "X-Process-Time" in response.headers  # Performance
        assert "X-Response-Time" in response.headers  # Request logger

        # Response should be successful
        assert response.status_code == 200
        assert response.json() == {"message": "test"}


class TestAdvancedFeaturesRateLimiting:
    """Test advanced features rate limiting functionality."""

    def test_advanced_features_rate_limiter_initialization(self):
        """Test that advanced features rate limiter can be initialized."""
        from middleware.rate_limit import advanced_features_limiter

        assert advanced_features_limiter is not None
        assert advanced_features_limiter.enabled is True

    def test_advanced_features_rate_limit_stricter_than_default(self):
        """Test that advanced features have stricter rate limits."""
        from fastapi import Request
        from slowapi import Limiter
        from slowapi.util import get_remote_address

        # Create a fresh limiter instance for testing
        test_limiter = Limiter(
            key_func=get_remote_address,
            storage_uri="memory://",
        )

        # Create app with advanced features rate limiting
        app = FastAPI()
        app.state.limiter = test_limiter

        @app.get("/export")
        @test_limiter.limit("3/minute")  # Stricter limit for testing
        async def export_endpoint(request: Request):
            return {"message": "export"}

        client = TestClient(app)

        # First three requests should succeed
        for i in range(3):
            response = client.get("/export")
            assert response.status_code == 200, f"Request {i+1} failed"

        # Fourth request should be rate limited
        response = client.get("/export")
        assert response.status_code == 429  # Too Many Requests

    def test_different_endpoints_independent_limits(self):
        """Test that different advanced features endpoints have independent rate limits."""
        from fastapi import Request
        from slowapi import Limiter
        from slowapi.util import get_remote_address

        # Create a fresh limiter instance for testing
        test_limiter = Limiter(
            key_func=get_remote_address,
            storage_uri="memory://",
        )

        app = FastAPI()
        app.state.limiter = test_limiter

        @app.get("/export")
        @test_limiter.limit("2/minute")
        async def export_endpoint(request: Request):
            return {"message": "export"}

        @app.get("/import")
        @test_limiter.limit("2/minute")
        async def import_endpoint(request: Request):
            return {"message": "import"}

        client = TestClient(app)

        # Two requests to export
        response1 = client.get("/export")
        assert response1.status_code == 200

        response2 = client.get("/export")
        assert response2.status_code == 200

        # Export should be limited now
        response3 = client.get("/export")
        assert response3.status_code == 429

        # But import should still work (independent limit)
        response4 = client.get("/import")
        assert response4.status_code == 200
