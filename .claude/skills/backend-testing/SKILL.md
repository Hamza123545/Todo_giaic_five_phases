# Backend Testing Skill

**Purpose**: Guidance for writing tests using pytest for unit, integration, and API tests.

## Overview

Tests MUST cover unit tests (service layer), integration tests (database operations), and API tests (endpoints). Use pytest fixtures for database sessions, test data, and authentication tokens.

## Key Patterns

### 1. Test Structure

**File Location**: `/backend/tests/unit/`, `/backend/tests/integration/`, `/backend/tests/api/`

**Pattern**: Organize tests by type

```python
# tests/unit/test_task_service.py
import pytest
from backend.services.task_service import TaskService

def test_create_task():
    """Test task creation"""
    pass

# tests/integration/test_task_db.py
import pytest
from sqlmodel import Session

def test_task_database_operations(db: Session):
    """Test database operations"""
    pass

# tests/api/test_task_routes.py
from fastapi.testclient import TestClient

def test_get_tasks(client: TestClient, auth_token: str):
    """Test GET /api/{user_id}/tasks endpoint"""
    pass
```

**Pattern Rules**:
- Unit tests: Test service layer in isolation
- Integration tests: Test database operations
- API tests: Test HTTP endpoints
- Use descriptive test names
- Group related tests in classes

### 2. Pytest Fixtures

**Pattern**: Create reusable fixtures

```python
# conftest.py
import pytest
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool
from fastapi.testclient import TestClient
from backend.main import app
from backend.db import get_db
from backend.models import User, Task
from backend.middleware.jwt import generate_jwt_token

# In-memory database for testing
@pytest.fixture(scope="function")
def db():
    """Create test database session"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session
    
    SQLModel.metadata.drop_all(engine)

# Test client
@pytest.fixture(scope="function")
def client(db: Session):
    """Create test client with database override"""
    def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

# Test user
@pytest.fixture(scope="function")
def test_user(db: Session):
    """Create test user"""
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        name="Test User"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Auth token
@pytest.fixture(scope="function")
def auth_token(test_user: User):
    """Generate JWT token for test user"""
    return generate_jwt_token(test_user.id, test_user.email)
```

**Pattern Rules**:
- Use in-memory SQLite for testing
- Create fixtures for database, client, test data
- Override dependencies in test client
- Clean up after each test
- Use function scope for isolation

### 3. Unit Tests (Service Layer)

**Pattern**: Test service methods in isolation

```python
# tests/unit/test_task_service.py
import pytest
from backend.services.task_service import TaskService
from backend.schemas.requests import TaskCreateRequest

def test_create_task(db, test_user):
    """Test task creation"""
    service = TaskService()
    task_data = TaskCreateRequest(
        title="Test Task",
        description="Test Description",
        priority="high"
    )
    
    task = service.create_task(db, test_user.id, task_data)
    
    assert task.id is not None
    assert task.title == "Test Task"
    assert task.user_id == test_user.id
    assert task.priority == "high"

def test_create_task_validation_error(db, test_user):
    """Test task creation with invalid data"""
    service = TaskService()
    task_data = TaskCreateRequest(
        title="x" * 201,  # Exceeds max length
        priority="invalid"  # Invalid enum
    )
    
    with pytest.raises(ValueError):
        service.create_task(db, test_user.id, task_data)

def test_get_tasks_with_filters(db, test_user):
    """Test task retrieval with filters"""
    service = TaskService()
    
    # Create test tasks
    task1 = service.create_task(db, test_user.id, TaskCreateRequest(title="Task 1", priority="high"))
    task2 = service.create_task(db, test_user.id, TaskCreateRequest(title="Task 2", priority="low"))
    
    # Filter by priority
    result = service.get_tasks(db, test_user.id, filters={"priority": "high"})
    tasks, total = result
    
    assert len(tasks) == 1
    assert tasks[0].id == task1.id
    assert total == 1
```

