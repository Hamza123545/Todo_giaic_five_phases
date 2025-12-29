# Phase II Todo Full-Stack Web Application - Claude Code Guide

## Project Overview

This is **Phase II** of the Todo Full-Stack Web Application - a modern, production-ready todo management system built with Next.js 16+ frontend and FastAPI backend, using Neon Serverless PostgreSQL as the database.

### Current Phase: Phase II - Full-Stack Web Application

**Status**: ✅ Complete - All Phase II requirements implemented

**Features Implemented**:
- ✅ Multi-user authentication with Better Auth and JWT tokens
- ✅ Task CRUD operations with user isolation
- ✅ Advanced filtering, sorting, and search capabilities
- ✅ Export/import functionality (CSV, JSON, PDF)
- ✅ Responsive frontend with dark mode
- ✅ Real-time updates and offline support (PWA)
- ✅ Drag-and-drop task reordering
- ✅ Bulk operations and undo/redo functionality
- ✅ Task statistics dashboard
- ✅ Keyboard shortcuts and accessibility features

## Spec-Kit Plus Structure

This project uses **Spec-Kit Plus** for spec-driven development. All specifications are organized in the `/specs` directory following a structured hierarchy.

### Directory Structure

```
phase-2/
├── .spec-kit/
│   └── config.yaml                # Spec-Kit configuration
├── specs/                         # All specifications
│   ├── overview.md                # Project overview and current status
│   ├── architecture.md            # System architecture documentation
│   ├── features/                  # Feature specifications
│   │   ├── task-crud.md           # Task CRUD feature spec
│   │   └── authentication.md      # Authentication feature spec
│   ├── api/                       # API specifications
│   │   └── rest-endpoints.md      # REST API endpoint documentation
│   ├── database/                  # Database specifications
│   │   └── schema.md              # Database schema and models
│   └── ui/                        # UI specifications
│       ├── components.md          # React component documentation
│       └── pages.md               # Next.js pages documentation
├── frontend/                      # Next.js 16+ frontend application
│   ├── CLAUDE.md                  # Frontend-specific development guidelines
│   ├── app/                       # Next.js App Router pages
│   ├── components/                # Reusable React components
│   └── lib/                       # Utility libraries and API client
├── backend/                       # FastAPI backend application
│   ├── CLAUDE.md                  # Backend-specific development guidelines
│   ├── main.py                    # FastAPI application entry point
│   ├── models.py                  # SQLModel database models
│   ├── routes/                    # API route handlers
│   ├── services/                  # Business logic layer
│   └── middleware/                # Custom middleware (JWT, CORS, etc.)
├── CLAUDE.md                      # This file - root-level instructions
├── docker-compose.yml             # Docker Compose configuration
└── README.md                      # Project documentation
```

## Referencing Specifications

When working with specifications, use the `@specs/` notation to reference spec files:

### Available Specifications

- **`@specs/overview.md`** - Project overview, tech stack, and current status
- **`@specs/architecture.md`** - System architecture, authentication flow, API communication
- **`@specs/features/task-crud.md`** - Task CRUD operations specification
- **`@specs/features/authentication.md`** - Authentication and JWT flow specification
- **`@specs/api/rest-endpoints.md`** - All REST API endpoints documentation
- **`@specs/database/schema.md`** - Database schema, tables, and relationships
- **`@specs/ui/components.md`** - React component library documentation
- **`@specs/ui/pages.md`** - Next.js pages and routing documentation

### Example: Reading Specifications

```
# When implementing a new task feature:
1. Read @specs/features/task-crud.md for requirements
2. Read @specs/api/rest-endpoints.md for API contract
3. Read @specs/database/schema.md for data model
4. Read @specs/ui/components.md for UI components

# When implementing authentication:
1. Read @specs/features/authentication.md for auth flow
2. Read @specs/api/rest-endpoints.md for auth endpoints
3. Follow @frontend/CLAUDE.md for Better Auth integration
4. Follow @backend/CLAUDE.md for JWT verification
```

## Development Workflow

### Step-by-Step Implementation Process

1. **Read Relevant Specifications**
   - Always start by reading the related spec files
   - Use `@specs/` notation to reference specifications
   - Understand requirements before coding

2. **Backend Implementation**
   - Follow `@backend/CLAUDE.md` for backend patterns
   - Use FastAPI with SQLModel for database operations
   - Implement JWT verification on all protected endpoints
   - Enforce user isolation at database query level

