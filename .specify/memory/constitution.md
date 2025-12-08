<!--
Sync Impact Report:
Version change: 2.2.0 → 2.3.0
Modified principles:
  - II. Web-First Multi-User Application: Enhanced with task filtering and sorting requirements
  - X. RESTful API Design: Enhanced with query parameters, filtering, and OpenAPI documentation requirements
  - IV. Modular Monorepo Structure: Enhanced with detailed directory structure
Added sections:
  - IX. Multi-User Architecture
  - X. RESTful API Design (enhanced with query parameters and OpenAPI)
  - XI. JWT Authentication
  - Enhanced Features section
  - Specification Organization subsection
  - Specification Referencing subsection
  - Spec-Kit Plus Configuration subsection
  - Development Workflow with Spec-Kit subsection
  - Development Commands subsection
  - Version Control and GitHub Integration section
  - Root CLAUDE.md Requirements subsection
  - Frontend CLAUDE.md Requirements subsection
  - Backend CLAUDE.md Requirements subsection
  - Docker Compose (Optional) subsection
  - Docker Configuration for Deployment section
  - CI/CD Pipelines section
  - Frontend File Structure subsection
  - Frontend Patterns subsection
  - Backend File Structure subsection
  - Backend Patterns subsection
  - Phase II Mandatory Requirements section
Modified Technical Standards:
  - Added Version Control requirements
  - Added MCP Servers requirements
  - Added Commit Tools requirements
  - Added Context Management requirements
  - Added Docker and CI/CD requirements
Modified Development Workflow:
  - Added steps 9-12 for GitHub operations using MCP servers
Modified Root CLAUDE.md Requirements:
  - Added GitHub Workflow requirements
  - Added MCP Server Usage requirements
  - Added Commit Practices requirements
  - Added Branch Management requirements
  - Added Context Management requirements
  - Added Docker and CI/CD requirements
Modified Frontend CLAUDE.md Requirements:
  - Added Better Auth requirement
  - Added Better Auth MCP Server requirement
  - Added API client requirement
Modified Backend CLAUDE.md Requirements:
  - Added JWT Verification requirement
  - Added User Isolation requirement
  - Added Better Auth Integration requirement
Modified Governance:
  - Added Version Control Compliance requirement
  - Added MCP Server Requirement
  - Added CI/CD Pipeline Compliance requirement
  - Added Phase II Mandatory Requirements section
  - Added Better Auth MCP Server Requirement section
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md: ⚠ pending
  - .specify/templates/spec-template.md: ⚠ pending
  - .specify/templates/tasks-template.md: ⚠ pending
  - .specify/templates/commands/sp.constitution.md: ⚠ pending
  - .specify/templates/commands/sp.phr.md: ⚠ pending
Follow-up TODOs: None
-->
# Full-Stack Web Todo Application Constitution

## Phase II Mandatory Requirements

**All Phase II requirements are MANDATORY - nothing is optional.**

### Basic Level Functionality (All 5 Features Required)
All 5 Basic Level features MUST be implemented as web application features:
1. Add Task - Create new tasks with title, description, priority, due date, tags
2. List Tasks - View all tasks with filtering, sorting, and search
3. Update Task - Edit task details (title, description, priority, due date, tags)
4. Delete Task - Remove tasks permanently
5. Mark Complete/Incomplete - Toggle task completion status

### RESTful API Endpoints (All Required)
All API endpoints MUST be implemented:
- GET /api/{user_id}/tasks - List all tasks (with query parameters for filtering/sorting/search/pagination)
- POST /api/{user_id}/tasks - Create a new task
- GET /api/{user_id}/tasks/{id} - Get task details
- PUT /api/{user_id}/tasks/{id} - Update a task
- DELETE /api/{user_id}/tasks/{id} - Delete a task
- PATCH /api/{user_id}/tasks/{id}/complete - Toggle completion status

### Advanced Features (All Required for Phase II)
All advanced features MUST be implemented as part of Phase II:
- Export functionality to CSV and JSON formats MUST be implemented
- Import functionality from CSV and JSON formats MUST be implemented
- Drag-and-drop reordering of tasks MUST be implemented
- Undo/redo functionality MUST be implemented
- Task statistics dashboard (total, completed, pending, overdue) MUST be implemented
- Bulk operations (delete, mark complete, change priority) for selected tasks MUST be implemented
- Multiple view modes (list, grid, kanban) MUST be implemented
- Inline editing for tasks MUST be implemented
- Real-time updates with polling mechanism MUST be implemented
- Keyboard shortcuts for common actions MUST be implemented
- Dark mode toggle MUST be implemented

### Responsive Frontend Interface (Required)
- Frontend MUST be responsive for mobile, tablet, and desktop
- All UI components MUST work across all screen sizes
- Touch-friendly interactions MUST be implemented for mobile devices

### Neon Serverless PostgreSQL Database (Required)
- Database MUST be Neon Serverless PostgreSQL
- All data MUST persist across sessions
- Database migrations MUST be managed using SQLModel/Alembic

