"""
FastAPI application entry point for Todo backend.

This module initializes the FastAPI application, configures CORS middleware,
registers API routes, and provides basic health check endpoints.
"""

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Import routes
from routes import auth, tasks

# Import middleware
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.request_logger import RequestLoggerMiddleware
from middleware.performance import PerformanceMiddleware
from middleware.rate_limit import limiter, advanced_features_limiter

# Import logging configuration
from logging_config import setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown events.

    This handles database initialization, logging setup, and cleanup.
    """
    # Startup: Configure logging
    setup_logging()

    # Startup: Initialize database connection
    from db import create_db_and_tables
    print("🚀 Starting up Todo backend...")
    create_db_and_tables()

    yield

    # Shutdown: Clean up resources
    print("🛑 Shutting down Todo backend...")


# Initialize FastAPI application
app = FastAPI(
    title="Todo Backend API",
    description="""
    ## FastAPI Backend for Todo Application

    Complete RESTful API for task management with JWT authentication and Neon PostgreSQL.

    ### Features
    - **JWT Authentication**: Secure authentication using Better Auth shared secret
    - **Task CRUD Operations**: Create, read, update, and delete tasks with user isolation
    - **Advanced Filtering**: Filter tasks by status, priority, due date, tags, and search
    - **Export/Import**: Export tasks to CSV/JSON formats and import from files
    - **Bulk Operations**: Perform bulk delete, complete, pending, and priority changes
    - **Statistics**: Get comprehensive task statistics (total, completed, pending, overdue)
    - **User Isolation**: All operations enforce strict user data isolation
    - **Rate Limiting**: API endpoints are rate-limited to prevent abuse
    - **Performance Monitoring**: Request logging and performance tracking

    ### Authentication
    All endpoints (except `/api/auth/signup` and `/api/auth/signin`) require JWT authentication.
    Include the JWT token in the Authorization header:
    ```
    Authorization: Bearer <your_jwt_token>
    ```

    ### Error Handling
    All errors follow a standardized format:
    ```json
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human-readable error message",
            "details": {}
        }
    }
    ```

    ### API Documentation
    - **Swagger UI**: `/docs` - Interactive API documentation
    - **ReDoc**: `/redoc` - Alternative API documentation
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "health",
            "description": "Health check endpoints for monitoring API status"
        },
        {
            "name": "auth",
            "description": "Authentication operations: signup, signin, signout"
        },
        {
            "name": "tasks",
            "description": "Task management operations: CRUD, filtering, search, pagination"
        },
        {
            "name": "advanced",
            "description": "Advanced features: export, import, statistics, bulk operations"
        }
    ],
    contact={
        "name": "API Support",
        "url": "https://github.com/yourusername/todo-app",
        "email": "support@example.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register middleware in correct order (inner to outer execution)
# Order: Security headers -> Performance -> Request logger -> CORS
# Security headers middleware (outermost - applies to all responses)
app.add_middleware(SecurityHeadersMiddleware)

# Performance monitoring middleware
app.add_middleware(PerformanceMiddleware)

# Request logging middleware
app.add_middleware(RequestLoggerMiddleware)

# Configure CORS middleware
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
