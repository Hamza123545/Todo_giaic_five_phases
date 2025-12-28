# System Architecture

## Overview

The Todo Full-Stack Web Application uses a modern multi-tier architecture with AI integration:
1. **Frontend** - Next.js 16+ App Router with TypeScript + ChatKit Widget
2. **Backend** - FastAPI RESTful API with Python + AI Agent + MCP Server
3. **Database** - Neon Serverless PostgreSQL + SQLite (conversation memory)
4. **AI Layer** - OpenAI Agents SDK + MCP Protocol + OpenAI/Gemini LLMs

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           Next.js 16+ Frontend Application                 │ │
│  │                                                              │ │
│  │  - App Router (Server & Client Components)                 │ │
│  │  - Better Auth (Authentication)                            │ │
│  │  - JWT Token Management                                    │ │
│  │  - Tailwind CSS Styling                                    │ │
│  │  - shadcn/ui Components                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                 │
                     HTTP/HTTPS │ REST API Calls
                      (JWT Token in Authorization Header)
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                  │
        │  ┌────────────────────────────────────────┐     │
        │  │ Better Auth API Routes                 │     │
        │  │ - /api/auth/signup                     │     │
        │  │ - /api/auth/signin                     │     │
        │  │ - /api/auth/signout                    │     │
        │  │ - /.well-known/jwks.json (Public Keys) │     │
        │  └────────────────────────────────────────┘     │
        │                │                                 │
        │                │ JWT Token Generation            │
        │                │ (RS256 Algorithm)               │
        │                ▼                                 │
        │  ┌────────────────────────────────────────┐     │
        │  │     Neon PostgreSQL Database           │     │
        │  │                                         │     │
        │  │  Better Auth Tables (via Drizzle):     │     │
        │  │  - users                                │     │
        │  │  - sessions                             │     │
        │  │  - jwks (public/private keys)           │     │
        │  │  - verifications                        │     │
        │  └────────────────────────────────────────┘     │
        │                                                  │
        └──────────────────────────────────────────────────┘
                                 │
                     HTTP/HTTPS │ Task API Calls
                      (JWT Token Required)
                                 │
        ┌────────────────────────┴────────────────────────┐
        │                                                  │
        │  ┌────────────────────────────────────────┐     │
        │  │    FastAPI Backend Application         │     │
        │  │                                         │     │
        │  │  ┌──────────────────────────────────┐  │     │
        │  │  │ JWT Verification Middleware      │  │     │
        │  │  │ - Fetch JWKS from Better Auth    │  │     │
        │  │  │ - Verify token signature (RS256) │  │     │
        │  │  │ - Extract user_id from token     │  │     │
        │  │  └──────────────────────────────────┘  │     │
        │  │                │                        │     │
        │  │  ┌─────────────┴──────────────────┐    │     │
        │  │  │ API Routes (/api/{user_id}/)   │    │     │
        │  │  │ - GET /tasks                   │    │     │
        │  │  │ - POST /tasks                  │    │     │
        │  │  │ - GET /tasks/{id}              │    │     │
        │  │  │ - PUT /tasks/{id}              │    │     │
        │  │  │ - DELETE /tasks/{id}           │    │     │
        │  │  │ - PATCH /tasks/{id}/complete   │    │     │
        │  │  └────────────────────────────────┘    │     │
        │  │                │                        │     │
        │  │  ┌─────────────┴──────────────────┐    │     │
        │  │  │ Service Layer                  │    │     │
        │  │  │ - TaskService (business logic) │    │     │
        │  │  │ - ExportImportService          │    │     │
        │  │  │ - User isolation enforcement   │    │     │
        │  │  └────────────────────────────────┘    │     │
        │  │                │                        │     │
        │  │  ┌─────────────┴──────────────────┐    │     │
        │  │  │ SQLModel ORM                   │    │     │
        │  │  │ - Database queries             │    │     │
        │  │  │ - User_id filtering            │    │     │
        │  │  └────────────────────────────────┘    │     │
        │  └────────────────────────────────────────┘     │
        │                │                                 │
        │                ▼                                 │
        │  ┌────────────────────────────────────────┐     │
        │  │     Neon PostgreSQL Database           │     │
        │  │                                         │     │
        │  │  Application Tables (via SQLModel):    │     │
        │  │  - tasks (user_id, title, etc.)        │     │
        │  └────────────────────────────────────────┘     │
        │                                                  │
        └──────────────────────────────────────────────────┘
