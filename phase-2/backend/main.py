"""
FastAPI application entry point for Todo backend.

This module initializes the FastAPI application, configures CORS middleware,
registers API routes, and provides basic health check endpoints.
"""

import os
from pathlib import Path
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

# Load environment variables from .env file
# Look for .env file in the backend directory
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    # Fallback: try to load from current directory
    load_dotenv()

# Import routes (must be after load_dotenv to ensure env vars are loaded)
from routes import auth, tasks  # noqa: E402

# Import middleware
from middleware.rate_limiting import limiter, get_rate_limit_exceeded_handler  # noqa: E402
from middleware.logging_middleware import (  # noqa: E402
    RequestLoggingMiddleware,
    ErrorHandlingMiddleware,
)
from middleware.security_headers import SecurityHeadersMiddleware  # noqa: E402
from middleware.timeout_middleware import TimeoutMiddleware  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown events.

    This handles database initialization and cleanup.
    """
    # Startup: Initialize database connection
    print("🚀 Starting up Todo backend...")
    
    # Create database tables if they don't exist
    from db import create_db_and_tables
    try:
        create_db_and_tables()
        print("✅ Database tables initialized")
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
        print("💡 Run 'uv run alembic upgrade head' to apply migrations")
    
    print("✅ Security middleware enabled")
    print("✅ Rate limiting enabled")
    print("✅ Performance monitoring enabled")

    yield

    # Shutdown: Clean up resources
    print("🛑 Shutting down Todo backend...")


# Initialize FastAPI application
app = FastAPI(
    title="Todo API",
    description="FastAPI backend for Todo application with JWT authentication and Neon PostgreSQL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Register rate limiter state
app.state.limiter = limiter

# Add rate limit exceeded handler
app.add_exception_handler(RateLimitExceeded, get_rate_limit_exceeded_handler())


# Custom exception handler for HTTPException to preserve our response format
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Custom handler for HTTPException that preserves our API response format.
    
    If detail is a dict with 'success' and 'error' keys, return it directly.
    Otherwise, wrap it in our standard error format.
    """
    detail = exc.detail
    
    # If detail is already in our format (dict with 'success' key), use it directly
    if isinstance(detail, dict) and "success" in detail:
        return JSONResponse(
            status_code=exc.status_code,
            content=detail,
        )
    
    # Otherwise, wrap it in our standard error format
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": str(detail) if not isinstance(detail, dict) else detail.get("message", "An error occurred"),
            },
        },
    )

# Configure CORS (must be first)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware in correct order (LIFO - last added runs first)
# Order matters: outer middleware wraps inner middleware

# 1. Security headers (outermost - should be on all responses)
app.add_middleware(SecurityHeadersMiddleware)

# 2. Request logging (log all requests/responses)
app.add_middleware(RequestLoggingMiddleware)

# 3. Timeout handling
timeout_seconds = int(os.getenv("REQUEST_TIMEOUT", "30"))
app.add_middleware(TimeoutMiddleware, timeout_seconds=timeout_seconds)

# 4. Error handling (catch all unhandled errors)
app.add_middleware(ErrorHandlingMiddleware)

# Register routers
app.include_router(auth.router)
app.include_router(tasks.router)


@app.get("/", tags=["health"])
async def root() -> JSONResponse:
    """
    Root endpoint with API information.

    Returns:
        JSONResponse: API metadata and status
    """
    return JSONResponse(
        content={
            "success": True,
            "message": "Todo API is running",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
        }
    )


@app.get("/health", tags=["health"])
async def health_check() -> JSONResponse:
    """
    Health check endpoint.

    Returns:
        JSONResponse: API health status
    """
    return JSONResponse(
        content={
            "success": True,
            "status": "healthy",
            "message": "API is operational",
        }
    )


@app.get("/api/health", tags=["health"])
async def api_health_check() -> JSONResponse:
    """
    API health check endpoint under /api prefix.

    Returns:
        JSONResponse: API health status
    """
    return JSONResponse(
        content={
            "success": True,
            "status": "healthy",
            "message": "API is operational",
        }
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
    )
