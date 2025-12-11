"""
Tests for security headers middleware.

This module tests that comprehensive security headers are
properly added to all API responses.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_security_headers_present():
    """Test that all security headers are present in response."""
    response = client.get("/health")

    assert response.status_code == 200

    # Check all OWASP recommended security headers
    assert "X-Content-Type-Options" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"

    assert "X-Frame-Options" in response.headers
    assert response.headers["X-Frame-Options"] == "DENY"

    assert "X-XSS-Protection" in response.headers
    assert response.headers["X-XSS-Protection"] == "1; mode=block"

    assert "Strict-Transport-Security" in response.headers
    assert "max-age" in response.headers["Strict-Transport-Security"]

    assert "Content-Security-Policy" in response.headers
    assert "default-src" in response.headers["Content-Security-Policy"]

    assert "Referrer-Policy" in response.headers
    assert "Permissions-Policy" in response.headers


def test_security_headers_on_api_endpoints():
    """Test that security headers are present on API endpoints."""
    response = client.get("/api/health")

    assert response.status_code == 200
    assert "X-Content-Type-Options" in response.headers
    assert "X-Frame-Options" in response.headers
    assert "Content-Security-Policy" in response.headers


def test_security_headers_on_error_responses():
    """Test that security headers are present even on error responses."""
    # Make request to non-existent endpoint
    response = client.get("/nonexistent")

    assert response.status_code == 404
    assert "X-Content-Type-Options" in response.headers
    assert "X-Frame-Options" in response.headers


def test_csp_headers_prevent_xss():
    """Test that Content-Security-Policy headers help prevent XSS."""
    response = client.get("/health")

    csp = response.headers.get("Content-Security-Policy", "")

    # Check that CSP restricts script sources
    assert "default-src" in csp or "script-src" in csp

    # Check that frame-ancestors is restricted
    assert "frame-ancestors" in csp


def test_hsts_header_forces_https():
    """Test that HSTS header forces HTTPS."""
    response = client.get("/health")

    hsts = response.headers.get("Strict-Transport-Security", "")

    # Check max-age is set
    assert "max-age" in hsts

    # Check it's at least 1 year (31536000 seconds)
    assert "31536000" in hsts or int(hsts.split("=")[1].split(";")[0]) >= 31536000