```

## Frontend Architecture (Next.js 16+ App Router)

### Component Hierarchy

```
app/
├── layout.tsx                    # Root layout (Server Component)
│   ├── Providers                 # Client Component wrapper
│   │   ├── ThemeProvider         # Dark mode
│   │   ├── SessionProvider       # Better Auth session
│   │   └── ToastProvider         # Toast notifications
│   └── Navigation                # Header/footer
│
├── (auth)/                       # Auth route group
│   ├── signin/
│   │   └── page.tsx              # Sign-in page (Client Component)
│   └── signup/
│       └── page.tsx              # Sign-up page (Client Component)
│
├── dashboard/                    # Protected routes
│   ├── layout.tsx                # Dashboard layout
│   └── page.tsx                  # Dashboard page (Server Component)
│       ├── TaskFilters           # Client Component
│       ├── TaskList              # Client Component
│       │   └── TaskItem          # Client Component
│       ├── TaskForm              # Client Component
│       ├── BulkActions           # Client Component
│       └── Statistics            # Server Component
│
├── chat/                         # NEW: AI Chat interface (Phase III)
│   └── page.tsx                  # Chat page with ChatKit widget
│       └── ChatKitWidget         # Client Component (ChatKit integration)
│
└── api/                          # API routes
    └── auth/
        └── [...all]/route.ts     # Better Auth handler
```

### Server vs Client Components

**Server Components** (default):
- Better performance (no JavaScript sent to client)
- Direct database/API access
- SEO-friendly
- Examples: Layouts, static pages, dashboard statistics

**Client Components** (`'use client'` directive):
- Interactivity (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser APIs (localStorage, etc.)
- Examples: Forms, task list, filters, modals

### State Management

1. **Server State** (Task data):
   - Fetched via API client (`/lib/api.ts`)
   - Cached by React Server Components
   - Revalidated on demand

2. **Client State** (UI state):
   - React useState for component-level state
   - React useReducer for complex state (undo/redo)
   - React Context for global state (theme, user session)

3. **Form State**:
   - Controlled components with useState
   - Form validation with Zod schemas
   - Optimistic updates with rollback on error

## Backend Architecture (FastAPI)

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                         │
│  - HTTP request handling                                    │
│  - Request validation (Pydantic)                            │
│  - Response formatting                                      │
│  - JWT verification (middleware dependency)                 │
│  - User isolation verification                              │
│                                                              │
│  Files: routes/tasks.py, routes/auth.py                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  - Business logic                                           │
│  - Data transformation                                      │
│  - User isolation enforcement                               │
│  - Export/import operations                                 │
│                                                              │
│  Files: services/task_service.py,                           │
│         services/export_import_service.py                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  - SQLModel ORM queries                                     │
│  - Database session management                              │
│  - User-scoped filtering                                    │
│  - Transaction handling                                     │
│                                                              │
│  Files: db.py (session), models.py (schema)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               Neon PostgreSQL Database                      │
│  - Task storage (tasks table)                               │
│  - Indexes on user_id, completed, priority, due_date        │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Client Request** → API endpoint (e.g., `GET /api/{user_id}/tasks`)
2. **JWT Middleware** → Verify token, extract user_id
3. **Route Handler** → Validate user_id matches token
4. **Service Layer** → Apply business logic and user filtering
5. **Data Layer** → Execute database query with user_id filter
6. **Response** → Format and return JSON response

## Database Architecture (Neon Serverless PostgreSQL)

### Shared Database Usage

The Neon PostgreSQL database is **shared** between:
1. **Better Auth (Frontend)** - Manages authentication tables via Drizzle ORM
2. **FastAPI (Backend)** - Manages application tables via SQLModel/Alembic

This is safe because:
- Better Auth uses table prefix `better_auth_*` or dedicated schema
- FastAPI uses separate tables (`tasks`, optionally `users`)
- No table name conflicts
- Both systems coexist in the same database instance

### Database Tables

```sql
-- Better Auth Tables (managed by Drizzle ORM)
CREATE TABLE users (
    id TEXT PRIMARY KEY,                 -- UUID as string
    email TEXT UNIQUE NOT NULL,
    emailVerified BOOLEAN DEFAULT false,
    name TEXT,
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    userId TEXT REFERENCES users(id),
    expiresAt TIMESTAMP NOT NULL,
    token TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT
);

