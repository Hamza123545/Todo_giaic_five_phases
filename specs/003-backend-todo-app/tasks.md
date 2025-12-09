# Tasks: Backend Todo Application

**Input**: Design documents from `/specs/003-backend-todo-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- Mark parallel tasks with [P] (when different files, no dependencies)

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

---

## Phase 1: Foundation (Setup) - matches frontend Phase 1

**Goal**: Project initialization and basic structure setup

### Implementation for Foundation

- [X] T001 Create project structure in `/backend` directory with Python 3.13+ requirements
- [X] T002 [P] Initialize UV package manager with `uv init` and configure pyproject.toml
- [X] T003 [P] Set up FastAPI application entry point at `/backend/main.py`
- [X] T004 Create SQLModel database models at `/backend/models.py`
- [X] T005 [P] Set up database connection management at `/backend/db.py`
- [X] T006 Create routes directory structure: `/backend/routes/__init__.py`
- [X] T007 [P] Set up middleware directory structure: `/backend/middleware/__init__.py`
- [X] T008 Create schemas directory structure: `/backend/schemas/__init__.py`
- [X] T009 [P] Set up services directory structure: `/backend/services/__init__.py`
- [X] T010 Create tests directory structure: `/backend/tests/__init__.py`
- [X] T011 [P] Configure Alembic for database migrations in `/backend/alembic/`
- [X] T012 Set up environment variables configuration with `.env.example` file
- [X] T013 [P] Configure code formatting with Black and add formatting configuration
- [X] T014 Install dependencies: FastAPI, SQLModel, Alembic, python-jose, passlib, bcrypt, psycopg
- [X] T015 [P] Create Dockerfile for backend containerization
- [X] T016 Set up docker-compose.yml for local development with database service
- [X] T017 [P] Configure pytest for testing framework with initial configuration
- [X] T018 Create basic CLAUDE.md with backend development guidelines

**Checkpoint**: At this point, basic project structure should be in place and ready for authentication implementation

---

## Phase 2: Authentication (US1) - matches frontend Phase 2/3

**Goal**: Implement user authentication with signup, signin, and JWT token management

### Implementation for User Story 1

- [X] T019 [US1] Create User SQLModel with all required fields (id, email, password_hash, name, timestamps)
- [X] T020 [P] [US1] Implement password hashing utility in `/backend/utils/password.py`
- [X] T021 [US1] Create JWT authentication utilities in `/backend/utils/auth.py`
- [X] T022 [P] [US1] Create authentication Pydantic schemas in `/backend/schemas/auth.py`
- [X] T023 [US1] Create AuthService class in `/backend/services/auth_service.py`
- [X] T024 [P] [US1] Implement JWT middleware for token verification in `/backend/middleware/jwt.py`
- [X] T025 [US1] Create authentication routes in `/backend/routes/auth.py`
- [X] T026 [P] [US1] Implement signup endpoint (POST /api/auth/signup) with validation
- [X] T027 [US1] Implement signin endpoint (POST /api/auth/signin) with JWT token issuance
- [X] T028 [P] [US1] Implement signout endpoint (POST /api/auth/signout)
- [X] T029 [US1] Add user isolation verification to JWT middleware
- [X] T030 [P] [US1] Implement standardized error response format for authentication
- [X] T031 [US1] Add input validation for email format and password strength
- [X] T032 [P] [US1] Create database indexes for users table (email uniqueness)
- [X] T033 [US1] Implement duplicate email prevention with 409 Conflict response
- [X] T034 [P] [US1] Set JWT token expiration to 7 days without refresh tokens
- [X] T035 [US1] Add CORS middleware configuration for frontend integration
- [X] T036 [P] [US1] Create authentication integration tests in `/backend/tests/integration/test_auth.py`

**Checkpoint**: At this point, User Story 1 should be fully functional with secure authentication

---

## Phase 3: Basic Task CRUD (US2) - matches frontend Phase 4

**Goal**: Implement core task CRUD operations with user isolation

### Implementation for User Story 2

- [X] T037 [US2] Create Task SQLModel with all required fields (id, user_id, title, description, priority, due_date, tags, completed, timestamps)
- [X] T038 [P] [US2] Create task Pydantic schemas in `/backend/schemas/requests.py` and `/backend/schemas/responses.py`
- [X] T039 [US2] Create TaskService class in `/backend/services/task_service.py`
- [X] T040 [P] [US2] Implement task creation endpoint (POST /api/{user_id}/tasks)
- [X] T041 [US2] Implement task listing endpoint (GET /api/{user_id}/tasks)
- [X] T042 [P] [US2] Implement task details endpoint (GET /api/{user_id}/tasks/{id})
- [X] T043 [US2] Implement task update endpoint (PUT /api/{user_id}/tasks/{id})
- [X] T044 [P] [US2] Implement task deletion endpoint (DELETE /api/{user_id}/tasks/{id})
- [X] T045 [US2] Implement task completion toggle endpoint (PATCH /api/{user_id}/tasks/{id}/complete)
- [X] T046 [P] [US2] Add user isolation enforcement to all task endpoints
- [X] T047 [US2] Implement task validation (title length, description length, priority enum)
- [X] T048 [P] [US2] Store tags as JSON array with PostgreSQL JSON operators
- [X] T049 [US2] Create database indexes for tasks table (user_id, completed, priority, due_date)
- [X] T050 [P] [US2] Add proper error handling with standardized format to task operations
- [X] T051 [US2] Implement due_date validation (ISO 8601 format)
- [X] T052 [P] [US2] Add optimistic response handling for task operations
- [X] T053 [US2] Create task CRUD integration tests in `/backend/tests/integration/test_tasks.py`
- [X] T054 [P] [US2] Implement comprehensive task validation with detailed error messages

**Checkpoint**: At this point, User Story 2 should be fully functional with complete task management

---

## Phase 4: Query Parameters & Filtering (US3) - must be ready before frontend Phase 5

**Goal**: Implement filtering, sorting, search, and pagination for task management

### Implementation for User Story 3

- [X] T055 [US3] Enhance GET /api/{user_id}/tasks endpoint with status filtering query parameter
- [X] T056 [P] [US3] Add priority filtering capability to task listing endpoint
- [X] T057 [US3] Implement due_date filtering for task listing endpoint
- [X] T058 [P] [US3] Add tags filtering capability using JSON operators
- [X] T059 [US3] Implement sorting by created, title, updated, priority, due_date with query parameter
- [X] T060 [P] [US3] Add pagination support with page and limit query parameters
- [X] T061 [US3] Implement full-text search with partial matches across title/description
- [X] T062 [P] [US3] Add query parameter validation with detailed error messages
- [X] T063 [US3] Provide default values for all query parameters when not provided
- [X] T064 [P] [US3] Optimize database queries with proper indexing for filtering/sorting/search
- [X] T065 [US3] Create query parameter validation schemas in `/backend/schemas/query_params.py`
- [X] T066 [P] [US3] Add search functionality with case-insensitive ILIKE pattern matching
- [X] T067 [US3] Implement efficient database queries for combined filtering/sorting operations
- [X] T068 [P] [US3] Add pagination metadata to response with total, page, limit, totalPages
- [X] T069 [US3] Create query parameter integration tests in `/backend/tests/integration/test_query_params.py`
- [X] T070 [P] [US3] Document query parameters in OpenAPI/Swagger documentation

**Checkpoint**: At this point, User Story 3 should be fully functional with advanced querying capabilities

---

## Phase 5: Advanced Features (US4) - matches frontend Phase 7

**Goal**: Implement export/import, statistics, bulk operations, and advanced features

### Implementation for User Story 4

- [X] T071 [US4] Create export endpoint (GET /api/{user_id}/tasks/export) for CSV and JSON formats
- [X] T072 [P] [US4] Implement import endpoint (POST /api/{user_id}/tasks/import) for CSV and JSON
- [X] T073 [US4] Create statistics endpoint (GET /api/{user_id}/tasks/statistics) for task metrics
- [X] T074 [P] [US4] Implement bulk operations endpoint (POST /api/{user_id}/tasks/bulk)
- [X] T075 [US4] Add database transaction support for bulk operations with rollback capability
- [X] T076 [P] [US4] Implement file format validation for export/import operations
- [X] T077 [US4] Add import error handling and reporting with detailed error messages
- [X] T078 [P] [US4] Create export/import service class in `/backend/services/export_service.py` and `/backend/services/import_service.py`
- [X] T079 [US4] Implement bulk operation types (delete, complete, pending, priority change)
- [X] T080 [P] [US4] Add comprehensive validation for export/import file content
- [X] T081 [US4] Create advanced feature integration tests in `/backend/tests/integration/test_advanced_features.py`
- [X] T082 [P] [US4] Add performance optimization for large dataset operations
- [X] T083 [US4] Implement proper error reporting for import operations with errors_list
- [X] T084 [P] [US4] Add rate limiting to prevent abuse of advanced features
- [X] T085 [US4] Create statistics calculation service for total, completed, pending, overdue counts
- [X] T086 [P] [US4] Optimize export operations for large datasets with streaming

**Checkpoint**: At this point, User Story 4 should be fully functional with advanced features

---

## Phase 6: Security & Performance (US5) - matches frontend Phase 8

**Goal**: Implement security hardening, performance optimization, and monitoring

### Implementation for User Story 5

- [X] T087 [US5] Implement user isolation verification middleware for all endpoints
- [X] T088 [P] [US5] Add rate limiting middleware to prevent API abuse
- [X] T089 [US5] Enhance error handling middleware with proper logging
- [X] T090 [P] [US5] Implement request logging middleware for monitoring
- [X] T091 [US5] Add security event logging for authentication failures and unauthorized access
- [X] T092 [P] [US5] Implement database connection pooling for performance
- [X] T093 [US5] Optimize database queries with proper indexing strategy
- [X] T094 [P] [US5] Add query result caching where appropriate for performance
- [X] T095 [US5] Implement performance monitoring and metrics collection
- [X] T096 [P] [US5] Add input sanitization to prevent injection attacks
- [X] T097 [US5] Implement proper timeout handling for API requests
- [X] T098 [P] [US5] Add comprehensive security headers to API responses
- [X] T099 [US5] Create security-focused tests in `/backend/tests/security/`
- [X] T100 [P] [US5] Optimize for 1000+ task handling with pagination and query optimization

**Checkpoint**: At this point, User Story 5 should be fully functional with security and performance features

---

## Phase 7: Documentation & Testing - matches frontend Phase 9

**Goal**: Complete API documentation, comprehensive testing, and deployment preparation

### Implementation for Documentation & Testing

- [X] T101 Create comprehensive OpenAPI/Swagger documentation at /docs and /redoc endpoints
- [X] T102 [P] Create unit tests for all service layer functions in `/backend/tests/unit/`
- [X] T103 Create integration tests for all API endpoints in `/backend/tests/integration/`
- [X] T104 [P] Create API tests for all endpoint behaviors in `/backend/tests/api/`
- [X] T105 Create test fixtures and data factories for testing in `/backend/tests/conftest.py`
- [X] T106 [P] Set up CI/CD pipeline with GitHub Actions for `api.phase_2` branch
- [X] T107 Create Docker production configuration with multi-stage build
- [X] T108 [P] Add comprehensive type hinting throughout the codebase
- [X] T109 Create performance tests for API endpoints in `/backend/tests/performance/`
- [X] T110 [P] Document all API endpoints with request/response schemas and examples
- [X] T111 Create deployment documentation and operational runbooks
- [X] T112 [P] Add comprehensive error documentation with all possible error responses
- [X] T113 Create developer setup guide and contribution guidelines
- [X] T114 [P] Perform final integration testing across all components
- [X] T115 Create production monitoring and alerting configuration
- [X] T116 [P] Final security review and penetration testing checklist

**Checkpoint**: At this point, the complete backend should be ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Authentication (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **Task CRUD (Phase 3)**: Depends on Authentication completion
- **Query Parameters (Phase 4)**: Depends on Task CRUD completion
- **Advanced Features (Phase 5)**: Depends on Task CRUD completion
- **Security & Performance (Phase 6)**: Can run in parallel with Phases 4/5
- **Documentation & Testing (Phase 7)**: Depends on all implementation phases

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup phase - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Authentication phase - Depends on US1 (authentication)
- **User Story 3 (P2)**: Can start after Task CRUD phase - Depends on US2 (tasks exist to organize)
- **User Story 4 (P2)**: Can start after Task CRUD phase - Depends on US2 (tasks exist to enhance)
- **User Story 5 (P1)**: Can start after Task CRUD phase - Security/performance for all features

### Within Each User Story

- Models before services
- Services before routes
- Routes before API integration
- Core functionality before enhancements
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Authentication tasks marked [P] can run in parallel (within Phase 2)
- All Task CRUD tasks marked [P] can run in parallel (within Phase 3)
- All Advanced Features tasks marked [P] can run in parallel (within Phase 5)
- Testing tasks can run in parallel with implementation tasks
- Documentation tasks can run in parallel with implementation tasks

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Authentication (User Story 1)
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready

### Iterative Enhancement

1. Add User Story 2: Task CRUD → Test independently → Deploy/Demo
2. Add User Story 3: Query Parameters → Test independently → Deploy/Demo
3. Add User Story 4: Advanced Features → Test independently → Deploy/Demo
4. Add User Story 5: Security & Performance → Test independently → Deploy/Demo
5. Add Documentation & Testing: Complete testing → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Authentication together
2. Once Authentication is done:
   - Developer A: User Story 2 (Task CRUD)
   - Developer B: User Story 3 (Query Parameters)
   - Developer C: User Story 4 (Advanced Features)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [US1], [US2], [US3], [US4], [US5] labels map tasks to specific user stories for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks should be testable independently
- Tasks should follow the format: [ID] [P?] [Story] Description with file paths
- Phase alignment ensures backend readiness before frontend requires features