**Pattern Rules**:
- Test service methods directly
- Use test fixtures for dependencies
- Test both success and error cases
- Assert expected behavior
- Test validation logic

### 4. Integration Tests (Database)

**Pattern**: Test database operations

```python
# tests/integration/test_task_db.py
import pytest
from sqlmodel import select
from backend.models import Task, User

def test_task_creation(db, test_user):
    """Test task creation in database"""
    task = Task(
        user_id=test_user.id,
        title="Test Task",
        priority="medium"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    
    assert task.id is not None
    assert task.user_id == test_user.id

def test_task_user_isolation(db, test_user):
    """Test user isolation in queries"""
    # Create user 2
    user2 = User(email="user2@example.com", password_hash="hash", name="User 2")
    db.add(user2)
    db.commit()
    db.refresh(user2)
    
    # Create tasks for both users
    task1 = Task(user_id=test_user.id, title="User 1 Task")
    task2 = Task(user_id=user2.id, title="User 2 Task")
    db.add_all([task1, task2])
    db.commit()
    
    # Query tasks for user 1
    tasks = db.exec(
        select(Task).where(Task.user_id == test_user.id)
    ).all()
    
    assert len(tasks) == 1
    assert tasks[0].user_id == test_user.id
    assert tasks[0].title == "User 1 Task"
```

**Pattern Rules**:
- Test database operations directly
- Test user isolation
- Test queries and filters
- Test transactions
- Verify data persistence

### 5. API Tests (Endpoints)

**Pattern**: Test HTTP endpoints

```python
# tests/api/test_task_routes.py
import pytest
from fastapi import status

def test_get_tasks(client, auth_token, test_user):
    """Test GET /api/{user_id}/tasks endpoint"""
    response = client.get(
        f"/api/{test_user.id}/tasks",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] == True
    assert "data" in data

def test_get_tasks_unauthorized(client, test_user):
    """Test GET /api/{user_id}/tasks without token"""
    response = client.get(f"/api/{test_user.id}/tasks")
    
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_get_tasks_user_mismatch(client, auth_token, test_user):
    """Test GET /api/{user_id}/tasks with wrong user_id"""
    wrong_user_id = "wrong-user-id"
    response = client.get(
        f"/api/{wrong_user_id}/tasks",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "User ID mismatch" in response.json()["detail"]

def test_create_task(client, auth_token, test_user):
    """Test POST /api/{user_id}/tasks endpoint"""
    task_data = {
        "title": "New Task",
        "description": "Task Description",
        "priority": "high"
    }
    
    response = client.post(
        f"/api/{test_user.id}/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] == True
    assert data["data"]["title"] == "New Task"
    assert data["data"]["user_id"] == test_user.id

def test_create_task_validation_error(client, auth_token, test_user):
    """Test POST /api/{user_id}/tasks with invalid data"""
    task_data = {
        "title": "x" * 201,  # Exceeds max length
        "priority": "invalid"  # Invalid enum
    }
    
    response = client.post(
        f"/api/{test_user.id}/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
```

**Pattern Rules**:
- Use TestClient for API tests
- Include Authorization header with JWT token
- Test success cases (200, 201)
- Test error cases (400, 401, 403, 404)
- Test user isolation (user_id mismatch)
- Test validation errors
- Assert response structure

### 6. Authentication Tests

**Pattern**: Test authentication endpoints