CREATE TABLE jwks (
    id TEXT PRIMARY KEY,
    publicKey TEXT NOT NULL,
    privateKey TEXT NOT NULL,
    createdAt TIMESTAMP NOT NULL
);

-- Application Tables (managed by SQLModel/Alembic)
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,               -- Better Auth user ID
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    due_date TIMESTAMP,
    tags JSONB,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

## Authentication Flow (Better Auth + JWT)

### Signup Flow

```
1. User enters email/password on /signup
   ↓
2. Frontend calls Better Auth: POST /api/auth/signup
   ↓
3. Better Auth:
   - Hashes password (bcrypt)
   - Creates user record in database
   - Creates session
   - Issues JWT token (RS256)
   - Stores public/private key pair in jwks table
   ↓
4. Frontend receives JWT token
   ↓
5. Frontend stores token in httpOnly cookie
   ↓
6. Redirect to /dashboard
```

### Signin Flow

```
1. User enters email/password on /signin
   ↓
2. Frontend calls Better Auth: POST /api/auth/signin
   ↓
3. Better Auth:
   - Verifies email exists
   - Verifies password hash matches
   - Creates/updates session
   - Issues JWT token (RS256, signed with private key)
   ↓
4. Frontend receives JWT token
   ↓
5. Frontend stores token in httpOnly cookie
   ↓
6. Redirect to /dashboard
```

### JWKS Flow (Public Key Distribution)

```
1. Better Auth generates RSA key pair on first JWT issuance
   ↓
2. Private key: Used to sign JWT tokens (kept secret)
   ↓
3. Public key: Exposed at /.well-known/jwks.json endpoint
   ↓
4. Backend fetches public key from JWKS endpoint
   ↓
5. Backend caches public key (with TTL)
   ↓
6. Backend uses public key to verify JWT signatures
   ↓
7. If key changes, backend re-fetches from JWKS endpoint
```

### API Request with JWT

```
1. User makes API request from dashboard
   ↓
2. Frontend API client (/lib/api.ts):
   - Retrieves JWT token from Better Auth session
   - Adds token to Authorization header: "Bearer {token}"
   ↓
3. Backend receives request
   ↓
4. JWT Verification Middleware:
   - Extracts token from Authorization header
   - Fetches public key from JWKS endpoint (or cache)
   - Verifies token signature using public key (RS256)
   - Verifies token expiration
   - Extracts user_id from token payload
   ↓
5. Route Handler:
   - Receives user_id from middleware
   - Compares user_id from JWT with user_id in URL path
   - Raises 403 Forbidden if mismatch
   ↓
6. Service Layer:
   - Enforces user isolation in database queries
   - Filters all queries by user_id
   ↓
7. Response returned to client
```

## API Communication Flow

### Example: Fetching Tasks

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User navigates to /dashboard
       │
       ▼
┌─────────────────────┐
│  Next.js Frontend   │
│  (Server Component) │
└──────┬──────────────┘
       │
       │ 2. Fetch tasks from API
       │    GET /api/{user_id}/tasks?status=pending&sort=created:desc
       │    Authorization: Bearer {jwt_token}
       │
       ▼
