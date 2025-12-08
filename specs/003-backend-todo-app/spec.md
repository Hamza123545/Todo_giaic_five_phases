# Specification: Backend Todo Application

**Input**: User description requesting FastAPI backend with Neon Serverless PostgreSQL, JWT authentication, RESTful API, user isolation, query parameters, export/import, error handling, OpenAPI docs, Phase II requirements

**Prerequisites**:
- Constitution file: `.specify/memory/constitution.md` (Phase II requirements, Task Data Structure, Database Indexes, JWT Auth)
- Frontend spec: `specs/002-frontend-todo-app/spec.md` (API contract alignment)
- Frontend plan: `specs/002-frontend-todo-app/plan.md` (API contracts details)
- Frontend API contracts: `specs/002-frontend-todo-app/contracts/api-contracts.md` (exact API contract)
- Better Auth patterns for JWT implementation

## User Scenarios & Testing

### User Story 1: User Authentication (P1)
**As a** new user, **I want** to create an account and sign in with JWT authentication **So that** I can securely access my tasks with stateless authentication.

**Priority**: P1 - Critical for basic functionality
**Why P1**: Without authentication, no user can access the system, making all other features useless.

**Independent Test**: Can create account, sign in, receive JWT token, and access protected endpoints successfully.

**Acceptance Scenarios**:
- Given I'm a new user, when I provide valid email, password, and name, then I should receive a JWT token and be able to access protected endpoints
- Given I'm an existing user, when I provide correct email and password, then I should receive a JWT token for authenticated access
- Given I have an invalid JWT token, when I try to access protected endpoints, then I should receive 401 Unauthorized response

### User Story 2: Basic Task Management (P1)
**As a** authenticated user, **I want** to create, read, update, and delete tasks with user isolation **So that** I can manage my personal tasks without interference from other users.

**Priority**: P1 - Critical for core functionality
**Why P1**: Task management is the primary purpose of the application; without this, the app has no value.

**Independent Test**: Can create tasks, view only my tasks, update my tasks, delete my tasks, and cannot access other users' tasks.

**Acceptance Scenarios**:
- Given I'm authenticated, when I create a task with title and details, then the task should be created under my account and only I can access it
- Given I have created tasks, when I request my tasks, then I should see only tasks associated with my user ID
- Given I have a task, when I update its details, then only I should be able to modify it and others should be prevented

### User Story 3: Task Organization (P2)
**As a** user with many tasks, **I want** to filter, sort, search, and paginate tasks **So that** I can efficiently find and manage specific tasks among large volumes.

**Priority**: P2 - Important for usability
**Why P2**: Essential for managing large numbers of tasks efficiently, but secondary to basic CRUD operations.

**Independent Test**: Can filter tasks by status, sort by various criteria, search by keywords, and navigate pages of results.

**Acceptance Scenarios**:
- Given I have multiple tasks, when I apply filters like pending/completed, then only matching tasks should be returned
- Given I have multiple tasks, when I sort by priority or due date, then tasks should be ordered accordingly
- Given I have many tasks, when I search by keyword, then relevant tasks should be returned

### User Story 4: Advanced Features (P2)
**As a** power user, **I want** export/import functionality, bulk operations, and statistics **So that** I can manage tasks efficiently and analyze my productivity.

**Priority**: P2 - Enhances user experience
**Why P2**: Adds significant value for power users and provides competitive advantage, but not essential for basic functionality.

**Independent Test**: Can export tasks to CSV/JSON, import tasks from files, perform bulk operations, and view statistics.

**Acceptance Scenarios**:
- Given I have tasks, when I export them, then I should receive a properly formatted CSV or JSON file
- Given I have a CSV/JSON file, when I import tasks, then they should be added to my account with proper validation
- Given I have multiple tasks, when I perform bulk operations, then multiple tasks should be affected efficiently

### User Story 5: Security & Performance (P1)
**As a** security-conscious user, **I want** proper JWT verification, user isolation, database indexes, and performance optimization **So that** my data is secure and the system responds quickly.

**Priority**: P1 - Critical for security and reliability
**Why P1**: Security vulnerabilities could compromise user data, and poor performance would make the app unusable.

**Independent Test**: JWT tokens are verified on every request, users cannot access others' data, database queries are optimized, and responses are timely.

**Acceptance Scenarios**:
- Given I have a valid JWT token, when I access protected endpoints, then my user ID should be verified against the URL path
- Given I have many tasks, when I query them, then database indexes should ensure fast response times
- Given I try to access another user's tasks, when I make the request, then I should receive 403 Forbidden response

## Edge Cases