### Better Auth Authentication (Required)
- Better Auth MUST be used for user signup/signin
- Better Auth MUST be configured with JWT plugin
- JWT tokens MUST be issued on login
- Frontend MUST attach JWT tokens to all API requests
- Backend MUST verify JWT tokens on all API requests

### Monorepo Structure with Spec-Kit (Required)
- Project MUST use monorepo structure (/frontend, /backend, /specs)
- Spec-Kit Plus configuration MUST be at /.spec-kit/config.yaml
- All specifications MUST be organized in /specs directory
- Root CLAUDE.md, frontend/CLAUDE.md, and backend/CLAUDE.md MUST exist

### Security Requirements (All Required)
- User isolation MUST be enforced at API and database levels
- JWT token verification MUST happen on every API request
- Shared secret (BETTER_AUTH_SECRET) MUST be used for JWT signing/verification
- All endpoints MUST require valid JWT token
- Requests without token MUST receive 401 Unauthorized
- User ID from JWT MUST match user_id in URL path

### Docker and CI/CD (All Required)
- Backend Dockerfile MUST exist
- Frontend Dockerfile MUST exist
- docker-compose.yml MUST exist
- GitHub Actions CI/CD pipelines MUST be configured
- Backend pipeline MUST run on api.phase_2 branch
- Frontend pipeline MUST run on phase_2 branch

### MCP Server Usage (All Required)
- GitHub MCP Server MUST be used for all git operations
- Context7 MCP Server MUST be used for code context
- Better Auth MCP Server MUST be used for authentication patterns
- All operations MUST go through MCP servers, not direct commands

## Core Principles

### I. Persistent Database Storage
All application data MUST be stored in Neon Serverless PostgreSQL database. Tasks MUST persist across sessions and be associated with authenticated users. No in-memory-only storage is permitted. This ensures data durability and enables multi-user functionality.

### II. Web-First Multi-User Application
The application MUST be a modern full-stack web application accessible via web browser. All functionality MUST be exposed through a responsive web interface built with Next.js. The application MUST support multiple concurrent users with proper authentication and data isolation. All 5 Basic Level features (Add Task, List Tasks, Update Task, Mark Complete/Incomplete, Delete Task) MUST be implemented as web application features.

**Task Filtering:**
*   Task list MUST support filtering by completion status:
  - "all" - Show all tasks (default)
  - "pending" - Show only incomplete tasks
  - "completed" - Show only completed tasks
*   Filtering MUST be implemented as query parameter in API: `?status=pending`
*   Frontend MUST provide UI controls (buttons, dropdown, or tabs) for status filtering

**Task Sorting:**
*   Task list MUST support sorting by:
  - Creation date (created) - newest or oldest first
  - Title (title) - alphabetical order
  - Update date (updated) - most recently updated first
*   Sorting MUST be implemented as query parameter in API: `?sort=created`
*   Frontend MUST provide UI controls (dropdown or buttons) for sorting options
*   Default sort order MUST be by creation date (newest first)

### III. Clean Code Practices
All code MUST adhere to clean code principles, specifically: small functions, clear names, single responsibility, and minimal side effects. This promotes readability and maintainability across both frontend and backend codebases.

### IV. Modular Monorepo Structure
The project MUST utilize a monorepo structure with clear separation:
- `/frontend` - Next.js 16+ application (TypeScript, App Router)
- `/backend` - FastAPI application (Python)
- Root level - Shared specifications, configuration, and documentation
Both frontend and backend MUST follow modular architecture principles with clear separation of concerns.

### V. Spec-Driven Development
All new work MUST commence from Spec-Kit Plus commands (`/sp.specify`, `/sp.plan`, `/sp.tasks`, `/sp.implement`, `/sp.clarify`) and MUST strictly align with this constitution. Any changes to requirements MUST trigger an explicit spec/plan update, never ad-hoc coding.

### VI. Automated Testing
The project MUST include automated tests for both frontend and backend. Backend MUST include API integration tests for all endpoints. Backend tests MUST verify JWT authentication and user isolation. Frontend MUST include component tests and integration tests. All tests MUST pass before merging any changes.

### VII. Clarity & Maintainability
Prioritize clarity, maintainability, and readability over excessive cleverness, premature optimization, or over-engineering. The goal is a clear, understandable codebase for educational purposes.

### VIII. AI Sub-Agents and Skills
The project explicitly supports the use of multiple AI sub-agents and reusable skills, provided they strictly adhere to this constitution and the spec-driven workflow. Each sub-agent MUST have a clear, narrow role (e.g., writing specifications, planning, implementation, testing, or refactoring) and MUST NOT bypass the established specification or plan.

### IX. Multi-User Architecture
All data MUST be user-scoped. Every task MUST be associated with an authenticated user. User isolation MUST be enforced at both API and database levels. No user can access or modify another user's data. All API endpoints MUST verify user authentication before processing requests. Each user only sees and modifies their own tasks (task ownership enforced on every operation).