┌─────────────────────┐
│  FastAPI Backend    │
│  (JWT Middleware)   │
└──────┬──────────────┘
       │
       │ 3. Verify JWT token
       │    - Fetch JWKS public key
       │    - Verify signature (RS256)
       │    - Extract user_id from token
       │
       ▼
┌─────────────────────┐
│  Route Handler      │
│  (User Verification)│
└──────┬──────────────┘
       │
       │ 4. Verify user_id matches JWT
       │    - Compare URL user_id with token user_id
       │    - Raise 403 if mismatch
       │
       ▼
┌─────────────────────┐
│  TaskService        │
│  (Business Logic)   │
└──────┬──────────────┘
       │
       │ 5. Apply filtering and sorting
       │    - Filter by status=pending
       │    - Filter by user_id (from JWT)
       │    - Sort by created:desc
       │
       ▼
┌─────────────────────┐
│  Database (Neon)    │
└──────┬──────────────┘
       │
       │ 6. Execute query
       │    SELECT * FROM tasks
       │    WHERE user_id = '{user_id}' AND completed = false
       │    ORDER BY created_at DESC
       │
       ▼
┌─────────────────────┐
│  Response           │
│  {                  │
│    success: true,   │
│    data: {          │
│      items: [...],  │
│      total: 42,     │
│      page: 1        │
│    }                │
│  }                  │
└─────────────────────┘
```

## Phase III: AI Architecture (Conversational Interface)

### AI System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER (Browser)                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         ChatKit Widget (@openai/chatkit-react)             │ │
│  │  - Message input and display                               │ │
│  │  - Real-time streaming response rendering                  │ │
│  │  - Conversation history UI                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              POST /api/chatkit (Server-Sent Events)
              Authorization: Bearer {jwt_token}
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ChatKit Endpoint (routers/chatkit.py)                     │ │
│  │  - Receives user messages                                  │ │
│  │  - Streams responses via SSE                               │ │
│  │  - JWT authentication                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ChatKit Server (services/chatkit_server.py)               │ │
│  │  - SQLiteSession management                                │ │
│  │  - User+thread session isolation                           │ │
│  │  - Automatic conversation history retrieval                │ │
│  │  - MCP server lifecycle management                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  TodoAgent (agent_config/todo_agent.py)                    │ │
│  │  - OpenAI Agents SDK Agent                                 │ │
│  │  - MCPServerStdio connection                               │ │
│  │  - System instructions for task management                 │ │
│  │  - Runner.run_streamed() for token streaming               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            │ Model Factory                       │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  AI Provider (OpenAI / Gemini via LiteLLM)                 │ │
│  │  - gpt-4o (OpenAI)                                         │ │
│  │  - gemini-2.0-flash (Gemini via LiteLLM)                  │ │
│  │  - Configurable via LLM_PROVIDER env variable              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                    stdio transport                              │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  MCP Server (mcp_server/tools.py)                          │ │
│  │  - FastMCP SDK with @mcp.tool() decorators                 │ │
│  │  - Separate process: python -m mcp_server                  │ │
│  │  - 5 tools:                                                │ │
│  │    1. add_task(user_id, title, description)                │ │
│  │    2. list_tasks(user_id, status)                          │ │
│  │    3. complete_task(user_id, task_id)                      │ │
│  │    4. delete_task(user_id, task_id)                        │ │
│  │    5. update_task(user_id, task_id, title, description)    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Task Service (services/task_service.py)                   │ │
│  │  - Shared business logic                                   │ │
│  │  - Used by both MCP tools and REST endpoints               │ │
│  │  - User isolation enforcement                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │
           ┌──────────────────┴──────────────────┐
           │                                      │
           ▼                                      ▼
┌─────────────────────────┐      ┌──────────────────────────────┐
│  SQLite Database        │      │ Neon PostgreSQL Database      │
│  (chat_sessions.db)     │      │ - tasks table                 │
│  - SQLiteSession store  │      │ - conversations table (alt)   │
│  - Automatic memory     │      │ - messages table (alt)        │
│  - Per user+thread      │      │ - User isolation              │
└─────────────────────────┘      └──────────────────────────────┘
```