### Authentication Edge Cases
- What happens when user provides invalid JWT token? System should return 401 Unauthorized
- How does the system handle expired JWT tokens? System should return 401 and require re-authentication
- What happens when user provides malformed email during signup? System should return 400 with validation error
- How does the system handle empty password during signin? System should return 400 with validation error

### Task Management Edge Cases
- What happens when a user tries to access another user's tasks? System should return 403 Forbidden
- How does the system handle extremely large numbers of tasks (1000+)? System should use pagination and optimize queries
- What happens when a user tries to create a task with invalid due date (malformed date)? System should return 400 with validation error
- How does the system handle concurrent updates to the same task? System should handle gracefully with proper locking or optimistic updates

### Query Parameter Edge Cases
- What happens when query parameters are invalid or out of range? System should return 400 with validation error
- How does the system handle pagination with invalid page numbers? System should return 400 or use default values
- What happens when search keyword is extremely long? System should validate and limit length appropriately
- How does the system handle sorting by non-existent fields? System should return 400 with validation error

### Export/Import Edge Cases
- What happens when export/import file is corrupted or invalid format? System should return 400 with detailed error message
- How does the system handle import with duplicate data? System should handle duplicates appropriately (skip or merge)
- What happens when import file is extremely large? System should process in chunks or reject if too large
- How does the system handle import errors? System should report specific errors to user without stopping entire process

### Performance Edge Cases
- What happens when database connection is lost temporarily? System should handle gracefully with retries and proper error messages
- How does the system handle high concurrency (1000+ simultaneous requests)? System should maintain performance with connection pooling
- What happens when a query is extremely complex? System should time out gracefully with appropriate error message
- How does the system handle memory exhaustion during large operations? System should handle gracefully with error reporting

## Functional Requirements

### Authentication Requirements
- FR-001: System MUST allow users to create accounts with email (string, max 255 chars), password (string), and name (string, max 100 chars)
- FR-002: System MUST authenticate users via email and password and provide JWT tokens for subsequent requests
- FR-003: System MUST verify JWT tokens on every API request using middleware and return 401 for invalid tokens
- FR-004: System MUST use Better Auth shared secret (BETTER_AUTH_SECRET) for JWT signing/verification, same as frontend
- FR-005: System MUST return 401 Unauthorized for invalid or missing JWT tokens on protected endpoints
- FR-006: System MUST hash passwords securely before storing in database using bcrypt or similar algorithm
- FR-007: System MUST validate email format and password strength during signup with minimum requirements
- FR-008: System MUST prevent duplicate email addresses in user registration and return 409 Conflict
- FR-009: System MUST set JWT token expiration to 7 days without refresh tokens for simpler implementation

### Task Management Requirements
- FR-009: System MUST allow users to create tasks with title (required, max 200 chars), description (optional, max 1000 chars), priority (enum low|medium|high), due_date (optional), tags (optional array)
- FR-010: System MUST allow users to view all their tasks with filtering, sorting, search, and pagination capabilities
- FR-011: System MUST allow users to update task details (title, description, priority, due_date, tags) with proper validation
- FR-012: System MUST allow users to delete tasks with user isolation verification
- FR-013: System MUST allow users to toggle task completion status with proper validation
- FR-014: System MUST validate task title length (max 200 characters) and return appropriate errors
- FR-015: System MUST validate task description length (max 1000 characters) and return appropriate errors
- FR-016: System MUST validate priority enum values (low|medium|high) and return 400 for invalid values
- FR-017: System MUST validate due_date format (ISO 8601) and range when provided
- FR-018: System MUST store tags as JSON array in single database column with PostgreSQL JSON operators for efficient querying

### Query Parameters Requirements
- FR-018: System MUST support filtering by status (all|pending|completed) via query parameter with default 'all'
- FR-019: System MUST support filtering by priority (low|medium|high) via query parameter
- FR-020: System MUST support filtering by due_date range (YYYY-MM-DD format) via query parameter
- FR-021: System MUST support filtering by tags (array of tags) via query parameter
- FR-022: System MUST support sorting by created, title, updated, priority, due_date via query parameter with default 'created'
- FR-023: System MUST support search by title or description keywords via query parameter
- FR-024: System MUST support pagination via page (default 1) and limit (default 20) query parameters
- FR-025: System MUST validate query parameters and return 400 with detailed error messages for invalid values
- FR-026: System MUST provide default values for query parameters when not provided and maintain consistency
- FR-027: System MUST implement full-text search with partial matches and ranking across title and description fields

