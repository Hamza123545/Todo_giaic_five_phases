# Backend Todo API

FastAPI backend for the Todo web application with JWT authentication, PostgreSQL database, and comprehensive task management features.

## ✅ Status: Phase 2 Complete

This backend is fully functional and includes all required features for the full-stack todo application.

## Features

- ✅ RESTful API with FastAPI
- ✅ JWT Authentication with Better Auth integration
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Complete CRUD operations for tasks
- ✅ Advanced filtering and sorting
- ✅ Task export/import (CSV, JSON, PDF)
- ✅ PDF generation with ReportLab
- ✅ Rate limiting and security headers
- ✅ Comprehensive error handling
- ✅ Request logging and monitoring
- ✅ Database migrations with Alembic
- ✅ Unit and integration tests
- ✅ CI/CD with GitHub Actions

## Tech Stack

- **Framework**: FastAPI 0.115+
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Authentication**: Better Auth with JWT
- **Migrations**: Alembic
- **Testing**: Pytest
- **Language**: Python 3.13+

## Prerequisites

- Python 3.13 or later
- UV package manager
- PostgreSQL database (Neon Serverless recommended)

## Quick Start

### 1. Install Dependencies

```bash
uv sync
```

### 2. Environment Setup

Create a `.env` file (`.env.example` is provided as a template):

```bash
# Database
DATABASE_URL=postgresql://user:password@host/dbname

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Application
ENVIRONMENT=development
API_PREFIX=/api
```

⚠️ **Note**: `.env` files are gitignored. Never commit sensitive credentials.

### 3. Run Database Migrations

```bash
uv run alembic upgrade head
```

### 4. Start the Development Server

```bash
uv run uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Tasks

- `GET /api/{user_id}/tasks` - Get user's tasks (with filtering, sorting, pagination)
- `POST /api/{user_id}/tasks` - Create a new task
- `GET /api/{user_id}/tasks/{task_id}` - Get a specific task
- `PUT /api/{user_id}/tasks/{task_id}` - Update a task
- `DELETE /api/{user_id}/tasks/{task_id}` - Delete a task
- `POST /api/{user_id}/tasks/reorder` - Reorder tasks (drag & drop)
- `GET /api/{user_id}/tasks/export?format={csv|json|pdf}` - Export tasks
- `POST /api/{user_id}/tasks/import` - Import tasks from CSV/JSON

## Project Structure

```
backend/
├── alembic/              # Database migrations
├── middleware/           # Custom middleware
│   ├── jwt.py           # JWT authentication
│   ├── logging_middleware.py
│   ├── rate_limiting.py
│   └── security_headers.py
├── models.py            # SQLModel database models
├── routes/              # API route handlers
│   ├── auth.py         # Authentication routes
│   └── tasks.py        # Task management routes
├── schemas/             # Pydantic schemas
│   ├── requests.py     # Request models
│   ├── responses.py    # Response models
│   └── query_params.py # Query parameter models
├── services/            # Business logic
│   ├── auth_service.py
│   ├── task_service.py
│   └── export_import_service.py
├── utils/               # Utility functions
│   ├── auth.py         # JWT utilities
│   ├── password.py     # Password hashing
│   └── ...
├── tests/               # Test suite
│   ├── conftest.py     # Pytest fixtures
│   ├── test_auth.py
│   └── test_tasks.py
├── main.py              # FastAPI application entry point
├── db.py                # Database connection
└── config.py            # Configuration management
```

## Development

### Running Tests

```bash
uv run pytest
```

With coverage:

```bash
uv run pytest --cov=. --cov-report=term
```

### Database Migrations

Create a new migration:

```bash
uv run alembic revision --autogenerate -m "description"
```

Apply migrations:

```bash
uv run alembic upgrade head
```

### Code Quality

Linting with Ruff:

```bash
uv run ruff check .
```

Formatting with Black:

```bash
uv run black .
```

## Environment Variables

All environment variables should be set in `.env` file (gitignored):

- `DATABASE_URL` - PostgreSQL connection string (required)
- `BETTER_AUTH_SECRET` - Secret key for JWT tokens (required)
- `BETTER_AUTH_URL` - Better Auth frontend URL (required)
- `ENVIRONMENT` - Environment mode (development/production/test)
- `API_PREFIX` - API route prefix (default: /api)

## Security

- JWT token-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Security headers (CORS, CSP, etc.)
- Input validation and sanitization
- SQL injection protection (via ORM)

## Deployment

The backend is Docker-ready. See `Dockerfile` for containerization details.

For production deployment:
1. Set environment variables
2. Run database migrations
3. Start with production ASGI server (e.g., Gunicorn + Uvicorn workers)

## License

Part of the Todo Console Application project.