3. **Frontend Implementation**
   - Follow `@frontend/CLAUDE.md` for frontend patterns
   - Use Next.js 16+ App Router with TypeScript
   - Use centralized API client at `/lib/api.ts`
   - Implement Better Auth for authentication

4. **Testing**
   - Backend: `cd backend && uv run pytest`
   - Frontend: `cd frontend && pnpm test`

5. **Commit Changes**
   - Use MCP GitHub server for all git operations
   - Follow conventional commit format: `feat(scope): description`
   - Push to appropriate branch (`phase_2` for full-stack, `api.phase_2` for backend-only)

6. **Update Specifications**
   - If requirements change, update spec files first
   - Never make ad-hoc changes without updating specs
   - Keep specs in sync with implementation

## Project Structure

### Frontend Structure

**Location**: `/frontend`

**Key Directories**:
- `/app` - Next.js App Router pages and layouts (Server Components by default)
- `/components` - Reusable UI components (Client Components when needed)
- `/lib/api.ts` - Centralized API client with JWT token management
- `/lib/auth-server.ts` - Better Auth configuration
- `/lib/db-drizzle.ts` - Drizzle ORM configuration (used by Better Auth)

**Development Guidelines**: See `@frontend/CLAUDE.md`

### Backend Structure

**Location**: `/backend`

**Key Directories**:
- `main.py` - FastAPI application entry point
- `models.py` - SQLModel database models (User, Task)
- `/routes` - API route handlers (tasks.py, auth.py)
- `/services` - Business logic layer (task_service.py, export_import_service.py)
- `/middleware` - Custom middleware (JWT verification, CORS, error handling)
- `/schemas` - Pydantic models for request/response validation

**Development Guidelines**: See `@backend/CLAUDE.md`

## Running the Application

### Development Mode

**Start Both Services** (using Docker Compose - recommended):
```bash
# From project root
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

**Start Services Separately**:

```bash
# Terminal 1 - Backend
cd backend
uv sync --extra dev
export DATABASE_URL="postgresql://..."
export BETTER_AUTH_SECRET="your-secret"
uv run uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
pnpm install
pnpm run dev
# Opens at http://localhost:3000
```

### Production Build

```bash
# Build backend Docker image
cd backend
docker build -t todo-backend .

# Build frontend
cd frontend
pnpm run build
pnpm run start
```

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
BETTER_AUTH_SECRET=your-secret-key-here
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
```

**Important**: Both frontend and backend MUST use the same `BETTER_AUTH_SECRET` for JWT token verification to work correctly.

## Key Technologies

### Frontend Stack
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript 5+ (Strict mode)
- **Styling**: Tailwind CSS 4
- **Authentication**: Better Auth with JWT plugin
- **UI Components**: shadcn/ui
- **State Management**: React hooks (useState, useReducer, useContext)
- **Data Fetching**: Custom API client with fetch

### Backend Stack
- **Framework**: FastAPI
- **ORM**: SQLModel (combines SQLAlchemy and Pydantic)
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: JWT with Better Auth shared secret
- **Migrations**: Alembic
- **Testing**: pytest with httpx
- **Package Manager**: UV

### Database
- **Primary Database**: Neon Serverless PostgreSQL
- **Better Auth Tables**: Managed by Better Auth via Drizzle ORM
- **Application Tables**: Managed by SQLModel/Alembic migrations
- **Shared Database**: Both frontend (Better Auth) and backend (FastAPI) use the same Neon database

## MCP Servers

All operations MUST use MCP (Model Context Protocol) servers:

1. **GitHub MCP Server**
   - Used for: All git operations (commit, push, pull, branch management)
   - Replace: Direct `git` commands
   - Example: Use MCP GitHub server to commit and push changes

2. **Context7 MCP Server**
   - Used for: Code context, codebase understanding, maintaining context across sessions
   - Replace: Manual code exploration
   - Example: Use Context7 to understand codebase structure

3. **Better Auth MCP Server**
   - Used for: Better Auth configuration patterns, JWT token management patterns
   - Replace: Manual Better Auth configuration
   - Example: Use Better Auth MCP server for authentication best practices

**Important**: All git operations, code context retrieval, and authentication patterns MUST go through MCP servers, not direct commands.

## Commit and Push Workflow

### Using MCP GitHub Server (Required)

All commits and pushes MUST be done through the MCP GitHub server:

```
# Conventional Commit Format
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Examples:
  - feat(backend): implement JWT authentication middleware
  - fix(frontend): resolve task filtering query parameter issue
  - docs(specs): update API endpoint documentation
```

### Branch Strategy