### Advanced Features Requirements
- FR-027: System MUST provide export functionality to CSV and JSON formats for user's tasks
- FR-028: System MUST provide import functionality from CSV and JSON formats with proper validation
- FR-029: System MUST provide task statistics (total, completed, pending, overdue counts) for user
- FR-030: System MUST provide bulk operations (delete, mark complete, mark pending, change priority) for selected tasks
- FR-031: System MUST validate export/import file formats and return appropriate errors for invalid files
- FR-032: System MUST handle import errors gracefully and report them to user without stopping entire process
- FR-033: System MUST use database transactions wrapping all operations in bulk requests with rollback on any failure to ensure data consistency

### Security Requirements
- FR-033: System MUST enforce user isolation at API and database levels preventing cross-user access
- FR-034: System MUST verify user_id from JWT matches user_id in URL path and return 403 for mismatches
- FR-035: System MUST filter all database queries by authenticated user's ID to prevent unauthorized access
- FR-036: System MUST prevent users from accessing or modifying other users' data through any endpoint
- FR-037: System MUST sanitize user input to prevent SQL injection and other security vulnerabilities
- FR-038: System MUST implement rate limiting to prevent abuse and API endpoint flooding
- FR-039: System MUST log security events (failed authentication, unauthorized access attempts) for monitoring

### API Requirements
- FR-040: All API endpoints MUST be under `/api/` prefix for consistent organization
- FR-041: All API endpoints MUST return JSON responses with consistent structure including success boolean
- FR-042: All API endpoints MUST use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- FR-043: All API endpoints MUST be documented with OpenAPI/Swagger at `/docs` and `/redoc` endpoints
- FR-044: All API endpoints MUST use Pydantic models for request/response validation and type safety
- FR-045: All API endpoints MUST include proper error messages in error responses with code and details
- FR-046: All API endpoints MUST support CORS for frontend integration with configurable origins
- FR-047: All API endpoints MUST handle request timeouts gracefully with appropriate error responses
- FR-048: All API endpoints MUST use standardized JSON error format with error code, message, and optional details field for consistency

### Database Requirements
- FR-048: System MUST use Neon Serverless PostgreSQL database for persistent storage
- FR-049: System MUST use SQLModel ORM for database operations and migrations
- FR-050: System MUST manage database migrations using Alembic for schema evolution
- FR-051: System MUST create all required database indexes for optimal query performance
- FR-052: System MUST use connection pooling for database connections to handle concurrency
- FR-053: System MUST handle database connection errors gracefully with retries and fallbacks

### Performance Requirements
- FR-054: System MUST respond to API requests within 2 seconds (p95 percentile) for good user experience
- FR-055: System MUST optimize database queries with proper indexes to prevent slow queries
- FR-056: System MUST implement query result caching where appropriate to improve performance
- FR-057: System MUST handle 1000+ tasks efficiently with pagination and optimized queries

## Key Entities

### User Entity
- `id` (string, UUID, primary key) - Unique identifier for user
- `email` (string, unique, required, max 255 characters) - User's email address
- `password_hash` (string, required) - Securely hashed password
- `name` (string, required, max 100 characters) - User's display name
- `created_at` (timestamp, auto-generated) - Account creation timestamp
- `updated_at` (timestamp, auto-updated) - Last update timestamp

### Task Entity
- `id` (integer, primary key, auto-increment) - Unique identifier for task
- `user_id` (string, UUID, foreign key to users table, required) - Owner of the task
- `title` (string, required, max 200 characters) - Task title
- `description` (text, optional, max 1000 characters) - Task description
- `priority` (string, enum: 'low'|'medium'|'high', required, default 'medium') - Task priority level
- `due_date` (timestamp, optional) - Due date for task completion
- `tags` (array of strings, optional) - Tags for task categorization
- `completed` (boolean, default false) - Completion status
- `created_at` (timestamp, auto-generated) - Task creation timestamp
- `updated_at` (timestamp, auto-updated) - Last update timestamp

### Session Entity (for JWT tracking, optional)
- `token` (string, JWT token) - JWT token value
- `user_id` (string, UUID, foreign key to users table) - Associated user
- `expires_at` (timestamp) - Token expiration time
- `created_at` (timestamp) - Token creation time

## Technical Implementation

### Project Structure
Backend code MUST be organized in `/backend` directory:
- `/backend/main.py` - FastAPI application entry point with app initialization
- `/backend/models.py` - SQLModel database models (Task, User entities)
- `/backend/routes/` - API route handlers organized by resource:
  - `/backend/routes/auth.py` - Authentication endpoints (signup, signin, signout)
  - `/backend/routes/tasks.py` - Task management endpoints (CRUD operations)