### X. RESTful API Design
Backend MUST expose RESTful API endpoints following OpenAPI standards. All endpoints MUST be documented with request/response schemas. API endpoints MUST follow REST conventions:
- GET for retrieval
- POST for creation
- PUT for full updates
- PATCH for partial updates
- DELETE for deletion
All endpoints MUST return appropriate HTTP status codes (200, 201, 400, 401, 404, 500).
Required API endpoints:
- GET /api/{user_id}/tasks - List all tasks for user
- POST /api/{user_id}/tasks - Create a new task
- GET /api/{user_id}/tasks/{id} - Get task details
- PUT /api/{user_id}/tasks/{id} - Update a task
- DELETE /api/{user_id}/tasks/{id} - Delete a task
- PATCH /api/{user_id}/tasks/{id}/complete - Toggle completion status

API endpoints MUST support query parameters for enhanced functionality:
- GET /api/{user_id}/tasks?status=all|pending|completed - Filter tasks by completion status
- GET /api/{user_id}/tasks?sort=created|title|updated - Sort tasks by specified field
- Query parameters MUST be optional (default behavior when not provided)
- Frontend MUST provide UI controls for filtering and sorting
- Backend MUST validate query parameters and return appropriate errors for invalid values

Base URL specifications:
- Development environment: http://localhost:8000
- Production environment: Environment-specific (configured via environment variables)
- All endpoints MUST return JSON responses with consistent structure
- Error responses MUST follow consistent format with error code, message, and details

FastAPI MUST automatically generate OpenAPI/Swagger documentation
- Documentation MUST be accessible at `/docs` endpoint (Swagger UI) and `/redoc` endpoint (ReDoc)
- All endpoints MUST be documented with:
  - Request schemas (Pydantic models)
  - Response schemas (Pydantic models)
  - Error responses with status codes
  - Authentication requirements
  - Query parameters with types and descriptions
  - Request body examples

### XI. JWT Authentication
Authentication MUST use Better Auth library on the frontend. Better Auth MUST be configured to issue JWT (JSON Web Token) tokens upon user login (signup/signin). Better Auth MUST enable JWT plugin to issue tokens. Backend MUST verify JWT tokens on every API request using a shared secret key (BETTER_AUTH_SECRET). JWT tokens MUST be included in the Authorization header: `Authorization: Bearer <token>`. Frontend API client MUST attach JWT token to every API request header. Backend MUST extract user information from JWT token and validate it matches the requested user_id in the URL path. Tokens MUST have expiration (e.g., 7 days) and be stateless (no server-side session storage required). Requests without valid token MUST receive 401 Unauthorized response. Backend MUST add middleware to verify JWT and extract user information.

## Enhanced Features (All Mandatory for Phase II)

**All enhanced features listed below are MANDATORY for Phase II completion. Nothing is optional.**

**Enhanced Task Management (All Mandatory):**
*   Task filtering by status (all, pending, completed) - MANDATORY
*   Task filtering by priority - MANDATORY
*   Task filtering by due date - MANDATORY
*   Task filtering by tags - MANDATORY
*   Task sorting by date, title, update time, priority, due date - MANDATORY
*   Task search functionality by title or description - MANDATORY
*   Task pagination for large lists - MANDATORY
*   Multiple view modes (list, grid, kanban) - MANDATORY
*   Drag-and-drop reordering - MANDATORY
*   Inline editing - MANDATORY
*   Undo/redo functionality - MANDATORY
*   Export to CSV and JSON - MANDATORY
*   Import from CSV and JSON - MANDATORY
*   Task statistics dashboard - MANDATORY
*   Bulk operations - MANDATORY
*   Real-time updates with polling - MANDATORY
*   Keyboard shortcuts - MANDATORY
*   Dark mode toggle - MANDATORY

**User Experience (All Mandatory):**
*   Responsive design for mobile, tablet, and desktop - MANDATORY
*   Loading states for async operations - MANDATORY
*   Error handling with user-friendly messages - MANDATORY
*   Toast notifications for success/error feedback - MANDATORY
*   Optimistic UI updates where appropriate - MANDATORY
*   Touch-friendly interactions for mobile devices - MANDATORY
*   Offline functionality with sync when connection restored - MANDATORY
*   PWA (Progressive Web App) capabilities - MANDATORY

**Developer Experience (All Mandatory):**
*   Comprehensive API documentation via OpenAPI/Swagger - MANDATORY
*   TypeScript types for all API responses - MANDATORY
*   Environment variable validation - MANDATORY
*   Development and production configurations - MANDATORY
*   Docker Compose for easy local development - MANDATORY
*   Automated testing (unit, integration, E2E) - MANDATORY
*   Performance optimization and code splitting - MANDATORY
*   Accessibility compliance (WCAG 2.1 AA) - MANDATORY

## Technical Standards