### MCP Server Architecture

**Location**: `backend/mcp_server/` (renamed from `mcp/` to avoid package shadowing with installed `mcp` package)

**Key Components**:
1. **`__init__.py`** - Module initialization
2. **`__main__.py`** - Entry point for running as module: `python -m mcp_server`
3. **`tools.py`** - MCP tools implementation using FastMCP

**MCP Tool Pattern**:
```python
from mcp.server.fastmcp import FastMCP

# Create MCP server instance
mcp = FastMCP("task-management-server")

@mcp.tool()
def add_task(user_id: str, title: str, description: Optional[str] = None) -> dict:
    """Create a new task for a user."""
    session = next(get_session())
    try:
        task = TaskService.create_task(session, user_id, title, description)
        return {"task_id": task.id, "status": "created", "title": task.title}
    finally:
        session.close()
```

**Lifecycle Management**:
- Agent wraps execution in async context manager: `async with mcp_server:`
- MCPServerStdio handles process spawning and stdio communication
- Automatic start on context entry, stop on context exit

### Conversation Memory Architecture

**Dual Persistence Strategy**:

1. **ChatKit Endpoint** (`/api/chatkit`):
   - Uses **SQLiteSession** from OpenAI Agents SDK
   - Automatic conversation history management
   - Session ID format: `user_{user_id}_thread_{thread.id}`
   - Stored in `chat_sessions.db` (SQLite database)
   - Survives server restarts
   - No manual history management required

2. **Direct REST Endpoint** (`/api/{user_id}/chat`) - Alternative:
   - Uses **PostgreSQL database** with Conversation and Message models
   - Manual conversation history management
   - Stateless server architecture
   - Full control over conversation data

**Session Isolation**:
```python
# Each user+thread gets unique session
session_id = f"user_{user_id}_thread_{thread.id}"
session = SQLiteSession(session_id, "chat_sessions.db")

# Session automatically:
# 1. Retrieves conversation history
# 2. Appends new message
# 3. Stores updated conversation
```

### AI Agent Request Flow

```
1. User sends message → ChatKit Widget
   Message: "Add a task to buy groceries"

2. ChatKit Widget → Backend
   POST /api/chatkit
   Authorization: Bearer {jwt_token}
   {thread_id, user_message}

3. JWT Middleware → Verify token, extract user_id

4. ChatKit Server → Create/load SQLiteSession
   session_id = f"user_{user_id}_thread_{thread.id}"
   session = SQLiteSession(session_id, "chat_sessions.db")

   # Add system message with user context (first message only)
   if not history:
       system_msg = {"role": "system", "content": f"User's name is {user_name}"}
       await session.add_items([system_msg])

5. Extract user message string → Pass to Agent

6. Agent lifecycle management:
   async with mcp_server:  # Connect to MCP server
       result = Runner.run_streamed(agent, user_message, session=session)

7. MCP Server receives tool call → Execute add_task
   add_task(user_id, title="Buy groceries", description=None)

8. Task Service → Database
   TaskService.create_task(session, user_id, task_data)

9. Tool returns result → Agent processes

10. Agent streams response → ChatKit Server → ChatKit Widget
    SSE stream: "data: {content: 'I'}\n\ndata: {content: "'ve"}\n\n..."

11. SQLiteSession auto-saves conversation for next turn
```

### Streaming Response Architecture

**Server-Sent Events (SSE)**:
- Content-Type: `text/event-stream`
- Token-by-token streaming via `Runner.run_streamed()`
- Format: `data: {json}\n\n`
- Completion marker: `data: [DONE]\n\n`

**Benefits**:
- Real-time response display (< 2 second first token)
- Native browser support via EventSource API
- One-way server-to-client (perfect for AI streaming)
- Auto-reconnect on connection loss

## Security Architecture

### User Isolation

**At Database Level**:
- All queries MUST include `WHERE user_id = '{authenticated_user_id}'`
- Enforced in service layer
- No user can access another user's data

