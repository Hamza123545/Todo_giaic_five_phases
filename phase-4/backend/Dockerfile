# ============================================================================
# Multi-stage build for Backend Todo API (Production-Optimized)
# ============================================================================

# ============================================================================
# Stage 1: Builder - Install dependencies
# ============================================================================
FROM python:3.13-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building Python packages
# Note: psycopg2-binary doesn't require compilation, but keeping gcc for other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager
RUN pip install --no-cache-dir uv==0.5.0

# Copy dependency files
# Note: uv.lock should be present for reproducible builds
# If it's missing, generate it before building: `uv lock --no-dev`
COPY pyproject.toml ./
COPY uv.lock ./

# Install dependencies using UV with frozen lockfile for reproducibility
RUN uv sync --frozen --no-dev

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM python:3.13-slim

# Metadata labels
LABEL maintainer="Todo API Team"
LABEL version="1.0.0"
LABEL description="Production-ready FastAPI backend for Todo application"

# Create non-root user for security
RUN groupadd -r todoapp && useradd -r -g todoapp -u 1001 todoapp

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY --chown=todoapp:todoapp . .

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    ENVIRONMENT=production

# Create directories for logs and data
RUN mkdir -p /app/logs /app/data && \
    chown -R todoapp:todoapp /app

# Switch to non-root user
USER todoapp

# Expose port
EXPOSE 8000

# Health check with improved reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application with production settings
# Use --workers for multi-process deployment in production
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--log-level", "info", \
     "--access-log", \
     "--no-access-log"]
