# Backend Development Guidelines

This document provides guidelines for developing the FastAPI backend for the Todo application.

## Stack

- **Framework**: FastAPI
- **ORM**: SQLModel (combines SQLAlchemy and Pydantic)
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT with Better Auth shared secret
- **Migrations**: Alembic
- **Testing**: pytest with httpx
- **Package Manager**: UV
- **Code Formatting**: Black and Ruff

## Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── models.py               # SQLModel database models (User, Task)
├── db.py                   # Database connection and session management
├── routes/                 # API route handlers
│   ├── __init__.py
│   ├── auth.py            # Authentication endpoints (signup, signin, signout)
│   └── tasks.py           # Task management endpoints (CRUD operations)
├── middleware/            # Custom middleware
│   ├── __init__.py
│   ├── jwt.py            # JWT verification middleware
│   ├── cors.py           # CORS configuration
│   └── error_handler.py  # Global error handling
├── schemas/              # Pydantic models for request/response validation
│   ├── __init__.py
│   ├── auth.py          # Authentication schemas
│   └── task.py          # Task schemas
├── services/            # Business logic layer
│   ├── __init__.py
│   ├── auth_service.py  # Authentication business logic
│   └── task_service.py  # Task business logic
├── tests/               # Test files
│   ├── __init__.py
│   ├── conftest.py      # Pytest configuration and fixtures
│   ├── test_main.py     # Tests for main endpoints
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── api/             # API endpoint tests
├── alembic/             # Database migrations
│   ├── versions/        # Migration scripts
│   └── env.py          # Alembic configuration
├── pyproject.toml       # UV project configuration
├── alembic.ini          # Alembic configuration
├── Dockerfile           # Docker configuration
└── .env.example         # Environment variable template
```

## API Conventions

### Endpoint Structure

All API endpoints MUST be under the `/api/` prefix:

```python
# Authentication endpoints
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout

# Task endpoints
GET    /api/{user_id}/tasks
POST   /api/{user_id}/tasks
GET    /api/{user_id}/tasks/{id}
PUT    /api/{user_id}/tasks/{id}
DELETE /api/{user_id}/tasks/{id}
PATCH  /api/{user_id}/tasks/{id}/complete
```

### Response Format

All API responses MUST return JSON with consistent structure:

```python
# Success response
{
    "success": true,
    "data": { ... }
}

# Error response
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable error message",
        "details": { ... }  # Optional
    }
}
```

### HTTP Status Codes

Use appropriate HTTP status codes:

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server errors

## Database Operations

### Using SQLModel

All database operations MUST use SQLModel with proper session management:

```python
from sqlmodel import Session, select
from db import get_session
from models import Task

@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: UUID,
    session: Session = Depends(get_session)
):
    statement = select(Task).where(Task.user_id == user_id)
    tasks = session.exec(statement).all()
    return {"success": True, "data": tasks}
```

### User Isolation

ALL database queries MUST filter by authenticated user's ID:

```python
# Always filter by user_id
statement = select(Task).where(Task.user_id == user_id)
```

## Authentication & Authorization

### JWT Verification

Backend MUST verify JWT tokens on every API request:

```python
from middleware.jwt import verify_jwt_token

@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: UUID,
    current_user: User = Depends(verify_jwt_token)
):
    # Verify user_id from JWT matches URL path
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    # ... rest of endpoint logic
```

### Shared Secret

Backend MUST use the same `BETTER_AUTH_SECRET` as frontend for JWT verification:

```python
import os
SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
```

## Error Handling

Use HTTPException with appropriate status codes:

```python
from fastapi import HTTPException

# Not found
raise HTTPException(status_code=404, detail="Task not found")

# Unauthorized
raise HTTPException(status_code=401, detail="Invalid token")

# Forbidden
raise HTTPException(status_code=403, detail="Access denied")

# Validation error
raise HTTPException(status_code=400, detail="Invalid input")
```

## Environment Variables

Load configuration from environment variables:

```python
import os

DATABASE_URL = os.getenv("DATABASE_URL")
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

## Running the Application

### Development

```bash
# Install dependencies
cd backend
uv sync --extra dev

# Run development server
uv run uvicorn main:app --reload --port 8000

# Or with environment variables
export DATABASE_URL="postgresql://..."
export BETTER_AUTH_SECRET="your-secret"
uv run uvicorn main:app --reload --port 8000
```

### Testing

```bash
# Run all tests
cd backend
uv run pytest

# Run with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/test_main.py

# Run specific test
uv run pytest tests/test_main.py::test_root_endpoint
```

### Database Migrations

```bash
# Create a new migration
cd backend
uv run alembic revision --autogenerate -m "Description"

# Apply migrations
uv run alembic upgrade head

# Rollback migration
uv run alembic downgrade -1
```

### Code Formatting

```bash
# Format code with Black
cd backend
uv run black .

# Lint with Ruff
uv run ruff check .

# Fix with Ruff
uv run ruff check --fix .
```

## Docker

### Build and Run

```bash
# Build backend image
docker build -t todo-backend ./backend

# Run backend container
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="your-secret" \
  todo-backend

# Or use docker-compose
docker-compose up backend
```

## Best Practices

