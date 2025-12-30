"""
Recurring Task Service - Phase V

Microservice for handling recurring task logic.
Consumes task.completed events from Kafka and creates next occurrences.

Based on:
- .claude/skills/dapr-integration
- .claude/skills/microservices-patterns
- .claude/skills/rrule-recurring-tasks
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

from phase_5.backend.src.integrations.dapr_client import get_dapr_client
from phase_5.backend.src.integrations.rrule_parser import get_rrule_parser
from phase_5.backend.src.events.schemas import TaskCompletedEvent, TaskCompletedEventPayload

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Recurring Task Service",
    description="Microservice for handling recurring task creation",
    version="1.0.0"
)


class RecurringTaskService:
    """
    Recurring Task Service - handles task.completed events and creates next occurrences.

    Responsibilities:
    1. Consume task.completed events from Kafka (via Dapr Pub/Sub)
    2. Check if task is recurring (has recurring_pattern)
    3. Calculate next occurrence using RRULE parser
    4. Create next occurrence via Backend service (Dapr Service Invocation)
    5. Implement idempotency to prevent duplicate next occurrences

    Event Flow:
    task.completed event → Recurring Task Service → calculate next → invoke Backend → create task
    """

    def __init__(self):
        self.dapr = get_dapr_client()
        self.parser = get_rrule_parser()
        logger.info("Recurring Task Service initialized")

    async def check_idempotency(self, event_id: str) -> bool:
        """
        Check if event has already been processed.

        Args:
            event_id: Unique event identifier

        Returns:
            True if already processed, False otherwise
        """
        # Check Dapr State Store for processed event
        state_key = f"event-processed-{event_id}"
        processed = await self.dapr.get_state(state_key)

        if processed:
            logger.info(f"Event {event_id} already processed (idempotency check)")
            return True

        return False

    async def mark_event_processed(self, event_id: str) -> None:
        """
        Mark event as processed in Dapr State Store.

        Args:
            event_id: Unique event identifier
        """
        state_key = f"event-processed-{event_id}"
        await self.dapr.save_state(
            state_key,
            {
                "processed": True,
                "processed_at": datetime.utcnow().isoformat() + "Z"
            }
        )
        logger.debug(f"Event {event_id} marked as processed")

    async def handle_task_completed(self, event_data: dict) -> None:
        """
        Handle task.completed event and create next occurrence if recurring.

        Args:
            event_data: Event data from Kafka (CloudEvents format)

        Process:
        1. Validate event has required fields (event_id, user_id, task_id)
        2. Check idempotency (skip if already processed)
        3. Extract recurring_pattern from payload
        4. Calculate next occurrence using RRULE parser
        5. Create next occurrence via Backend service
        6. Mark event as processed
        """
        # Extract event fields
        event_id = event_data.get("event_id")
        event_type = event_data.get("event_type")
        user_id = event_data.get("user_id")
        task_id = event_data.get("task_id")
        payload = event_data.get("payload", {})

        # Validate required fields
        if not event_id or not user_id or not task_id:
            logger.error(f"Invalid event: missing required fields (event_id, user_id, task_id)")
            raise ValueError("Missing required fields in event")

        logger.info(f"Processing task.completed event: event_id={event_id}, task_id={task_id}, user_id={user_id}")

        # Idempotency check
        if await self.check_idempotency(event_id):
            logger.info(f"Skipping event {event_id} - already processed")
            return

        # Check if recurring task
        recurring_pattern = payload.get("recurring_pattern")
        if not recurring_pattern:
            logger.debug(f"Task {task_id} is not recurring - skipping next occurrence creation")
            await self.mark_event_processed(event_id)
            return

        logger.info(f"Task {task_id} is recurring with pattern: {recurring_pattern}")

        # Extract task details
        task_title = payload.get("task_title", "Recurring task")
        completed_at = payload.get("completed_at")
        recurring_end_date_str = payload.get("recurring_end_date")

        # Parse completed_at timestamp
        try:
            if completed_at:
                # Parse ISO 8601 UTC timestamp
                completed_at_dt = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                # Convert to naive UTC
                completed_at_dt = completed_at_dt.replace(tzinfo=None)
            else:
                # Default to current time
                completed_at_dt = datetime.utcnow()
        except Exception as e:
            logger.error(f"Failed to parse completed_at timestamp: {e}")
            completed_at_dt = datetime.utcnow()

        # Parse recurring_end_date if present
        recurring_end_date_dt = None
        if recurring_end_date_str:
            try:
                recurring_end_date_dt = datetime.fromisoformat(recurring_end_date_str.replace('Z', '+00:00'))
                recurring_end_date_dt = recurring_end_date_dt.replace(tzinfo=None)
            except Exception as e:
                logger.error(f"Failed to parse recurring_end_date: {e}")

        # Calculate next occurrence
        try:
            next_occurrence = self.parser.calculate_next(
                pattern=recurring_pattern,
                dtstart=completed_at_dt,
                end_date=recurring_end_date_dt
            )
        except Exception as e:
            logger.error(f"Failed to calculate next occurrence: {e}", exc_info=True)
            # Mark as processed to prevent infinite retries
            await self.mark_event_processed(event_id)
            raise

        if not next_occurrence:
            logger.info(f"No next occurrence for task {task_id} (recurring_end_date reached or no more occurrences)")
            await self.mark_event_processed(event_id)
            return

        logger.info(f"Next occurrence calculated: {next_occurrence.isoformat()} for task {task_id}")

        # Create next occurrence via Backend service (Dapr Service Invocation)
        try:
            result = await self.dapr.invoke_service(
                app_id="backend",
                method="api/tasks",
                data={
                    "title": task_title,
                    "user_id": user_id,  # User isolation
                    "recurring_pattern": recurring_pattern,
                    "recurring_end_date": recurring_end_date_str,
                    "next_occurrence": next_occurrence.isoformat() + "Z",
                    "parent_task_id": task_id,  # Link to parent task
                    "completed": False  # Next occurrence starts uncompleted
                },
                http_verb="POST"
            )
            logger.info(f"Next occurrence created successfully: {result}")
        except Exception as e:
            logger.error(f"Failed to create next occurrence via Backend service: {e}", exc_info=True)
            # Don't mark as processed - allow retry
            raise

        # Mark event as processed (idempotency)
        await self.mark_event_processed(event_id)
        logger.info(f"Event {event_id} processed successfully - next occurrence created for task {task_id}")


# Global service instance
_service: Optional[RecurringTaskService] = None


def get_service() -> RecurringTaskService:
    """Get singleton RecurringTaskService instance."""
    global _service
    if _service is None:
        _service = RecurringTaskService()
    return _service


# ==================== FastAPI Endpoints ====================

@app.get("/health")
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": "recurring-task-service",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness probe - check Dapr sidecar is accessible."""
    try:
        # Check Dapr sidecar health
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("http://localhost:3500/v1.0/healthz")
            if response.status_code == 200:
                return {"status": "ready"}
            else:
                return JSONResponse(
                    {"status": "not ready", "error": "Dapr sidecar not healthy"},
                    status_code=503
                )
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            {"status": "not ready", "error": str(e)},
            status_code=503
        )