*   **Frontend**: Next.js 16+ (App Router) MUST be used with TypeScript.
*   **Backend**: Python 3.13+ with FastAPI MUST be used.
*   **Database**: Neon Serverless PostgreSQL MUST be used for persistent storage.
*   **ORM**: SQLModel MUST be used for database operations and migrations.
*   **Authentication**: Better Auth MUST be used for user management and JWT token issuance.
*   **Styling**: Tailwind CSS MUST be used for frontend styling.
*   **Spec-Driven Development**: Claude Code + Spec-Kit Plus MUST be used for spec-driven development.
*   **Tooling**: UV MUST be used for Python dependency management. npm/pnpm MUST be used for frontend dependencies.

*   **Version Control**: Git MUST be used for version control with GitHub as remote repository. All version control operations MUST be performed through MCP GitHub server.

*   **MCP Servers**: MCP (Model Context Protocol) servers MUST be used for GitHub operations, context management, and authentication patterns:
  - **GitHub MCP Server**: MUST be used for all git operations including commit, push, pull, branch creation, branch management, and repository operations
  - **Context7 MCP Server**: MUST be used for enhanced code context, codebase understanding, and maintaining context across sessions
  - **Better Auth MCP Server**: MUST be used for Better Auth configuration patterns, JWT token management patterns, and authentication best practices
  - All GitHub operations MUST go through MCP servers, not direct git commands
  - Claude Code MUST use MCP servers for all repository, context, and authentication pattern operations

*   **Commit Tools**: Claude Code MUST use MCP GitHub server for all commits and pushes. Direct git CLI commands SHOULD be avoided in favor of MCP server operations to ensure proper integration and commit attribution.

*   **Context Management**: Context7 MCP server MUST be used for maintaining code context across sessions, understanding codebase structure, and retrieving relevant code information.

*   **Docker and CI/CD**:
  - Backend MUST have Dockerfile for containerization and deployment
  - Frontend MUST have Dockerfile for containerization and deployment
  - CI/CD pipelines MUST be configured using GitHub Actions
  - Backend CI/CD pipeline MUST run on `api.phase_2` branch
  - Frontend CI/CD pipeline MUST run on `phase_2` branch
  - All pipelines MUST include testing, linting, and deployment steps

**Frontend File Structure:**
*   `/frontend/app/` - Next.js App Router pages and layouts (server components by default)
*   `/frontend/components/` - Reusable UI components (client components when needed for interactivity)
*   `/frontend/lib/api.ts` - Centralized API client library for all backend communication
*   `/frontend/lib/` - Utility functions and shared code

**Frontend Patterns:**
*   Server components MUST be used by default for better performance and SEO
*   Client components MUST be used only when needed (interactivity, hooks, event handlers, browser APIs)
*   API client library MUST:
  - Attach JWT token to every request automatically from Better Auth session
  - Handle authentication errors (401) and redirect to login page
  - Provide typed TypeScript interfaces for all API calls
  - Include error handling and retry logic for network failures
  - Support query parameters for filtering and sorting
*   Component organization:
  - Shared/reusable components in `/components` directory
  - Page-specific components MAY be co-located with pages in `/app` directory
  - Components MUST follow consistent naming and structure patterns

**Backend File Structure:**
*   `main.py` - FastAPI application entry point with app initialization
*   `models.py` - SQLModel database models (Task, User, etc.)
*   `routes/` - API route handlers organized by resource (tasks.py, auth.py, etc.)
*   `db.py` - Database connection, session management, and connection pooling
*   `middleware/` - Custom middleware:
  - JWT verification middleware
  - CORS middleware
  - Error handling middleware
  - Request logging middleware
*   `schemas/` - Pydantic models for request/response validation
*   `services/` - Business logic layer (separated from routes)
*   `tests/` - Test files organized by type (unit/, integration/, api/)

**Backend Patterns:**
*   All API routes MUST be organized under `/api/` prefix
*   Routes MUST use dependency injection for database sessions
*   All routes MUST use Pydantic models for request/response validation
*   Error handling MUST use HTTPException with appropriate HTTP status codes
*   Database operations MUST use SQLModel with proper session management
*   All database queries MUST filter by authenticated user's ID

*   **Task Data Structure**: Tasks in the database MUST include: `id` (integer, primary key, auto-increment), `user_id` (string, foreign key to users table, UUID), `title` (string, required, max 200 characters), `description` (text, optional, max 1000 characters), `priority` (string, enum: 'low'|'medium'|'high', required, default 'medium'), `due_date` (timestamp, optional), `tags` (array of strings, optional), `completed` (boolean, default false), `created_at` (timestamp), `updated_at` (timestamp).
*   **Type Hinting & Docstrings**: Public functions MUST include type hints and basic docstrings to enhance code comprehension.
*   **Code Formatting**: Consistent code formatting (e.g., Black-style for Python, Prettier for TypeScript) MUST be enforced across the entire codebase.
*   **Error Handling**: The application MUST provide clear, helpful, and user-friendly error messages for invalid user input and authentication failures.
*   **Database Indexes**: Database indexes MUST be created: tasks.user_id (for filtering by user), tasks.completed (for status filtering), tasks.priority (for priority filtering), tasks.due_date (for due date filtering and sorting), users.email (unique index).