**At API Level**:
- JWT token MUST be present in Authorization header
- User ID from JWT MUST match user_id in URL path
- Middleware verifies token on every request

**At Middleware Level**:
- JWKS verification ensures token is valid
- RS256 algorithm prevents token forgery
- Token expiration enforced (7-day default)

### Shared Secret

**BETTER_AUTH_SECRET**:
- Used by Better Auth to derive keys
- MUST be the same in both frontend and backend `.env` files
- Used for:
  - Frontend: Better Auth key derivation
  - Backend: JWKS public key fetching and caching
- **Critical**: If secret changes, delete old keys from `jwks` table

### HTTPS in Production

- All communication MUST use HTTPS in production
- Better Auth requires HTTPS for secure cookies
- JWT tokens transmitted over HTTPS only
- CORS configured to allow only trusted origins

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Production Environment                    │
│                                                                │
│  ┌────────────────────┐         ┌──────────────────────────┐ │
│  │  Vercel (Frontend) │         │  Render/Railway (Backend)│ │
│  │                    │         │                          │ │
│  │  - Next.js build   │         │  - FastAPI Docker       │ │
│  │  - Better Auth     │         │  - JWT verification     │ │
│  │  - Static assets   │         │  - Gunicorn workers     │ │
│  │  - Edge functions  │         │  - Health checks        │ │
│  └──────────┬─────────┘         └──────────┬───────────────┘ │
│             │                               │                 │
│             │                               │                 │
│             └───────────┬───────────────────┘                 │
│                         │                                     │
│                         ▼                                     │
│           ┌─────────────────────────────┐                     │
│           │  Neon PostgreSQL (Shared)  │                     │
│           │                             │                     │
│           │  - Better Auth tables       │                     │
│           │  - Application tables       │                     │
│           │  - Automated backups        │                     │
│           │  - Connection pooling       │                     │
│           └─────────────────────────────┘                     │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### CI/CD Pipelines

**Backend CI/CD** (`.github/workflows/backend-ci-cd.yml`):
- Triggers on: Push to `api.phase_2` branch
- Steps: Lint → Test → Build Docker → Deploy to render.com
- Environment: Backend-only (no frontend files)

**Frontend CI/CD** (`.github/workflows/frontend-ci-cd.yml`):
- Triggers on: Push to `phase_2` branch
- Steps: Lint → Type check → Test → Build → Deploy to Vercel
- Environment: Full-stack (all files)

## Performance Considerations

### Frontend Optimization

- **Server Components**: Reduce JavaScript bundle size
- **Code Splitting**: Lazy load client components
- **Image Optimization**: Next.js Image component
- **Caching**: React Server Component caching
- **Prefetching**: Next.js Link prefetching

### Backend Optimization

- **Database Indexes**: On user_id, completed, priority, due_date
- **Connection Pooling**: Neon serverless pooling
- **Query Optimization**: Proper filtering and pagination
- **Response Caching**: Cache JWKS public keys (TTL: 1 hour)

### Database Optimization

- **Indexes**: Cover frequently queried columns
- **Pagination**: Limit large result sets
- **Query Efficiency**: Use SQLModel select queries efficiently
- **Connection Pooling**: Neon's built-in pooling

## Scalability

- **Frontend**: Serverless (Vercel Edge) scales automatically
- **Backend**: Horizontal scaling with multiple FastAPI instances
- **Database**: Neon autoscaling based on load
- **Stateless**: JWT tokens enable stateless authentication
- **Load Balancing**: Vercel/Render handle load balancing

## Related Specifications

- **`@specs/features/task-crud.md`** - Task management feature details
- **`@specs/features/authentication.md`** - Authentication implementation details
- **`@specs/api/rest-endpoints.md`** - Complete API endpoint documentation
- **`@specs/database/schema.md`** - Database schema details
- **`@specs/ui/components.md`** - Frontend component structure
- **`@specs/ui/pages.md`** - Frontend routing structure
