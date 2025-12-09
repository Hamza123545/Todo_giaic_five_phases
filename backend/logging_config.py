"""
Logging configuration for the Todo application.

This module configures logging with separate handlers for:
- Application logs (all logs)
- Security logs (security events only)
- Supports both standard and structured JSON logging
"""

import logging
import logging.handlers
import os
from pathlib import Path
from pythonjsonlogger import jsonlogger


def setup_logging():
    """
    Configure logging for the application.

    Sets up:
    - Root logger for application logs
    - Security logger for security events
    - File and console handlers
    - Structured JSON logging (if enabled)
    """
    # Get configuration from environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    enable_json_logging = os.getenv("ENABLE_STRUCTURED_LOGGING", "false").lower() == "true"

    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers to avoid duplicates
    root_logger.handlers.clear()

    # Create formatters
    if enable_json_logging:
        # JSON formatter for structured logging
        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    else:
        # Standard formatter
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Application log file handler (rotating)
    app_log_file = logs_dir / "app.log"
    app_file_handler = logging.handlers.RotatingFileHandler(
        app_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
    )
    app_file_handler.setLevel(log_level)
    app_file_handler.setFormatter(formatter)
    root_logger.addHandler(app_file_handler)

    # Configure security logger
    security_logger = logging.getLogger("security")
    security_logger.setLevel(logging.INFO)
    security_logger.propagate = False  # Don't propagate to root logger

    # Security log file handler (rotating)
    security_log_file = logs_dir / "security.log"
    security_file_handler = logging.handlers.RotatingFileHandler(
        security_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
    )
    security_file_handler.setLevel(logging.INFO)
    security_file_handler.setFormatter(formatter)
    security_logger.addHandler(security_file_handler)

    # Also log security events to console in development
    if os.getenv("ENVIRONMENT", "development") == "development":
        security_console_handler = logging.StreamHandler()
        security_console_handler.setLevel(logging.WARNING)
        security_console_handler.setFormatter(formatter)
        security_logger.addHandler(security_console_handler)

    logging.info("Logging configured successfully")
    logging.info(f"Log level: {log_level}")
    logging.info(f"Structured logging: {'enabled' if enable_json_logging else 'disabled'}")


def get_security_logger() -> logging.Logger:
    """
    Get the security logger instance.

    Returns:
        logging.Logger: Security logger instance
    """
    return logging.getLogger("security")