- `/backend/db.py` - Database connection and session management with pooling
- `/backend/middleware/` - Custom middleware for security and functionality:
  - `/backend/middleware/jwt.py` - JWT verification and user isolation middleware
  - `/backend/middleware/cors.py` - CORS configuration middleware
  - `/backend/middleware/error_handler.py` - Global error handling middleware
- `/backend/schemas/` - Pydantic models for request/response validation
- `/backend/services/` - Business logic layer with service classes
- `/backend/tests/` - Test files organized by type (unit/, integration/, api/)

### Database Requirements
- Database MUST be Neon Serverless PostgreSQL for scalability and performance
- ORM MUST be SQLModel for type-safe database operations and migrations
- Database migrations MUST be managed using SQLModel/Alembic for schema versioning
- Task Data Structure MUST include all specified fields with proper constraints
- Database indexes MUST be created on user_id, completed, priority, due_date, and email fields
- Connection pooling MUST be implemented for handling concurrent requests efficiently

### Authentication Requirements
- MUST use Better Auth shared secret (BETTER_AUTH_SECRET) for JWT verification consistency with frontend
- MUST verify JWT tokens on every API request using middleware for security
- MUST extract user information from JWT token for request context
- MUST validate user_id from JWT matches URL path user_id for user isolation
- MUST return 401 Unauthorized for invalid or missing tokens consistently
- JWT tokens MUST be included in Authorization header: `Authorization: Bearer <token>`

### API Endpoints (MUST match frontend API contracts exactly)

#### Authentication Endpoints:
- `POST /api/auth/signup` - Create new user account
  - Request: `{ email: string, password: string, name: string }`
  - Response: `{ success: boolean, data: { token: string, user: { id, email, name } } }`
  - Errors: 400 (validation), 409 (email exists)
- `POST /api/auth/signin` - Authenticate user
  - Request: `{ email: string, password: string }`
  - Response: `{ success: boolean, data: { token: string, user: { id, email, name } } }`
  - Errors: 400 (validation), 401 (invalid credentials)
- `POST /api/auth/signout` - Sign out user
  - Request: `{}` (requires JWT token)
  - Response: `{ success: boolean }`
  - Errors: 401 (invalid token)

#### Task Management Endpoints:
- `GET /api/{user_id}/tasks` - List all tasks with query parameters
  - Query Params: `?status=all|pending|completed`, `?sort=created|title|updated|priority|due_date`, `?search=keyword`, `?priority=low|medium|high`, `?due_date=YYYY-MM-DD`, `?tags=tag1,tag2`, `?page=1`, `?limit=20`
  - Response: `{ data: Task[], meta: { total: number, page: number, limit: number, totalPages: number }, success: boolean }`
  - Headers: `Authorization: Bearer {token}`
  - Errors: 401 (invalid token), 403 (user mismatch)
- `POST /api/{user_id}/tasks` - Create new task
  - Request: `{ title: string (required), description?: string, priority?: 'low'|'medium'|'high', due_date?: string, tags?: string[] }`
  - Response: `{ data: Task, success: boolean }`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
  - Errors: 400 (validation), 401 (invalid token), 403 (user mismatch)
- `GET /api/{user_id}/tasks/{id}` - Get task details
  - Response: `{ data: Task, success: boolean }`
  - Headers: `Authorization: Bearer {token}`
  - Errors: 401 (invalid token), 403 (user mismatch), 404 (task not found)
- `PUT /api/{user_id}/tasks/{id}` - Update task
  - Request: `{ title?: string, description?: string, priority?: 'low'|'medium'|'high', due_date?: string, tags?: string[] }`
  - Response: `{ data: Task, success: boolean }`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
  - Errors: 400 (validation), 401 (invalid token), 403 (user mismatch), 404 (task not found)
- `DELETE /api/{user_id}/tasks/{id}` - Delete task
  - Response: `{ success: boolean, message: string }`
  - Headers: `Authorization: Bearer {token}`
  - Errors: 401 (invalid token), 403 (user mismatch), 404 (task not found)
- `PATCH /api/{user_id}/tasks/{id}/complete` - Toggle completion status
  - Request: `{ completed: boolean }`
  - Response: `{ data: Task, success: boolean }`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
  - Errors: 400 (validation), 401 (invalid token), 403 (user mismatch), 404 (task not found)

#### Export/Import Endpoints:
- `GET /api/{user_id}/tasks/export?format=csv|json` - Export tasks
  - Response: File download (CSV or JSON)
  - Headers: `Authorization: Bearer {token}`
  - Errors: 401 (invalid token), 403 (user mismatch)