## Development Workflow

*   **Specification**: Specifications (`spec.md`) MUST clearly describe user stories for the application's core features: adding tasks, listing tasks with status indicators, updating task details, deleting tasks by ID, and marking tasks complete/incomplete as web application features.
*   **Planning**: The architectural plan (`plan.md`) MUST include details on frontend and backend modules, key API endpoints, data models, authentication flow, and how the web interface maps to core task operations.
*   **Implementation**: Code implementation MUST strictly follow the generated specification and plan.
*   **Repository Structure**: The project repository MUST contain:
  - `constitution.md` at `.specify/memory/constitution.md`
  - `/.spec-kit/config.yaml` - Spec-Kit Plus configuration file
  - `/specs/` - Organized specifications directory:
    - `/specs/overview.md` - Project overview and current phase status
    - `/specs/architecture.md` - System architecture documentation (MANDATORY - required for Phase II)
    - `/specs/features/` - Feature specifications (task-crud.md, authentication.md, chatbot.md for future phases)
    - `/specs/api/rest-endpoints.md` - REST API endpoint specifications
    - `/specs/api/mcp-tools.md` - MCP tools specifications (MANDATORY - required for Phase II)
    - `/specs/database/schema.md` - Database schema and model specifications
    - `/specs/ui/components.md` - UI component specifications
    - `/specs/ui/pages.md` - UI page and route specifications
  - `/frontend/` - Next.js 16+ application directory
    - `/frontend/CLAUDE.md` - Frontend-specific development guidelines
    - `/frontend/app/` - Next.js App Router pages and layouts
    - `/frontend/components/` - Reusable UI components
    - `/frontend/lib/api.ts` - Centralized API client library
  - `/backend/` - FastAPI application directory
    - `/backend/CLAUDE.md` - Backend-specific development guidelines
    - `/backend/main.py` - FastAPI application entry point
    - `/backend/models.py` - SQLModel database models
    - `/backend/routes/` - API route handlers
    - `/backend/db.py` - Database connection and session management
    - `/backend/middleware/` - Custom middleware (JWT verification, CORS)
    - `/backend/schemas/` - Pydantic request/response models
    - `/backend/services/` - Business logic layer
    - `/backend/tests/` - Test files
  - `/CLAUDE.md` - Root-level Claude Code instructions
  - `/docker-compose.yml` - Docker Compose configuration for running both services together (MANDATORY - required for Phase II)
  - `/README.md` - Project documentation with setup and run instructions
*   **README Documentation**: The `README.md` MUST explicitly describe how to install dependencies for both frontend and backend, how to run the web application, and how to execute tests.
*   **API-First Development**: Backend API MUST be designed and implemented before frontend integration.
*   **Database Migrations**: Database migrations MUST be managed using SQLModel/Alembic. All database schema changes MUST be versioned and reversible.
*   **Environment Variables**: Environment variables MUST be used for configuration: DATABASE_URL (Neon PostgreSQL connection string), BETTER_AUTH_SECRET (Shared secret for JWT signing/verification), and other service-specific environment variables as needed.

**Specification Organization:**
*   Specifications MUST be organized by type in `/specs` directory:
  - `/specs/features/` - What to build (user stories, acceptance criteria, feature requirements)
  - `/specs/api/` - How APIs should work (endpoints, request/response schemas, authentication)
  - `/specs/database/` - Data models and schema (tables, relationships, indexes, migrations)
  - `/specs/ui/` - UI components and pages (component structure, page layouts, user flows)

**Specification Referencing:**
*   Specifications MUST be referenced using `@specs/` notation in prompts:
  - `@specs/features/task-crud.md` - Reference task CRUD feature specification
  - `@specs/api/rest-endpoints.md` - Reference API endpoints specification
  - `@specs/database/schema.md` - Reference database schema specification
  - `@specs/ui/pages.md` - Reference UI pages specification
*   When implementing features, Claude Code MUST read relevant specifications before coding

**Spec-Kit Plus Configuration:**
*   Configuration file MUST be at `/.spec-kit/config.yaml`
*   Configuration MUST include:
  - name: hackathon-todo (or project name)
  - version: "2.0.0"
  - structure: specs_dir, features_dir, api_dir, database_dir, ui_dir
  - phases:
    - phase1-console: features: [task-crud]
    - phase2-web: features: [task-crud, authentication]
    - phase3-chatbot: features: [task-crud, authentication, chatbot] (future)