- **`phase_2`** (Main Development Branch):
  - Contains: `/frontend`, `/backend`, `/specs`, `/.spec-kit`, root files
  - Use for: Full-stack development work
  - Push: All monorepo changes (frontend + backend + specs)

- **`api.phase_2`** (Backend Deployment Branch):
  - Contains: `/backend` directory only
  - Use for: Backend API deployment to production/staging
  - Push: Backend files only (NO frontend, NO specs)

- **`main`** (Stable Branch):
  - Contains: Stable, merged code
  - Use for: Production releases

## Implementation Best Practices

### 1. Spec-Driven Development
- Always read relevant specs before implementing features
- Update specs if requirements change
- Never make ad-hoc changes without updating specifications
- Use Spec-Kit Plus commands: `/sp.specify`, `/sp.plan`, `/sp.tasks`, `/sp.implement`

### 2. User Isolation
- All database queries MUST filter by authenticated user's ID
- JWT token verification required on all protected endpoints
- User ID from JWT must match user_id in URL path
- Never allow users to access other users' data

### 3. Type Safety
- Use TypeScript strict mode on frontend
- Use type hints on all backend functions
- Use Pydantic models for API request/response validation
- Use SQLModel for database operations with proper typing

### 4. Error Handling
- Return appropriate HTTP status codes (200, 201, 400, 401, 404, 500)
- Provide clear, user-friendly error messages
- Use HTTPException in backend for API errors
- Handle errors gracefully in frontend with toast notifications

### 5. Testing
- Write tests for all new features (backend and frontend)
- Backend: API integration tests with pytest
- Frontend: Component tests with Jest and React Testing Library
- Verify JWT authentication and user isolation in tests

## CI/CD Pipelines

### Backend CI/CD (`.github/workflows/backend-ci-cd.yml`)
- Runs on: `api.phase_2` branch
- Steps: Linting, testing, Docker build, deployment
- Environment: Backend-only (no frontend)

### Frontend CI/CD (`.github/workflows/frontend-ci-cd.yml`)
- Runs on: `phase_2` branch
- Steps: Linting, type checking, testing, build, deployment
- Environment: Full-stack (frontend + backend)

## Next Steps for New Features

When implementing new features:

1. **Read Specifications**:
   ```
   @specs/features/[feature-name].md
   @specs/api/rest-endpoints.md
   @specs/database/schema.md
   @specs/ui/components.md or @specs/ui/pages.md
   ```

2. **Follow Development Guidelines**:
   ```
   @backend/CLAUDE.md (for backend implementation)
   @frontend/CLAUDE.md (for frontend implementation)
   ```

3. **Implement with Best Practices**:
   - User isolation enforcement
   - JWT verification
   - Type safety
   - Error handling
   - Testing

4. **Update Specifications**:
   - If requirements change during implementation
   - Keep specs synchronized with code

5. **Commit and Push**:
   - Use MCP GitHub server
   - Follow conventional commit format
   - Push to appropriate branch

## Important Notes

### Shared BETTER_AUTH_SECRET
Both frontend and backend MUST use the same `BETTER_AUTH_SECRET` environment variable. This shared secret is used for:
- Frontend: Better Auth to sign JWT tokens
- Backend: JWT verification middleware to verify tokens
- If secrets don't match, authentication will fail

### Database Shared Usage
The Neon PostgreSQL database is shared between:
- **Better Auth (Frontend)**: Manages authentication tables (users, sessions, etc.) via Drizzle ORM
- **FastAPI (Backend)**: Manages application tables (tasks) via SQLModel/Alembic

Both systems can coexist in the same database because:
- Better Auth creates its own tables with `better_auth_*` prefix
- FastAPI creates application tables (tasks, users)
- No table name conflicts

### User ID Format
- Better Auth uses **string UUIDs** for user IDs (e.g., `"123e4567-e89b-12d3-a456-426614174000"`)
- Backend MUST use `str` type for user_id, not `UUID` type
- All user_id comparisons and filtering use string values

## Getting Help

- **Backend Questions**: See `@backend/CLAUDE.md`
- **Frontend Questions**: See `@frontend/CLAUDE.md`
- **Architecture Questions**: See `@specs/architecture.md`
- **API Questions**: See `@specs/api/rest-endpoints.md`
- **Database Questions**: See `@specs/database/schema.md`

## Constitution

All development MUST follow the principles defined in `.specify/memory/constitution.md`. This includes:
- Phase II Mandatory Requirements
- User isolation and security
- Type safety and testing
- MCP server usage
- Spec-driven development workflow
