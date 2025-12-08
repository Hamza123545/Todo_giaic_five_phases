# Quick Start: Backend Todo Application

**Date**: 2025-12-08 | **Feature**: 003-backend-todo-app | **Input**: spec.md, plan.md, data-model.md

## Overview

This guide provides quick setup instructions for the FastAPI backend application with Neon PostgreSQL, JWT authentication, and RESTful API endpoints. Follow these steps to get the backend running locally for development.

## Prerequisites

### System Requirements
- Python 3.13+ installed
- pip package manager
- Git for version control
- Docker (optional, for containerized deployment)
- Neon PostgreSQL account (for database)

### Environment Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

## Installation

### 1. Set up Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

Or if no requirements.txt exists yet, install the core dependencies:
```bash
pip install fastapi uvicorn sqlmodel alembic python-jose[cryptography] passlib[bcrypt] pytest httpx python-multipart python-dotenv
```

### 3. Configure Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database_name>

# Better Auth Shared Secret (same as frontend)
BETTER_AUTH_SECRET=your_shared_secret_key_here

# Environment (development/staging/production)
ENVIRONMENT=development

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Logging Level
LOG_LEVEL=INFO

# JWT Configuration
JWT_SECRET_KEY=your_jwt_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=86400  # 24 hours in seconds
```

**Important**: Use a strong, random secret key for BETTER_AUTH_SECRET that matches the frontend configuration.

## Database Setup

### 1. Initialize Alembic (if not already initialized)
```bash
alembic init alembic
```

### 2. Create Initial Migration
```bash
alembic revision --autogenerate -m "Initial migration for User and Task models"
```

### 3. Apply Migrations
```bash
alembic upgrade head
```

## Running the Application

### Development Mode
```bash
# Run with auto-reload for development
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- Main API: `http://localhost:8000`
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

### Production Mode
```bash
# Run without auto-reload for production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Authenticate user
- `POST /api/auth/signout` - Sign out user

### Task Management Endpoints
- `GET /api/{user_id}/tasks` - List all tasks with query parameters
- `POST /api/{user_id}/tasks` - Create new task
- `GET /api/{user_id}/tasks/{id}` - Get task details
- `PUT /api/{user_id}/tasks/{id}` - Update task
- `DELETE /api/{user_id}/tasks/{id}` - Delete task
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle completion status

### Advanced Endpoints
- `GET /api/{user_id}/tasks/export?format=csv|json` - Export tasks
- `POST /api/{user_id}/tasks/import` - Import tasks
- `GET /api/{user_id}/tasks/statistics` - Get task statistics
- `POST /api/{user_id}/tasks/bulk` - Bulk operations

## Testing

### Run Unit Tests
```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=.

# Run specific test file
pytest tests/unit/test_auth_service.py

# Run API tests
pytest tests/api/
```

### Sample API Requests

#### Create User (Signup)
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

#### Authenticate User (Signin)
```bash
curl -X POST "http://localhost:8000/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

#### Create Task (with JWT token)
```bash
curl -X POST "http://localhost:8000/api/{user_id}/tasks" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sample Task",
    "description": "This is a sample task",
    "priority": "medium",
    "due_date": "2023-12-31T23:59:59",
    "tags": ["work", "important"]
  }'
```

## Configuration

### Project Structure
```
backend/
├── main.py              # FastAPI app entry point
├── models.py            # SQLModel database models
├── db.py                # Database connection, session management
├── routes/              # API route handlers
│   ├── auth.py
│   └── tasks.py
├── middleware/          # Custom middleware
│   ├── jwt.py
│   ├── cors.py
│   └── error_handler.py
├── schemas/             # Pydantic models
│   ├── requests.py
│   └── responses.py
├── services/            # Business logic layer
│   ├── auth_service.py
│   ├── task_service.py
│   └── validation_service.py
├── alembic/             # Database migrations
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── api/
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables
└── Dockerfile           # Container configuration
```

### Key Configuration Files
- `main.py`: FastAPI application configuration
- `models.py`: Database models using SQLModel
- `db.py`: Database connection and session management
- `alembic.ini`: Database migration configuration
- `.env`: Environment-specific configuration

## Docker Deployment (Optional)

### Build Docker Image
```bash
docker build -t backend-todo-app .
```

### Run with Docker
```bash
docker run -p 8000:8000 --env-file .env backend-todo-app
```

### Run with Docker Compose
```bash
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL is correctly configured
   - Check if Neon PostgreSQL is accessible
   - Ensure required extensions are installed

2. **JWT Authentication Issues**
   - Verify BETTER_AUTH_SECRET matches frontend configuration
   - Check that JWT tokens are properly formatted
   - Ensure clock skew is properly handled

3. **Migration Issues**
   - Run `alembic stamp head` if migration state is corrupted
   - Check that models match database schema

4. **Dependency Issues**
   - Create fresh virtual environment
   - Update dependencies with `pip install -U <package>`

### Development Tips

- Use `--reload` flag during development for auto-reload
- Check the API documentation at `/docs` endpoint
- Use environment variables for configuration
- Enable DEBUG log level for detailed logging during development

## Next Steps

1. Implement the API endpoints as per the specification
2. Add comprehensive test coverage
3. Set up CI/CD pipeline
4. Deploy to staging environment
5. Perform security testing
6. Prepare for production deployment

## Support

For support, refer to:
- API documentation at `/docs` endpoint
- Project specification in `specs/003-backend-todo-app/spec.md`
- Architecture plan in `specs/003-backend-todo-app/plan.md`
- Contact the development team for assistance