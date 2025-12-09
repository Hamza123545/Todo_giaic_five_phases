"""
Security headers middleware for FastAPI.

This middleware adds comprehensive security headers to all HTTP responses
to protect against common web vulnerabilities.
"""

import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.

    Security headers included:
    - X-Content-Type-Options: Prevents MIME sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Enables XSS filter
    - Strict-Transport-Security: Enforces HTTPS (production only)
    - Content-Security-Policy: Restricts resource loading
    - Referrer-Policy: Controls referrer information
    """

    def __init__(self, app):
        """
        Initialize security headers middleware.

        Args:
            app: FastAPI application instance
        """
        super().__init__(app)
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.is_production = self.environment == "production"

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and add security headers to response.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware in chain

        Returns:
            Response: HTTP response with security headers
        """
        # Call next middleware/route handler
        response = await call_next(request)

        # Add security headers to response
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        # Allow self and explicitly configured origins
        csp_policy = "default-src 'self'"
        response.headers["Content-Security-Policy"] = csp_policy

        # HSTS header (only in production with HTTPS)
        if self.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # Permissions Policy (formerly Feature-Policy)
        # Disable potentially dangerous features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=()"
        )

        return response
