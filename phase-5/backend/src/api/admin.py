"""
Admin API Endpoints - Phase V

Admin operations requiring elevated permissions:
- T086: Manual DLQ event retry
- Manual event republishing from DLQ to original topic
- DLQ inspection and management

Based on: .claude/skills/fastapi, .claude/skills/microservices-patterns
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from datetime import datetime, timezone

# Phase 5 imports
from phase_5.backend.src.integrations.dapr_client import get_dapr_client

logger = logging.getLogger(__name__)

# Admin API router
router = APIRouter(prefix="/api/admin", tags=["admin"])


# ==================== Request/Response Models ====================

class DLQRetryRequest(BaseModel):
    """Request model for manual DLQ event retry."""
    event_id: str = Field(..., description="Event ID to retry from DLQ")
    original_topic: Optional[str] = Field(
        None,
        description="Original topic to republish to (auto-detected from DLQ metadata if not provided)"
    )


class DLQRetryResponse(BaseModel):
    """Response model for DLQ retry operation."""
    success: bool = Field(..., description="Whether retry was successful")
    event_id: str = Field(..., description="Event ID that was retried")
    original_topic: str = Field(..., description="Topic event was republished to")
    retry_timestamp: str = Field(..., description="ISO 8601 UTC timestamp of retry")
    message: str = Field(..., description="Human-readable result message")


class DLQStatsResponse(BaseModel):
    """Response model for DLQ statistics."""
    total_events: int = Field(..., description="Total events in DLQ")
    events_by_topic: Dict[str, int] = Field(..., description="Event count per DLQ topic")
    oldest_event_timestamp: Optional[str] = Field(None, description="Timestamp of oldest event")
    newest_event_timestamp: Optional[str] = Field(None, description="Timestamp of newest event")


# ==================== Authentication/Authorization ====================

async def verify_admin_role(
    authorization: str = Header(..., alias="Authorization")
) -> str:
    """
    Verify admin role for protected admin endpoints.

    In production, this would:
    1. Verify JWT token from Better Auth
    2. Check user has 'admin' role
    3. Return admin user_id

    For now, implements basic Bearer token check.

    Args:
        authorization: Authorization header with Bearer token

    Returns:
        Admin user ID

    Raises:
        HTTPException: 401 if unauthorized, 403 if forbidden
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header"
        )

    token = authorization[7:]  # Remove "Bearer " prefix

    # TODO: Implement proper JWT verification with Better Auth
    # For now, accept any non-empty token as admin
    # In production:
    # 1. Verify JWT signature
    # 2. Check exp timestamp
    # 3. Check user role == 'admin'

    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Mock admin user ID (replace with actual JWT sub claim)
    admin_user_id = "admin-user-123"

    logger.info(f"Admin access granted: user_id={admin_user_id}")

    return admin_user_id


# ==================== DLQ Retry Endpoint ====================