1. **Type Hints**: All functions MUST include type hints
2. **Docstrings**: All public functions MUST include docstrings
3. **User Isolation**: All queries MUST filter by user_id
4. **JWT Verification**: All protected endpoints MUST verify JWT
5. **Error Handling**: Use HTTPException with appropriate status codes
6. **Validation**: Use Pydantic models for request/response validation
7. **Testing**: Write tests for all endpoints and business logic
8. **Migrations**: Use Alembic for all database schema changes

## Security

1. **Never** hardcode secrets or credentials
2. **Always** verify JWT tokens on protected endpoints
3. **Always** filter queries by authenticated user's ID
4. **Always** use parameterized queries (SQLModel does this automatically)
5. **Always** validate user input with Pydantic models
6. **Always** use HTTPS in production

## OpenAPI Documentation

FastAPI automatically generates OpenAPI/Swagger documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

Access these endpoints after starting the server to explore the API interactively.

## Phase 3 Extension: AI-Powered Chat with Priority Support

### Priority Support (Phase A)

The backend now supports task priority management with automatic NLP detection:

**Priority Levels**: `low`, `medium`, `high`

**Automatic Detection**: Priority is automatically detected from task titles/descriptions:
- High: "urgent", "critical", "important", "asap", "high priority"
- Low: "low", "minor", "optional", "when you have time"
- Medium: default

**New MCP Tools**:
- `set_priority(user_id, task_id, priority)` - Update task priority
- `list_tasks_by_priority(user_id, priority, status)` - Filter tasks by priority

**Database Schema**:
- Tasks table has `priority` column (indexed for fast filtering)
- Default: "medium"

### Chat History Persistence (Phase B-C)

Conversations and messages are now persisted to the database:

**Conversation Management Endpoints**:
```
GET    /api/{user_id}/conversations              # List user's conversations
GET    /api/{user_id}/conversations/{id}/messages # Get conversation messages
POST   /api/{user_id}/chat                       # Chat with SSE streaming
```

**Database Models**:
- `Conversation`: Stores chat session metadata (id, user_id, title, is_active, created_at, updated_at)
- `Message`: Stores individual messages (id, conversation_id, user_id, role, content, created_at, expires_at, tool_calls)

**Features**:
- Stateless request cycle: Each chat request loads history from database
- User isolation: All queries filter by authenticated user_id
- Message persistence: User and assistant messages automatically saved
- Tool call logging: MCP tool invocations stored in message metadata

**Stream Response Format**:
```json
{"type": "message", "content": "...", "done": false}
{"type": "tool_call", "tool": "add_task", "args": {...}}
{"type": "done", "conversation_id": 1}
```

### Message Retention Policy (Phase D)

**2-Day Retention**: Messages automatically expire after 2 days

**Cleanup Task**:
- Endpoint: `POST /api/admin/cleanup/messages`
- Returns: `{success, deleted_count, timestamp}`
- Should be called daily by external scheduler (cron, GitHub Actions, etc.)

**Database Implementation**:
- `expires_at` field automatically set to `now() + 2 days`
- Indexed for efficient cleanup queries
- Queries filter `created_at <= expires_at` to only show active messages

**Sample Cron Configuration**:
```bash
# Run cleanup daily at 2 AM UTC
0 2 * * * curl -X POST https://api.example.com/api/admin/cleanup/messages
```

### Chat History Queries

**User Isolation**:
All conversation queries enforce user_id verification:
```python
statement = select(Conversation).where(
    Conversation.user_id == user_id  # User isolation
)
```

**Message Ordering**:
Messages ordered by `created_at` (oldest first) for chronological display:
```python
statement = select(Message).where(
    Message.conversation_id == conversation_id,
    Message.created_at <= Message.expires_at  # Only non-expired
).order_by(Message.created_at.asc())
```

### Testing

**Chat History Tests** (`tests/test_chat_history.py`):
- Conversation management and pagination
- Message persistence and retrieval
- User isolation verification
- 2-day retention policy
- Cleanup endpoint functionality
- Error handling and edge cases
- API response format validation

**Run Tests**:
```bash
# Run all tests
uv run pytest

# Run chat history tests only
uv run pytest tests/test_chat_history.py -v

# Run specific test
uv run pytest tests/test_chat_history.py::TestConversationManagement::test_get_user_conversations_empty -v
```

### Background Tasks

**Message Cleanup** (`tasks/message_cleanup.py`):
```python
from tasks.message_cleanup import cleanup_expired_messages

result = cleanup_expired_messages()
# Returns: {success, deleted_count, timestamp}
```

### MCP Server Integration

The TodoAgent now includes priority detection:
- Automatically detects priority keywords from task descriptions
- Falls back to "medium" if no keywords match
- Can be overridden with explicit priority parameter

**Example Conversation**:
```
User: "Add an urgent task to fix the bug"
Agent: Detects "urgent" → creates task with priority="high"

User: "Create a low priority cleanup task"
Agent: Detects "low" → creates task with priority="low"
```

### Future Enhancements

- Conversation archiving (mark inactive)
- Message editing and deletion
- Conversation search/filtering
- Message search across all conversations
- Batch operations on multiple messages
- Message export/import
- Conversation sharing
- Real-time WebSocket support (replace SSE)