**Development Workflow with Spec-Kit:**
1. Read relevant specification: `@specs/features/[feature].md`
2. Read API specification: `@specs/api/rest-endpoints.md` (if implementing API)
3. Read database specification: `@specs/database/schema.md` (if database changes needed)
4. Read UI specification: `@specs/ui/pages.md` (if implementing UI)
5. Implement backend following: `@backend/CLAUDE.md`
6. Implement frontend following: `@frontend/CLAUDE.md`
7. Test and iterate
8. Update specifications if requirements change
9. **Commit changes using MCP GitHub server** with descriptive commit messages following conventional commit format
10. **Push changes to GitHub using MCP GitHub server** to appropriate branch:
    - Full-stack development: Push to `phase_2` branch (includes frontend, backend, specs, all root files)
    - Backend-only deployment: Push to `api.phase_2` branch (backend files only)
    - Feature work: Push to feature branch
11. **Verify commits appear correctly in GitHub repository** with proper attribution and commit history
12. **For backend deployment**: Ensure `api.phase_2` branch contains only backend files (no frontend, no specs)

**Development Commands:**

**Frontend Commands:**
*   Development server: `cd frontend && npm run dev` (or `pnpm dev`)
*   Production build: `cd frontend && npm run build`
*   Run tests: `cd frontend && npm run test`
*   Type checking: `cd frontend && npm run type-check` (if configured)

**Backend Commands:**
*   Development server: `cd backend && uvicorn main:app --reload --port 8000`
*   Run tests: `cd backend && uv run pytest`
*   Run tests with coverage: `cd backend && uv run pytest --cov`
*   Database migrations: `cd backend && alembic upgrade head` (if using Alembic)

**Both Services:**
*   Using Docker Compose: `docker-compose up` (if docker-compose.yml is configured)
*   Using Docker Compose in background: `docker-compose up -d`
*   Stop services: `docker-compose down`

**Version Control and GitHub Integration:**

*   **Git Workflow**: All code changes MUST be committed and pushed to GitHub repository. All commits MUST be visible in GitHub with proper attribution and commit history.

*   **MCP Server Integration**:
  - GitHub operations MUST be performed using MCP (Model Context Protocol) server for GitHub
  - Context7 MCP server MUST be used for enhanced context and code understanding
  - Better Auth MCP server MUST be used for Better Auth configuration patterns and JWT token management
  - All GitHub-related operations MUST go through MCP servers, not direct git commands
  - Claude Code MUST use MCP servers for all repository operations

*   **Commit Requirements**:
  - All commits MUST have clear, descriptive commit messages
  - Commit messages SHOULD follow conventional commit format: `<type>(<scope>): <description>`
  - Commit types: feat (feature), fix (bug fix), docs (documentation), style (formatting), refactor (code restructuring), test (tests), chore (maintenance)
  - Commits MUST be made through Claude Code using MCP GitHub server
  - Commits MUST show properly in GitHub with author information and timestamps
  - Example: `feat(backend): implement JWT authentication middleware`
  - Example: `fix(frontend): resolve task filtering query parameter issue`
  - Example: `docs(specs): update API endpoint documentation`

*   **Push Requirements**:
  - All commits MUST be pushed to GitHub repository using MCP GitHub server
  - Pushes MUST be done through MCP GitHub server, not direct git push commands
  - Commits MUST be visible in GitHub with proper attribution
  - Commit history MUST be maintained and traceable
  - All changes MUST be pushed to appropriate branch:
    - Full-stack development: Push to `phase_2` branch (frontend + backend + specs + root files)
    - Backend-only deployment: Push to `api.phase_2` branch (backend files only, no frontend, no specs)
    - Stable code: Push to `main` branch after merging

*   **Branch Strategy**:
  - **Main Development Branch** (`phase_2` or `main`): Contains complete monorepo structure:
    - `/frontend` - Next.js frontend application
    - `/backend` - FastAPI backend application
    - `/specs` - All specifications (overview, features, api, database, ui)
    - `/.spec-kit` - Spec-Kit Plus configuration
    - `/CLAUDE.md` - Root-level instructions
    - `/frontend/CLAUDE.md` - Frontend guidelines
    - `/backend/CLAUDE.md` - Backend guidelines
    - `/README.md` - Project documentation
    - `/docker-compose.yml` - Docker configuration
    - All root-level configuration and documentation files
  - **Backend API Deployment Branch** (`api.phase_2`): Contains ONLY backend files for deployment:
    - `/backend` - FastAPI backend application only
    - Backend-specific configuration files
    - NO frontend files
    - NO specs directory
    - NO Spec-Kit configuration
    - This branch is used for backend API deployment to production/staging
  - **Main branch** (`main`): For stable, merged code from development branches
  - **Feature branches**: Create as needed following naming conventions (e.g., `feature/task-filtering`, `fix/jwt-validation`)
  - Branch creation and management MUST be done through MCP GitHub server
  - When deploying backend API, use the backend-only branch (`api.phase_2`)
  - When developing full-stack features, use the complete monorepo branch (`phase_2`)

*   **MCP Server Configuration**:
  - GitHub MCP server MUST be configured and available for all repository operations
  - Context7 MCP server MUST be configured and available for code context
  - Better Auth MCP server MUST be configured and available for authentication patterns
  - Claude Code MUST have access to all MCP servers
  - All git operations (commit, push, pull, branch creation, merge) MUST use MCP GitHub server

