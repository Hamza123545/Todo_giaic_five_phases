# Contributing to Todo Backend

Thank you for your interest in contributing to the Todo Backend! This guide will help you get started with development.

## Table of Contents

- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Git Workflow](#git-workflow)
- [Architecture Overview](#architecture-overview)

---

## Development Setup

### Prerequisites

- **Python**: 3.13 or higher
- **UV**: Package manager (will be installed in setup)
- **PostgreSQL**: 16 or higher (or Neon account)
- **Git**: Latest version
- **Docker**: (Optional) For containerized development

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/todo-app.git
   cd todo-app/phase-2/backend
   ```

2. **Install UV** (if not already installed):
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

   # Or via pip
   pip install uv
   ```

3. **Install dependencies**:
   ```bash
   # Install all dependencies including dev dependencies
   uv sync --extra dev
   ```

4. **Set up environment variables**:
   ```bash
   # Copy example file
   cp .env.example .env

   # Edit .env with your configuration
   # Minimum required:
   # - DATABASE_URL
   # - BETTER_AUTH_SECRET
   ```

5. **Set up database**:
   ```bash
   # Using local PostgreSQL
   createdb todo_dev

   # Or use Neon PostgreSQL (recommended)
   # Sign up at neon.tech and get connection string
   ```

6. **Run database migrations**:
   ```bash
   uv run alembic upgrade head
   ```

7. **Verify setup**:
   ```bash
   # Run tests
   uv run pytest

   # Start development server
   uv run uvicorn main:app --reload

   # Visit http://localhost:8000/docs to see API documentation
   ```

### IDE Setup

#### VS Code

Recommended extensions:
- Python (Microsoft)
- Pylance (Microsoft)
- Black Formatter
- Ruff
- Better Comments

Settings (`.vscode/settings.json`):
```json
{
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "python.analysis.typeCheckingMode": "basic"
}
```

#### PyCharm

1. Set Python interpreter to UV virtual environment
2. Enable type checking in settings
3. Configure Black as formatter
4. Install Ruff plugin

---

## Development Workflow

### Starting Development

```bash
# 1. Sync dependencies
uv sync --extra dev

# 2. Run database migrations
uv run alembic upgrade head

# 3. Start development server with auto-reload
uv run uvicorn main:app --reload --port 8000

# Development server will be available at:
# - API: http://localhost:8000
# - Swagger UI: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
```

### Hot Reloading

The development server automatically reloads when you make changes to:
- Python files (`.py`)
- Environment variables (`.env`)

No need to restart the server manually!

### Running Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov --cov-report=html

# Run specific test file
uv run pytest tests/integration/test_auth.py

# Run specific test
uv run pytest tests/integration/test_auth.py::test_signup_success

# Run tests in parallel (faster)
uv run pytest -n auto

# Run with verbose output
uv run pytest -v

# Run only failed tests
uv run pytest --lf
```

### Database Management

```bash
# Create new migration
uv run alembic revision --autogenerate -m "Add new field to Task"

# Apply migrations
uv run alembic upgrade head

# Rollback migration
uv run alembic downgrade -1

# Check current migration
uv run alembic current

# View migration history
uv run alembic history
```

### Code Formatting and Linting

```bash
# Format code with Black
uv run black .

# Lint with Ruff
uv run ruff check .

# Fix linting issues automatically
uv run ruff check --fix .

# Type checking with mypy
uv run mypy . --ignore-missing-imports

# Run all checks
uv run black . && uv run ruff check --fix . && uv run mypy .
```

---

## Code Standards

### Python Style Guide

We follow **PEP 8** with some modifications:

- **Line length**: 100 characters (enforced by Black)
- **Quotes**: Double quotes for strings
- **Imports**: Organized with `isort`
- **Type hints**: Required for all public functions

### Code Quality Rules

1. **Type Hints**: All functions must have type hints
   ```python
   # Good
   def create_task(db: Session, user_id: UUID, data: CreateTaskRequest) -> Task:
       ...

   # Bad
   def create_task(db, user_id, data):
       ...
   ```

2. **Docstrings**: All public functions must have docstrings
   ```python
   def get_user_by_email(db: Session, email: str) -> Optional[User]:
       """
       Retrieve a user by email address.

       Args:
           db: Database session
           email: User's email address

       Returns:
           User object if found, None otherwise
       """
       ...
   ```

3. **Error Handling**: Use specific exceptions
   ```python
   # Good
   raise HTTPException(
       status_code=status.HTTP_404_NOT_FOUND,
       detail="Task not found"
   )

   # Bad
   raise Exception("Task not found")
   ```

4. **User Isolation**: Always filter by user_id
   ```python
   # Good
   task = db.query(Task).filter(
       Task.id == task_id,
       Task.user_id == user_id
   ).first()

   # Bad
   task = db.query(Task).filter(Task.id == task_id).first()
   ```

5. **Constants**: Use uppercase for constants
   ```python
   MAX_TITLE_LENGTH = 200
   DEFAULT_PRIORITY = "medium"
   ```

### Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── models.py               # SQLModel database models
├── db.py                   # Database connection
├── routes/                 # API route handlers
│   ├── __init__.py
│   ├── auth.py            # Authentication endpoints
│   └── tasks.py           # Task endpoints
├── middleware/            # Custom middleware
│   ├── __init__.py
│   ├── jwt.py            # JWT verification
│   ├── rate_limiting.py  # Rate limiting
│   └── logging_middleware.py
├── schemas/              # Pydantic models
│   ├── __init__.py
│   ├── requests.py       # Request schemas
│   └── responses.py      # Response schemas
├── services/             # Business logic
│   ├── __init__.py
│   ├── auth_service.py
│   ├── task_service.py
│   └── export_import_service.py
├── utils/                # Utility functions
│   ├── __init__.py
│   ├── auth.py          # JWT utilities
│   └── password.py      # Password hashing
└── tests/               # Test files
    ├── conftest.py      # Pytest configuration
    ├── unit/            # Unit tests
    ├── integration/     # Integration tests
    └── api/             # API tests
```

### Naming Conventions

- **Files**: `snake_case.py`
- **Classes**: `PascalCase`
- **Functions**: `snake_case`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private functions**: `_leading_underscore`

---

## Testing Guidelines

### Test Organization

```
tests/
├── conftest.py           # Shared fixtures
├── unit/                 # Fast, isolated tests
│   ├── test_auth_service.py
│   └── test_task_service.py
├── integration/          # Tests with database
│   ├── test_auth.py
│   └── test_tasks.py
└── api/                  # Full API endpoint tests
    └── test_endpoints.py
```

### Writing Tests

1. **Test file naming**: `test_<module>.py`
2. **Test function naming**: `test_<function>_<scenario>`
3. **Use fixtures**: For database setup, test data, etc.
4. **Test coverage**: Aim for >80% coverage

Example test:

```python
def test_create_task_success(db_session: Session, test_user: User):
    """Test successful task creation with valid data."""
    # Arrange
    task_data = CreateTaskRequest(
        title="Test Task",
        description="Test Description",
        priority="high"
    )

    # Act
    task = TaskService.create_task(db_session, test_user.id, task_data)

    # Assert
    assert task.title == "Test Task"
    assert task.user_id == test_user.id
    assert task.priority == "high"
    assert not task.completed
```

### Test Fixtures

Common fixtures in `conftest.py`:

```python
@pytest.fixture
def db_session():
    """Provide a test database session."""
    ...

@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    ...

@pytest.fixture
def test_task(db_session, test_user):
    """Create a test task."""
    ...

@pytest.fixture
def auth_headers(test_user):
    """Provide authentication headers."""
    ...
```

### Test Coverage

```bash
# Generate coverage report
uv run pytest --cov --cov-report=html

# Open coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

---

## Pull Request Process

### Before Creating PR

1. **Update from main**:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run all checks**:
   ```bash
   # Format code
   uv run black .

   # Lint
   uv run ruff check --fix .

   # Type check
   uv run mypy .

   # Run tests
   uv run pytest --cov
   ```

3. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add task export functionality"
   ```

### Commit Message Format

We follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(tasks): add bulk operations endpoint

Implemented bulk operations for tasks including delete, complete,
pending, and priority changes with proper user isolation.

Closes #123

---

fix(auth): correct JWT token expiration time

Changed expiration from 1 day to 7 days as per specification.

---

docs(readme): update setup instructions

Added steps for UV installation and environment configuration.
```

### Creating Pull Request

1. **Push to remote**:
   ```bash
   git push origin your-branch
   ```

2. **Create PR on GitHub**:
   - Clear title summarizing the change
   - Description explaining what and why
   - Link to related issues
   - Screenshots if UI changes

3. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex logic
   - [ ] Documentation updated
   - [ ] No new warnings
   ```

### Code Review Process

1. **Automated Checks**: Must pass CI/CD pipeline
2. **Peer Review**: At least one approval required
3. **Address Feedback**: Make requested changes
4. **Final Approval**: Maintainer approves and merges

---

## Git Workflow

### Branch Naming

- **Feature**: `feature/add-task-export`
- **Bug Fix**: `fix/jwt-token-expiration`
- **Hotfix**: `hotfix/security-vulnerability`
- **Docs**: `docs/update-readme`

### Workflow Steps

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Make changes and commit
git add .
git commit -m "feat: implement your feature"

# 3. Push to remote
git push origin feature/your-feature-name

# 4. Create pull request on GitHub

# 5. After approval, squash and merge
```

### Keeping Branch Updated

```bash
# Rebase on main
git fetch origin
git rebase origin/main

# Or merge main into your branch
git merge origin/main

# Resolve conflicts if any
git add .
git rebase --continue
```

---

## Architecture Overview

### Layered Architecture

```
Presentation Layer (Routes)
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Models + Database)
```

### Request Flow

```
1. Client Request
   ↓
2. Middleware (JWT, Rate Limiting, Logging)
   ↓
3. Route Handler (routes/tasks.py)
   ↓
4. Service Layer (services/task_service.py)
   ↓
5. Database (via SQLModel)
   ↓
6. Response
```

### Adding New Endpoint

1. **Define Pydantic schemas** (schemas/requests.py, schemas/responses.py)
2. **Create service function** (services/)
3. **Add route handler** (routes/)
4. **Write tests** (tests/integration/, tests/unit/)
5. **Update documentation** (docstrings)

Example:

```python
# 1. Schema (schemas/requests.py)
class ArchiveTaskRequest(BaseModel):
    archived: bool

# 2. Service (services/task_service.py)
@staticmethod
def archive_task(db: Session, user_id: UUID, task_id: int) -> Task:
    # Implementation
    ...

# 3. Route (routes/tasks.py)
@router.patch("/{user_id}/tasks/{task_id}/archive")
async def archive_task(...):
    # Implementation
    ...

# 4. Test (tests/integration/test_tasks.py)
def test_archive_task_success():
    # Implementation
    ...
```

---

## Getting Help

- **Documentation**: Check `/docs` endpoint for API docs
- **Issues**: Search existing GitHub issues
- **Discussions**: Ask questions in GitHub Discussions
- **Team**: Reach out on Slack or email

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
