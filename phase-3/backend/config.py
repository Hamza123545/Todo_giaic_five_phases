"""
Configuration settings for FastAPI backend.

This module loads environment variables and provides a Settings object
for the application.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """
    Application settings loaded from environment variables.

    Attributes:
        database_url: PostgreSQL connection string (required)
        better_auth_url: Frontend URL for Better Auth JWKS endpoint
        frontend_url: Frontend URL for CORS
        debug: Enable debug mode (default: False)
        environment: Environment name (default: "development")
    """

    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL", "")
        # Better Auth URL - frontend URL where Better Auth is hosted
        # Priority: BETTER_AUTH_URL > NEXT_PUBLIC_APP_URL > default
        self.better_auth_url = (
            os.getenv("BETTER_AUTH_URL") or 
            os.getenv("NEXT_PUBLIC_APP_URL") or 
            "https://todo-giaic-five-phases.vercel.app"  # Production default
        )
        self.frontend_url = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")[0]
        self.debug = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")
        self.environment = os.getenv("ENVIRONMENT", "development")
        
        # Log configuration for debugging
        if self.environment != "production":
            print(f"[CONFIG] Better Auth URL: {self.better_auth_url}")
            print(f"[CONFIG] Frontend URL: {self.frontend_url}")


settings = Settings()

