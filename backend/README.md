# Todo Backend API

FastAPI backend for Todo application with JWT authentication, Neon Serverless PostgreSQL, and comprehensive task management features.

## Features

- **JWT Authentication**: Secure authentication using Better Auth shared secret
- **RESTful API**: Complete CRUD operations for tasks with user isolation
- **Advanced Filtering**: Filter, sort, search, and paginate tasks
- **Export/Import**: CSV and JSON format support
- **Bulk Operations**: Perform operations on multiple tasks
- **Statistics**: Comprehensive task analytics
- **Rate Limiting**: API abuse prevention
- **Performance Monitoring**: Request logging and tracking
- **OpenAPI Documentation**: Interactive API docs at `/docs`

## Quick Start

### Prerequisites

- Python 3.13+
- UV package manager
- Neon PostgreSQL account

### Installation

\`\`\`bash
# Install dependencies
uv sync --extra dev

# Create .env file
cp .env.example .env

# Run migrations
uv run alembic upgrade head

# Start server
uv run uvicorn main:app --reload
\`\`\`

### Access API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

## Testing

\`\`\`bash
# Run all tests
uv run pytest

# With coverage
uv run pytest --cov=. --cov-report=html

# Target: 80%+ coverage
\`\`\`

## Documentation

- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment guide
- See [CLAUDE.md](CLAUDE.md) for development guidelines
- API docs at `/docs` endpoint

## License

MIT License
