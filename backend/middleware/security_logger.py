"""
Security event logging utilities.

This module provides functions for logging security-related events
to a separate security log file for monitoring and auditing.
"""

import logging
from datetime import datetime
from typing import Optional
from fastapi import Request

# Get security logger
security_logger = logging.getLogger("security")


class SecurityEventType:
    """Security event type constants."""

    FAILED_AUTH = "failed_authentication"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    JWT_VERIFICATION_FAILED = "jwt_verification_failed"
    INVALID_CREDENTIALS = "invalid_credentials"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    USER_ISOLATION_VIOLATION = "user_isolation_violation"


def log_security_event(
    event_type: str,
    details: str,
    request: Optional[Request] = None,
    user_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    severity: str = "warning",
):
    """
    Log a security event to the security log.

    Args:
        event_type: Type of security event (use SecurityEventType constants)
        details: Detailed description of the event
        request: FastAPI request object (optional)
        user_id: User ID involved in the event (optional)
        ip_address: IP address of the client (optional)
        severity: Log severity level (info, warning, error)

    Example:
        ```python
        log_security_event(
            SecurityEventType.FAILED_AUTH,
            "Invalid password attempt",
            request=request,
            user_id="user-123",
        )
        ```
    """
    # Extract additional info from request if provided
    if request:
        if not ip_address:
            ip_address = request.client.host if request.client else "unknown"
        path = request.url.path
        method = request.method
        user_agent = request.headers.get("user-agent", "unknown")
    else:
        path = None
        method = None
        user_agent = None

    # Build log extra data
    extra_data = {
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details,
        "user_id": user_id,
        "ip_address": ip_address,
        "path": path,
        "method": method,
        "user_agent": user_agent,
    }

    # Log with appropriate severity
    log_method = getattr(security_logger, severity.lower(), security_logger.warning)
    log_method(
        f"Security Event: {event_type} - {details}",
        extra=extra_data,
    )


def log_failed_authentication(
    email: str,
    ip_address: str,
    reason: str = "Invalid credentials",
):
    """
    Log a failed authentication attempt.

    Args:
        email: Email address used in the attempt
        ip_address: IP address of the client
        reason: Reason for failure
    """
    log_security_event(
        SecurityEventType.FAILED_AUTH,
        f"Failed login attempt for email: {email} - {reason}",
        ip_address=ip_address,
        severity="warning",
    )


def log_unauthorized_access(
    request: Request,
    user_id: Optional[str] = None,
    resource: str = "unknown",
):
    """
    Log an unauthorized access attempt.

    Args:
        request: FastAPI request object
        user_id: User ID attempting access
        resource: Resource being accessed
    """
    log_security_event(
        SecurityEventType.UNAUTHORIZED_ACCESS,
        f"Unauthorized access attempt to resource: {resource}",
        request=request,
        user_id=user_id,
        severity="warning",
    )


def log_jwt_verification_failed(
    request: Request,
    error: str,
):
    """
    Log a JWT verification failure.

    Args:
        request: FastAPI request object
        error: Error message from verification
    """
    log_security_event(
        SecurityEventType.JWT_VERIFICATION_FAILED,
        f"JWT verification failed: {error}",
        request=request,
        severity="warning",
    )


def log_user_isolation_violation(
    request: Request,
    authenticated_user_id: str,
    requested_user_id: str,
):
    """
    Log a user isolation violation attempt.

    Args:
        request: FastAPI request object
        authenticated_user_id: ID of authenticated user
        requested_user_id: ID of user in URL path
    """
    log_security_event(
        SecurityEventType.USER_ISOLATION_VIOLATION,
        f"User isolation violation: User {authenticated_user_id} attempted to access resources of user {requested_user_id}",
        request=request,
        user_id=authenticated_user_id,
        severity="error",
    )


def log_suspicious_activity(
    request: Request,
    activity: str,
    user_id: Optional[str] = None,
):
    """
    Log suspicious activity.

    Args:
        request: FastAPI request object
        activity: Description of suspicious activity
        user_id: User ID involved (if known)
    """
    log_security_event(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        activity,
        request=request,
        user_id=user_id,
        severity="error",
    )
