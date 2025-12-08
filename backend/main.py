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

# Import routes
from routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown events.

    This handles database initialization and cleanup.
    """
    # Startup: Initialize database connection
    # TODO: Add database initialization in Phase 2
    print("🚀 Starting up Todo backend...")

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

# Configure CORS
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