@app.get("/health/live")
async def liveness_check():
    """Liveness probe - service is running."""
    return {"status": "alive"}


@app.post("/dapr/subscribe")
async def subscribe():
    """
    Dapr subscription endpoint - returns topics to subscribe to.

    Dapr Pub/Sub automatically calls this endpoint to discover subscriptions.

    Returns:
        List of subscriptions with topic, route, and metadata
    """
    logger.info("Dapr subscription endpoint called")
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/api/events/task-events",
            "metadata": {
                "rawPayload": "false"  # Dapr wraps in CloudEvents format
            }
        }
    ]


@app.post("/api/events/task-events")
async def handle_task_event(request: Request):
    """
    Handle task events from Kafka via Dapr Pub/Sub.

    Dapr sends events in CloudEvents format:
    {
        "specversion": "1.0",
        "type": "task.completed",
        "source": "todo-service",
        "id": "event-id-123",
        "data": {
            "event_id": "...",
            "event_type": "task.completed",
            "task_id": 123,
            "user_id": "user-456",
            "payload": {...}
        }
    }
    """
    try:
        # Parse CloudEvents format
        cloud_event = await request.json()
        event_data = cloud_event.get("data", {})

        # Extract event type
        event_type = event_data.get("event_type")

        # User isolation check
        user_id = event_data.get("user_id")
        if not user_id:
            logger.error("Missing user_id in event")
            return JSONResponse(
                {"status": "error", "message": "Missing user_id"},
                status_code=400
            )

        # Process event based on type
        service = get_service()

        if event_type == "task.completed":
            await service.handle_task_completed(event_data)
        else:
            # Ignore other event types
            logger.debug(f"Ignoring event type: {event_type}")

        return JSONResponse({"status": "success"})

    except ValueError as e:
        logger.error(f"Invalid event data: {e}", exc_info=True)
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=400
        )
    except Exception as e:
        logger.error(f"Error processing event: {e}", exc_info=True)
        return JSONResponse(
            {"status": "error", "message": "Internal server error"},
            status_code=500
        )


# ==================== Startup Event ====================

@app.on_event("startup")
async def startup_event():
    """Initialize service on startup."""
    logger.info("Recurring Task Service starting up...")

    # Initialize service (singleton)
    get_service()

    logger.info("Recurring Task Service ready to process events")


if __name__ == "__main__":
    import uvicorn

    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    # Run service
    uvicorn.run(app, host="0.0.0.0", port=8001)