*   **Context Management**:
  - Context7 MCP server MUST be used for maintaining code context across sessions
  - Context7 MUST be used for understanding codebase structure and relationships
  - All code analysis and context retrieval MUST go through Context7 MCP server

**Root CLAUDE.md Requirements:**
*   Project overview: Monorepo using GitHub Spec-Kit for spec-driven development
*   Spec-Kit structure: How specifications are organized in /specs
*   Spec referencing: How to use @specs/ notation to reference specifications
*   Project structure: Frontend and backend separation
*   Development workflow: Step-by-step process using Spec-Kit
*   Commands: How to run frontend, backend, and both services
*   Example: "Read spec: @specs/features/task-crud.md, then implement following @backend/CLAUDE.md and @frontend/CLAUDE.md"

*   **GitHub Workflow**: How to use MCP GitHub server for commits, pushes, and branch management
*   **MCP Server Usage**: How to use MCP servers (GitHub, Context7, and Better Auth) for all operations
*   **Better Auth MCP Server**: How to use Better Auth MCP server for authentication patterns and JWT configuration
*   **Commit Practices**: Commit message format and best practices (conventional commits)
*   **Branch Management**: How to create and manage branches using MCP GitHub server
  - Main development branch (`phase_2`): Contains frontend, backend, specs, and all root files
  - Backend deployment branch (`api.phase_2`): Contains ONLY backend files for API deployment
  - How to maintain separate branches for full-stack development vs backend-only deployment
*   **Context Management**: How to use Context7 MCP server for code context and understanding
*   **Docker and CI/CD**:
  - Backend Dockerfile location and configuration
  - Frontend Dockerfile location (if applicable)
  - GitHub Actions workflows location (`.github/workflows/`)
  - How CI/CD pipelines trigger on branch pushes
  - Environment variables and secrets management
*   Example: "Use MCP GitHub server to commit and push changes. All GitHub operations must go through MCP servers. Use Context7 for code context."
*   Example: "Commit format: `feat(backend): implement JWT middleware` then push to `phase_2` for development or `api.phase_2` for backend-only deployment"
*   Example: "For backend deployment, ensure `api.phase_2` branch has only `/backend` directory, no frontend or specs"
*   Example: "Backend CI/CD pipeline runs on `api.phase_2` branch, frontend CI/CD pipeline runs on `phase_2` branch"

**Frontend CLAUDE.md Requirements:**
*   Stack: Next.js 16+ (App Router), TypeScript, Tailwind CSS
*   Patterns: Server components by default, client components for interactivity
*   Component structure: /components for reusable components, /app for pages
*   API client: All backend calls MUST go through /lib/api.ts
*   API client example: `import { api } from '@/lib/api'; const tasks = await api.getTasks(userId)`
*   Styling: Tailwind CSS classes, no inline styles, follow existing patterns
*   File organization: Clear separation between pages, components, and utilities
*   Better Auth: Better Auth MUST be configured with JWT plugin
*   Better Auth MCP Server: Use Better Auth MCP server for authentication patterns and configuration
*   API client: MUST attach JWT token to every request automatically

**Backend CLAUDE.md Requirements:**
*   Stack: FastAPI, SQLModel (ORM), Neon PostgreSQL
*   Project structure: main.py (entry point), models.py (database models), routes/ (API handlers), db.py (database connection)
*   API conventions: All routes under /api/, JSON responses, Pydantic models for validation
*   Database: SQLModel for all operations, DATABASE_URL from environment variable
*   Authentication: JWT verification middleware, user extraction from token
*   Running: `uvicorn main:app --reload --port 8000`
*   Error handling: HTTPException with appropriate status codes
*   JWT Verification: MUST verify JWT token on every API request
*   User Isolation: MUST filter all queries by authenticated user's ID
*   Better Auth Integration: Backend MUST use shared secret (BETTER_AUTH_SECRET) for JWT verification

**Docker Compose (Required):**
*   docker-compose.yml MUST be included for running both frontend and backend services together
*   docker-compose.yml MUST include development and production configurations
*   If included, MUST configure:
  - Frontend service: Next.js development server
  - Backend service: FastAPI with auto-reload
  - Environment variables: DATABASE_URL, BETTER_AUTH_SECRET, etc.
  - Port mappings: Frontend (3000), Backend (8000)
  - Service dependencies: Backend depends on database (if using local PostgreSQL)
  - Volume mounts for hot-reload during development

**Docker Configuration for Deployment:**

*   **Backend Docker**:
  - Backend MUST have a `Dockerfile` in `/backend` directory for containerization
  - Dockerfile MUST be optimized for production deployment
  - Dockerfile MUST include:
    - Python 3.13+ base image
    - UV package manager installation
    - Dependencies installation from pyproject.toml
    - FastAPI application setup
    - Proper port exposure (8000)
    - Health check endpoint configuration
  - Backend Docker image MUST be buildable and runnable independently
  - Backend deployment branch (`api.phase_2`) MUST include Dockerfile and docker-related configuration