```python
# tests/api/test_auth_routes.py
import pytest
from fastapi import status

def test_signup(client, db):
    """Test POST /api/auth/signup"""
    user_data = {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "name": "New User"
    }
    
    response = client.post("/api/auth/signup", json=user_data)
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["success"] == True
    assert "token" in data["data"]
    assert data["data"]["user"]["email"] == "newuser@example.com"

def test_signup_duplicate_email(client, test_user):
    """Test signup with duplicate email"""
    user_data = {
        "email": test_user.email,  # Already exists
        "password": "Password123!",
        "name": "Another User"
    }
    
    response = client.post("/api/auth/signup", json=user_data)
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_signin(client, test_user):
    """Test POST /api/auth/signin"""
    credentials = {
        "email": test_user.email,
        "password": "test_password"  # Use actual password
    }
    
    response = client.post("/api/auth/signin", json=credentials)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] == True
    assert "token" in data["data"]

def test_signin_invalid_credentials(client, test_user):
    """Test signin with invalid credentials"""
    credentials = {
        "email": test_user.email,
        "password": "wrong_password"
    }
    
    response = client.post("/api/auth/signin", json=credentials)
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

**Pattern Rules**:
- Test successful signup/signin
- Test duplicate email handling
- Test invalid credentials
- Verify JWT token in response
- Test password validation

### 7. Query Parameters Tests

**Pattern**: Test filtering, sorting, search, pagination

```python
def test_get_tasks_with_filters(client, auth_token, test_user, db):
    """Test GET /api/{user_id}/tasks with query parameters"""
    # Create test tasks
    task1 = Task(user_id=test_user.id, title="High Priority", priority="high", completed=False)
    task2 = Task(user_id=test_user.id, title="Low Priority", priority="low", completed=True)
    db.add_all([task1, task2])
    db.commit()
    
    # Filter by status
    response = client.get(
        f"/api/{test_user.id}/tasks?status=pending",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["completed"] == False
    
    # Filter by priority
    response = client.get(
        f"/api/{test_user.id}/tasks?priority=high",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["data"][0]["priority"] == "high"
    
    # Search
    response = client.get(
        f"/api/{test_user.id}/tasks?search=High",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert "High" in data["data"][0]["title"]
    
    # Pagination
    response = client.get(
        f"/api/{test_user.id}/tasks?page=1&limit=1",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 1
    assert data["meta"]["page"] == 1
    assert data["meta"]["limit"] == 1
```

**Pattern Rules**:
- Test all query parameters
- Test combinations of filters
- Test pagination metadata
- Verify filter results
- Test invalid parameter values

### 8. Export/Import Tests

**Pattern**: Test export and import functionality

```python
def test_export_tasks_csv(client, auth_token, test_user, db):
    """Test GET /api/{user_id}/tasks/export?format=csv"""
    # Create test task
    task = Task(user_id=test_user.id, title="Export Test")
    db.add(task)
    db.commit()
    
    response = client.get(
        f"/api/{test_user.id}/tasks/export?format=csv",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv"
    assert "attachment" in response.headers["content-disposition"]
    assert b"Export Test" in response.content

def test_import_tasks_csv(client, auth_token, test_user):
    """Test POST /api/{user_id}/tasks/import with CSV"""
    csv_content = "title,description,priority\nNew Task,Description,high"
    
    response = client.post(
        f"/api/{test_user.id}/tasks/import",
        files={"file": ("tasks.csv", csv_content, "text/csv")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["data"]["imported"] == 1
    assert data["data"]["errors"] == 0
```

**Pattern Rules**:
- Test CSV and JSON export
- Test CSV and JSON import
- Verify file content
- Test import error handling
- Verify import statistics

## Steps for Adding Tests

1. **Create Test File**
   - Choose appropriate directory (unit/integration/api)
   - Import necessary modules
   - Use descriptive test names

2. **Set Up Fixtures**
   - Use conftest.py for shared fixtures
   - Create test data fixtures
   - Override dependencies

3. **Write Test Cases**
   - Test success cases
   - Test error cases
   - Test edge cases
   - Assert expected behavior

4. **Run Tests**
   ```bash
   pytest tests/
   pytest tests/unit/
   pytest tests/api/test_task_routes.py -v
   ```

## Common Patterns Summary

- ✅ Use pytest for all tests
- ✅ Organize tests by type (unit/integration/api)
- ✅ Use fixtures for reusable setup
- ✅ Test success and error cases
- ✅ Test user isolation
- ✅ Test validation logic
- ✅ Use in-memory database for testing
- ✅ Override dependencies in test client
- ✅ Assert response structure and status codes
- ✅ Clean up after each test