@router.post("/dlq/retry", response_model=DLQRetryResponse)
async def retry_dlq_event(
    request: DLQRetryRequest,
    admin_user_id: str = Depends(verify_admin_role)
):
    """
    Manually retry a failed event from Dead Letter Queue.

    Workflow:
    1. Fetch event from DLQ topic using event_id
    2. Extract original topic from DLQ metadata
    3. Republish event to original topic
    4. Log retry operation for audit trail

    Access Control:
    - Requires admin role (Bearer token)

    Args:
        request: DLQ retry request with event_id
        admin_user_id: Admin user ID from JWT (injected by dependency)

    Returns:
        DLQRetryResponse with retry result

    Raises:
        HTTPException: 404 if event not found, 500 if retry fails

    Example:
        POST /api/admin/dlq/retry
        Authorization: Bearer <admin-token>
        {
            "event_id": "event-123"
        }

        Response:
        {
            "success": true,
            "event_id": "event-123",
            "original_topic": "task-events",
            "retry_timestamp": "2025-12-30T10:00:00Z",
            "message": "Event successfully retried"
        }
    """
    try:
        logger.info(
            f"Admin DLQ retry requested: event_id={request.event_id}, "
            f"admin_user={admin_user_id}"
        )

        # Get Dapr client
        dapr = get_dapr_client()

        # Fetch event from DLQ (using Dapr State Store as DLQ storage)
        # In production, DLQ events are stored in Kafka DLQ topics
        # For simplicity, we simulate fetching from state store
        dlq_state_key = f"dlq-event-{request.event_id}"
        dlq_event = await dapr.get_state(dlq_state_key)

        if not dlq_event:
            raise HTTPException(
                status_code=404,
                detail=f"Event not found in DLQ: {request.event_id}"
            )

        # Extract original topic from DLQ metadata
        dlq_metadata = dlq_event.get("dlq_metadata", {})
        original_topic = request.original_topic or _infer_original_topic(
            dlq_event.get("event_type")
        )

        if not original_topic:
            raise HTTPException(
                status_code=400,
                detail="Cannot determine original topic - please provide original_topic parameter"
            )

        # Republish event to original topic (remove DLQ metadata)
        event_data = {k: v for k, v in dlq_event.items() if k != "dlq_metadata"}

        await dapr.publish_event(
            topic=original_topic,
            event_data=event_data
        )

        # Mark event as retried in DLQ (optional - for audit trail)
        dlq_event["dlq_metadata"]["retried_at"] = datetime.utcnow().isoformat() + "Z"
        dlq_event["dlq_metadata"]["retried_by"] = admin_user_id
        await dapr.save_state(dlq_state_key, dlq_event)

        # Log successful retry
        retry_timestamp = datetime.utcnow().isoformat() + "Z"

        logger.info(
            f"DLQ event retried successfully: event_id={request.event_id}, "
            f"topic={original_topic}, admin_user={admin_user_id}"
        )

        return DLQRetryResponse(
            success=True,
            event_id=request.event_id,
            original_topic=original_topic,
            retry_timestamp=retry_timestamp,
            message=f"Event successfully retried to topic '{original_topic}'"
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(
            f"DLQ retry failed: event_id={request.event_id}, error={e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retry DLQ event: {str(e)}"
        )


def _infer_original_topic(event_type: str) -> Optional[str]:
    """
    Infer original Kafka topic from event type.

    Mapping:
    - task.completed -> task-events
    - reminder.due -> reminders
    - task.updated -> task-updates

    Args:
        event_type: Event type string

    Returns:
        Original topic name or None if cannot infer
    """
    event_to_topic_map = {
        "task.completed": "task-events",
        "task.created": "task-events",
        "task.updated": "task-updates",
        "task.deleted": "task-events",
        "reminder.scheduled": "reminders",
        "reminder.due": "reminders",
        "reminder.cancelled": "reminders"
    }

    return event_to_topic_map.get(event_type)


# ==================== DLQ Statistics Endpoint ====================

@router.get("/dlq/stats", response_model=DLQStatsResponse)
async def get_dlq_stats(
    admin_user_id: str = Depends(verify_admin_role)
):
    """
    Get statistics about events in Dead Letter Queue.

    Returns:
    - Total number of events in DLQ
    - Event count per DLQ topic
    - Oldest and newest event timestamps

    Access Control:
    - Requires admin role

    Args:
        admin_user_id: Admin user ID from JWT

    Returns:
        DLQStatsResponse with DLQ statistics

    Example:
        GET /api/admin/dlq/stats
        Authorization: Bearer <admin-token>

        Response:
        {
            "total_events": 42,
            "events_by_topic": {
                "dlq-task-events": 15,
                "dlq-reminders": 20,
                "dlq-task-updates": 7
            },
            "oldest_event_timestamp": "2025-12-25T10:00:00Z",
            "newest_event_timestamp": "2025-12-30T10:00:00Z"
        }
    """
    try:
        logger.info(f"Admin DLQ stats requested: admin_user={admin_user_id}")

        # TODO: Implement actual DLQ statistics
        # In production, query Kafka DLQ topics for event counts
        # For now, return placeholder data

        return DLQStatsResponse(
            total_events=0,
            events_by_topic={
                "dlq-task-events": 0,
                "dlq-reminders": 0,
                "dlq-task-updates": 0
            },
            oldest_event_timestamp=None,
            newest_event_timestamp=None
        )

    except Exception as e:
        logger.error(f"DLQ stats failed: error={e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve DLQ statistics: {str(e)}"
        )


# ==================== Health Check ====================

@router.get("/health")
async def admin_health_check():
    """
    Health check endpoint for admin API.

    Returns:
        Health status
    """
    return {
        "status": "healthy",
        "service": "admin-api",
        "version": "1.0.0"
    }


# ==================== Notes ====================

"""
Production Enhancements for Admin API:

1. **Authentication & Authorization**:
   - Implement proper JWT verification with Better Auth
   - Use role-based access control (RBAC)
   - Check user has 'admin' role from JWT claims
   - Implement API key authentication for service-to-service calls

2. **DLQ Storage**:
   - Use Kafka DLQ topics instead of Dapr State Store
   - Implement Kafka consumer to query DLQ topics
   - Support pagination for large DLQ event lists

3. **Audit Logging**:
   - Log all admin operations to audit trail
   - Include admin user_id, timestamp, action, result
   - Send audit logs to centralized logging system

4. **Rate Limiting**:
   - Implement rate limiting for admin endpoints
   - Prevent abuse of retry operations

5. **Monitoring**:
   - Add metrics for DLQ retry success/failure rates
   - Alert on high DLQ event counts
   - Dashboard for DLQ health monitoring

6. **Bulk Operations**:
   - Support bulk retry of multiple events
   - Retry all events from specific topic
   - Retry events within time range

7. **DLQ Event Inspection**:
   - Endpoint to view individual DLQ event details
   - Support filtering by event_type, time range, error type
   - Pagination for large DLQ lists
"""
