"""
Health check endpoints for Kubernetes liveness and readiness probes
"""
from fastapi import APIRouter, status, HTTPException
from sqlalchemy import text
from datetime import datetime
from db import engine

router = APIRouter(tags=["health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def liveness_check():
    """
    Liveness probe endpoint for Kubernetes
    Returns 200 OK if the application process is alive
    """
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "todo-backend"
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check():
    """
    Readiness probe endpoint for Kubernetes
    Returns 200 OK when the application is ready to serve traffic
    Checks database connectivity
    """
    try:
        # Check database connection
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "todo-backend",
            "database": "connected"
        }
    except Exception as e:
        # Database connection failed - service not ready
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "not ready",
                "timestamp": datetime.utcnow().isoformat(),
                "service": "todo-backend",
                "database": "disconnected",
                "error": str(e)
            }
        )