*   **Frontend Docker**:
  - Frontend MUST have a `Dockerfile` in `/frontend` directory for containerization
  - Dockerfile MUST be optimized for production deployment
  - Dockerfile MUST include:
    - Node.js base image (appropriate version)
    - Dependencies installation
    - Next.js production build
    - Proper port exposure (3000)
  - Frontend Docker image MUST be buildable and runnable independently

**CI/CD Pipelines:**

*   **GitHub Actions Workflows**:
  - CI/CD pipelines MUST be configured using GitHub Actions
  - Workflows MUST be stored in `.github/workflows/` directory
  - All workflows MUST run on push and pull request events

*   **Backend CI/CD Pipeline**:
  - Backend MUST have a GitHub Actions workflow file (e.g., `.github/workflows/backend-ci-cd.yml`)
  - Backend pipeline MUST include:
    - **CI (Continuous Integration)**:
      - Run on push to `api.phase_2` branch and pull requests
      - Setup Python environment with UV
      - Install dependencies
      - Run linting/formatting checks
      - Run backend tests (pytest)
      - Run type checking (if configured)
      - Validate database migrations
    - **CD (Continuous Deployment)**:
      - Build Docker image for backend
      - Push Docker image to container registry (if configured)
      - Deploy to staging/production environment (if configured)
      - Run health checks after deployment
  - Backend pipeline MUST use environment variables for secrets (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
  - Backend pipeline MUST run only on `api.phase_2` branch for deployment

*   **Frontend CI/CD Pipeline**:
  - Frontend MUST have a GitHub Actions workflow file (e.g., `.github/workflows/frontend-ci-cd.yml`)
  - Frontend pipeline MUST include:
    - **CI (Continuous Integration)**:
      - Run on push to `phase_2` branch and pull requests
      - Setup Node.js environment
      - Install dependencies (npm/pnpm)
      - Run linting/formatting checks
      - Run frontend tests
      - Run type checking (TypeScript)
      - Build production bundle
    - **CD (Continuous Deployment)**:
      - Build Docker image for frontend (if Dockerfile exists)
      - Deploy to hosting platform (Vercel, Netlify, etc. if configured)
      - Run build verification
  - Frontend pipeline MUST use environment variables for secrets (API URLs, etc.)
  - Frontend pipeline MUST run only on `phase_2` branch for deployment

*   **Pipeline Requirements**:
  - All pipelines MUST use GitHub Actions
  - Pipelines MUST be configured in `.github/workflows/` directory
  - Pipelines MUST have proper error handling and notifications
  - Pipelines MUST use GitHub Secrets for sensitive information
  - Pipelines MUST run tests before deployment
  - Pipelines MUST support both development and production environments

## Governance

*   This constitution serves as the ultimate authoritative source for project principles and standards, superseding all other documentation or practices.
*   Amendments to this constitution require explicit documentation, formal approval through the Spec-Kit workflow (including `/sp.specify` and `/sp.plan`), and a clear migration plan if changes introduce backward incompatibilities.
*   All pull requests and code reviews MUST explicitly verify compliance with the principles and standards outlined herein.
*   Any introduction of complexity or deviation from simplicity MUST be rigorously justified and documented.
*   Every AI sub-agent or skill MUST be thoroughly documented within the repository (e.g., in `CLAUDE.md` or a dedicated `agents-and-skills.md` file). They MUST NOT introduce features that conflict with the constitution's established principles unless the constitution is officially updated through the formal amendment process.
*   Phase 1 (CLI) code remains in `/cli_todo_app` directory for reference. Phase 2 (Web) code MUST be in `/frontend` and `/backend` directories. Both phases MUST coexist in the repository during migration. Constitution now applies to Phase 2 web application, not Phase 1 CLI.

*   **Version Control Compliance**: All commits and pushes MUST be made through MCP GitHub server to ensure proper integration and attribution. Direct git commands SHOULD be avoided.
*   **MCP Server Requirement**: All GitHub operations and context management MUST use MCP servers (GitHub MCP server, Context7 MCP server, and Better Auth MCP server). This ensures proper integration, commit attribution, and context management across development sessions.
*   **CI/CD Pipeline Compliance**: All CI/CD pipelines MUST be properly configured and tested. Backend deployment MUST use `api.phase_2` branch, frontend deployment MUST use `phase_2` branch. All deployments MUST go through CI/CD pipelines, not manual deployments.
*   **Phase II Mandatory Requirements**: All Phase II requirements are MANDATORY. No features, endpoints, or configurations are optional. All 5 Basic Level features, all API endpoints, responsive frontend, database, authentication, Docker, CI/CD, and MCP server usage are required.
*   **Better Auth MCP Server Requirement**: Better Auth MCP server MUST be used for all authentication-related patterns and configurations. This ensures consistent authentication implementation across the project.

**Version**: 2.3.0 | **Ratified**: 2025-12-03 | **Last Amended**: 2025-12-08