- `POST /api/{user_id}/tasks/import` - Import tasks
  - Request: `multipart/form-data` with file (CSV or JSON)
  - Response: `{ success: boolean, data: { imported: number, errors: number, errors_list?: string[] } }`
  - Headers: `Authorization: Bearer {token}`
  - Errors: 400 (invalid file), 401 (invalid token), 403 (user mismatch)

#### Statistics Endpoint:
- `GET /api/{user_id}/tasks/statistics` - Get task statistics
  - Response: `{ data: { total: number, completed: number, pending: number, overdue: number }, success: boolean }`
  - Headers: `Authorization: Bearer {token}`
  - Errors: 401 (invalid token), 403 (user mismatch)

#### Bulk Operations Endpoint:
- `POST /api/{user_id}/tasks/bulk` - Bulk operations
  - Request: `{ action: 'delete'|'complete'|'pending'|'priority', task_ids: number[], priority?: 'low'|'medium'|'high' }`
  - Response: `{ success: boolean, data: { affected: number } }`
  - Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
  - Errors: 400 (validation), 401 (invalid token), 403 (user mismatch)

## Environment Variables
- `DATABASE_URL` - Neon Serverless PostgreSQL connection string (required)
- `BETTER_AUTH_SECRET` - Shared secret for JWT signing/verification (required, same as frontend)
- `ENVIRONMENT` - Environment name (development, staging, production)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated) for frontend integration
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR) for operational monitoring

## Technical Standards
- **Language**: Python 3.13+ for latest features and security updates
- **Framework**: FastAPI for high-performance ASGI framework with automatic docs
- **ORM**: SQLModel for type-safe database operations combining SQLAlchemy and Pydantic
- **Database**: Neon Serverless PostgreSQL for scalable cloud database
- **Authentication**: JWT with Better Auth shared secret for stateless authentication
- **Code Formatting**: Black-style formatting for consistent code style
- **Type Hints**: All public functions MUST include type hints for IDE support and error prevention
- **Docstrings**: All public functions MUST include basic docstrings for maintainability
- **Error Handling**: HTTPException with appropriate HTTP status codes for proper error responses
- **API Documentation**: OpenAPI/Swagger at `/docs` and `/redoc` endpoints for developer experience
- **Testing**: pytest for unit, integration, and API tests to ensure quality
- **Docker**: Dockerfile MUST exist in `/backend` directory for containerization
- **CI/CD**: GitHub Actions workflow for `api.phase_2` branch for automated deployment

## Dependencies
- Backend depends on Neon Serverless PostgreSQL database for data persistence
- Backend depends on Better Auth shared secret (BETTER_AUTH_SECRET) for JWT verification consistency
- Backend MUST be compatible with frontend API client expectations for integration
- Database: Neon Serverless PostgreSQL (via DATABASE_URL environment variable)
- Authentication: Better Auth (via shared secret for JWT verification)
- Development: Python 3.13+, UV (dependency management), FastAPI, SQLModel, Alembic, pytest, Black

## Success Criteria
- **SC-001**: User registration completes in under 2 seconds for good user experience
- **SC-002**: Task creation completes in under 500ms for responsive interaction
- **SC-003**: Task list retrieval with 1000+ tasks completes in under 3 seconds with pagination
- **SC-004**: Filtering and sorting operations complete in under 1 second for efficient navigation
- **SC-005**: 99% success rate on primary operations for reliable service
- **SC-006**: JWT verification adds less than 50ms overhead per request for performance
- **SC-007**: Export/import operations complete within 10 seconds for 1000 tasks for usability
- **SC-008**: All API endpoints return responses within 2 seconds (p95) for consistent performance
- **SC-009**: Database queries are optimized with proper indexes for scalability
- **SC-010**: OpenAPI documentation is complete and accurate for developer experience

## Assumptions
- Frontend will use the same BETTER_AUTH_SECRET for JWT consistency between client and server
- Neon Serverless PostgreSQL will be configured with appropriate connection limits and performance settings
- Users will have standard internet connectivity for API interactions
- The system will be deployed in a cloud environment with appropriate security measures
- Better Auth patterns for JWT will be consistent between frontend and backend implementations

## Clarifications

### Session 2025-12-08

- Q: What should be the JWT token expiration time and refresh strategy? → A: 7-day expiration without refresh tokens
- Q: What transaction strategy should be used for bulk operations to ensure data consistency? → A: Database transactions wrapping all operations with rollback on any failure
- Q: What level of search functionality should be implemented? → A: Full-text search with partial matches and ranking
- Q: What standardized format should be used for all error responses? → A: Standardized JSON with code, message, and optional details field
- Q: How should the tags be stored in the database for optimal querying and performance? → A: JSON array in single database column with PostgreSQL JSON operators