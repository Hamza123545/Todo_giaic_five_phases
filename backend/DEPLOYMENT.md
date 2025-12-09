# Backend Deployment Guide

This guide provides comprehensive instructions for deploying the Todo Backend API to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Local Development](#local-development)
5. [Docker Deployment](#docker-deployment)
6. [Production Configuration](#production-configuration)
7. [Health Checks](#health-checks)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

## Prerequisites

### System Requirements

- **Python**: 3.13 or higher
- **UV**: Package manager for Python dependencies
- **PostgreSQL**: Neon Serverless PostgreSQL (or compatible PostgreSQL 14+)
- **Docker** (optional): For containerized deployment

### Required Tools

```bash
# Install UV (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Docker (optional, for containerized deployment)
# Follow instructions at: https://docs.docker.com/get-docker/
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/database
# Example Neon: postgresql://user:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb

# Authentication
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long
JWT_EXPIRATION_DAYS=7

# Environment
ENVIRONMENT=production  # development | staging | production

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=INFO  # DEBUG | INFO | WARNING | ERROR

# Optional: Server Configuration
PORT=8000
HOST=0.0.0.0
```

### Environment Variable Descriptions

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | None |
| `BETTER_AUTH_SECRET` | Yes | Shared secret for JWT signing/verification (min 32 chars) | None |
| `JWT_EXPIRATION_DAYS` | No | JWT token expiration in days | 7 |
| `ENVIRONMENT` | No | Deployment environment | development |
| `CORS_ORIGINS` | No | Comma-separated list of allowed origins | http://localhost:3000 |
| `LOG_LEVEL` | No | Logging verbosity level | INFO |
| `PORT` | No | Server port | 8000 |
| `HOST` | No | Server host | 0.0.0.0 |

## Database Setup

### 1. Neon Serverless PostgreSQL Setup

1. **Create Neon Project**: Visit [Neon Console](https://console.neon.tech/)
2. **Get Connection String**: Copy the connection string from project settings
3. **Update `.env`**: Add the connection string to `DATABASE_URL`

### 2. Run Database Migrations

```bash
cd backend

# Install dependencies
uv sync

# Run migrations
uv run alembic upgrade head
```

### 3. Verify Database Connection

```bash
# Test database connection
uv run python -c "from db import engine; print('Database connected:', engine.url)"
```

## Local Development

### Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (including dev dependencies)
uv sync --extra dev

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
uv run alembic upgrade head
```

### Running Development Server

```bash
# Run with auto-reload
uv run uvicorn main:app --reload --port 8000

# Or with custom host/port
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# With specific log level
uv run uvicorn main:app --reload --log-level debug
```

### Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Docker Deployment

### 1. Build Docker Image

```bash
# From backend directory
docker build -t todo-backend:latest .

# With custom tag
docker build -t todo-backend:v1.0.0 .
```

### 2. Run Docker Container

```bash
# Run with environment variables
docker run -d \
  --name todo-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="your-secret" \
  -e ENVIRONMENT="production" \
  todo-backend:latest

# Run with .env file
docker run -d \
  --name todo-backend \
  -p 8000:8000 \
  --env-file .env \
  todo-backend:latest
```

### 3. Using Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: todo-backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      ENVIRONMENT: production
      CORS_ORIGINS: ${CORS_ORIGINS}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d backend
```

## Production Configuration

### 1. Production Dockerfile (Optimization)

The Dockerfile uses multi-stage builds for production optimization:

```dockerfile
# Stage 1: Builder
FROM python:3.13-slim as builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv sync --no-dev

# Stage 2: Runtime
FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY . .
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Production Uvicorn Configuration

```bash
# Production server with Gunicorn + Uvicorn workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

### 3. Nginx Reverse Proxy Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

## Health Checks

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:8000/health

# Response:
# {
#   "success": true,
#   "status": "healthy",
#   "message": "API is operational"
# }

# API health check (under /api prefix)
curl http://localhost:8000/api/health
```

### Kubernetes Health Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Monitoring & Logging

### 1. Application Logging

Logs are configured in `logging_config.py` and output in JSON format for easy parsing.

```bash
# View logs (Docker)
docker logs -f todo-backend

# View logs (systemd)
journalctl -u todo-backend -f
```

### 2. Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARNING**: Warning messages (potential issues)
- **ERROR**: Error messages (failures)

### 3. Performance Monitoring

The API includes performance middleware that logs:
- Request duration
- Response status
- Request path and method

### 4. Security Event Logging

Security events are logged:
- Failed authentication attempts
- Unauthorized access attempts
- Rate limit violations

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: `OperationalError: could not connect to server`

**Solution**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test database connection
uv run python -c "from db import engine; engine.connect()"

# Check Neon PostgreSQL status
# Visit Neon Console: https://console.neon.tech/
```

#### 2. JWT Token Errors

**Problem**: `401 Unauthorized` or `Invalid token`

**Solution**:
```bash
# Verify BETTER_AUTH_SECRET matches frontend
echo $BETTER_AUTH_SECRET

# Ensure secret is at least 32 characters
# Generate new secret:
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3. CORS Errors

**Problem**: `CORS policy` errors in browser

**Solution**:
```bash
# Update CORS_ORIGINS in .env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Restart backend
docker restart todo-backend
```

#### 4. Migration Errors

**Problem**: `alembic.util.exc.CommandError`

**Solution**:
```bash
# Check current migration version
uv run alembic current

# Rollback one version
uv run alembic downgrade -1

# Re-apply migrations
uv run alembic upgrade head
```

### Debug Mode

Enable debug mode for detailed error messages:

```bash
# Set LOG_LEVEL to DEBUG
LOG_LEVEL=DEBUG uv run uvicorn main:app --reload
```

## Security Considerations

### 1. Environment Variables

- **Never commit `.env` files** to version control
- Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets regularly (at least every 90 days)

### 2. Database Security

- Use SSL/TLS for database connections
- Implement least-privilege access (read-only for read operations)
- Enable connection pooling (handled by SQLModel)
- Regular backups (Neon handles this automatically)

### 3. API Security

- Enable rate limiting (configured in middleware)
  - General API: 100 requests/minute per IP (configurable via RATE_LIMIT_PER_MINUTE)
  - Advanced Features: 10 requests/minute per user (configurable via ADVANCED_FEATURES_RATE_LIMIT)
    - Export endpoint: /api/{user_id}/tasks/export
    - Import endpoint: /api/{user_id}/tasks/import
    - Statistics endpoint: /api/{user_id}/tasks/statistics
    - Bulk operations endpoint: /api/{user_id}/tasks/bulk
- Use HTTPS in production (handled by reverse proxy)
- Implement proper CORS configuration
- Validate all user inputs (handled by Pydantic models)
- Log security events for monitoring

### 4. Production Checklist

- [ ] Environment variables are properly configured
- [ ] BETTER_AUTH_SECRET is strong and matches frontend
- [ ] DATABASE_URL uses SSL/TLS connection
- [ ] CORS_ORIGINS is restricted to production domains
- [ ] LOG_LEVEL is set to INFO or WARNING (not DEBUG)
- [ ] HTTPS is configured (via reverse proxy)
- [ ] Rate limiting is enabled
- [ ] Health checks are configured
- [ ] Monitoring/alerting is set up
- [ ] Backup strategy is in place

### 5. Security Headers

Security headers are automatically added via middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

## CI/CD Integration

The backend includes GitHub Actions workflows for CI/CD:

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI/CD
on:
  push:
    branches: [api.phase_2]
  pull_request:
    branches: [api.phase_2]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - run: |
          pip install uv
          cd backend
          uv sync --extra dev
          uv run pytest --cov
```

## Support

For issues and questions:
- **Documentation**: See [README.md](README.md)
- **Issues**: https://github.com/yourusername/todo-app/issues
- **Email**: support@example.com

## License

MIT License - See [LICENSE](../LICENSE) file for details.
