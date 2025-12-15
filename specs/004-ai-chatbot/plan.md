# Implementation Plan: AI-Powered Todo Chatbot

**Branch**: `004-ai-chatbot` | **Date**: 2025-12-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-chatbot/spec.md`

**Note**: This plan implements Phase 3 of the Full-Stack Web Todo Application, adding conversational AI interface for natural language task management.

## Summary

Add AI-powered conversational interface to the existing Phase 2 Todo application, enabling users to manage tasks through natural language dialogue instead of traditional UI interactions. The system leverages **OpenAI ChatKit** for the frontend chat widget, **OpenAI Agents SDK** for AI orchestration, and **Official MCP SDK** for tool-based task operations. The architecture maintains **stateless server design** with all conversation state persisted to PostgreSQL database, supporting horizontal scaling and resilience. Responses stream in real-time via **Server-Sent Events (SSE)** for responsive user experience. The implementation extracts existing task business logic into a **shared service layer** reused by both MCP tools and REST endpoints, ensuring consistency across interfaces.

**Key Features**: All 5 core task operations (add, list, complete, delete, update) accessible through natural language, conversation history persistence, context maintenance across sessions, streaming responses, JWT authentication, and user isolation.

## Technical Context

**Language/Version**: Python 3.13+ (backend), TypeScript/Node.js 22+ (frontend)

**Primary Dependencies**:
- **Backend**: FastAPI, SQLModel, OpenAI Agents SDK (>=0.1.0), Official MCP SDK (>=1.0.0), Alembic
- **Frontend**: Next.js 16, @openai/chatkit (>=0.1.0), Better Auth (existing)

**Storage**: Neon Serverless PostgreSQL (existing database + new Conversation and Message tables)

**Testing**: pytest with coverage (backend), vitest (frontend)

**Target Platform**: Web application (modern browsers with SSE support + Linux/cloud server)

**Project Type**: Web application (monorepo: /frontend + /backend)

**Performance Goals**:
- Response streaming begins < 2 seconds after user message submission
- Support 50 concurrent chat sessions without degradation
- Task operations complete < 5 seconds end-to-end (message → confirmation)

**Constraints**:
- **Stateless server architecture**: No in-memory conversation state (all persisted to database)
- **JWT authentication required**: All chat endpoints require valid JWT token
- **User isolation**: Strict per-user data segregation (conversations, messages, tasks)
- **Existing Phase 2 compatibility**: Must not break existing REST API or frontend UI

**Scale/Scope**:
- Single-user conversations (one-on-one user-to-chatbot)
- 5 MCP tools (add_task, list_tasks, complete_task, delete_task, update_task)
- Support for multiple AI providers (OpenAI, Gemini) via environment configuration
- Text-based conversations only (no voice, images, or rich media)

## Constitution Check

*GATE: Must pass before implementation. Re-checked after design finalized.*

### Principle I: Persistent Database Storage ✅ PASS

**Requirement**: All application data MUST be stored in Neon Serverless PostgreSQL database.

**Compliance**:
- Conversation model persisted with user_id, created_at, updated_at
- Message model persisted with user_id, conversation_id, role, content, tool_calls, created_at
- Reuses existing Task and User models from Phase 2
- All conversation state stored in database (stateless server)
- Alembic migrations for new tables

**Notes**: Fully compliant. No in-memory state. Database-first design.

---

### Principle II: Web-First Multi-User Application ✅ PASS

**Requirement**: Modern full-stack web application with responsive interface and multi-user support.

**Compliance**:
- Next.js 16 frontend with ChatKit widget (responsive chat interface)
- FastAPI backend with stateless chat endpoint
- JWT authentication via Better Auth (existing from Phase 2)
- User isolation enforced at database and API levels (conversation.user_id, message.user_id)
- All 5 core operations accessible through chat interface

**Notes**: Fully compliant. Extends Phase 2 multi-user architecture with chat interface.

---

### Principle III: Clean Code Practices ✅ PASS

**Requirement**: Small functions, clear names, single responsibility, minimal side effects.

**Compliance**:
- Service layer extraction (task_service.py, conversation_service.py) promotes single responsibility
- MCP tools are small, focused functions (each tool does one operation)
- Agent factory pattern (create_model) centralizes AI provider logic
- Clear separation: routers → services → database
- Async/await for I/O operations (database, AI API calls)

**Notes**: Fully compliant. Service layer refactoring improves code organization.

---

### Principle IV: Modular Monorepo Structure ✅ PASS

**Requirement**: Monorepo with /frontend, /backend, and clear separation of concerns.

**Compliance**:
- Backend: New directories (services/, agents/, mcp/), new files (models/conversation.py, models/message.py, routers/chat.py, schemas/chat.py)
- Frontend: New directories (components/chatkit/, app/chat/), ChatKit integration
- Maintains existing /frontend and /backend structure
- All specifications in /specs/004-ai-chatbot/

**Notes**: Fully compliant. Extends existing monorepo without disrupting Phase 2 structure.

---

### Principle V: Spec-Driven Development ✅ PASS

**Requirement**: All work commences from Spec-Kit Plus commands and aligns with constitution.

**Compliance**:
- Specification created via /sp.specify (specs/004-ai-chatbot/spec.md)
- Implementation plan created via /sp.plan (this file)
- Tasks will be generated via /sp.tasks
- Implementation will follow /sp.implement workflow
- All Phase 3 mandatory requirements from constitution addressed

**Notes**: Fully compliant. Following Spec-Kit Plus workflow strictly.

---

### Principle VI: Automated Testing ✅ PASS

**Requirement**: Backend API integration tests, JWT auth tests, user isolation tests, frontend component tests.

**Compliance**:
- Backend: pytest integration tests for chat endpoint, MCP tools, conversation service
- Backend: JWT authentication tests (valid token, expired token, missing token)
- Backend: User isolation tests (cannot access other users' conversations/tasks)
- Frontend: vitest component tests for ChatKit integration
- Test coverage targets: >80% for new code

**Notes**: Fully compliant. Comprehensive testing plan aligned with Phase 2 standards.

---

### Principle XII: AI-Powered Conversational Interface ✅ PASS

**Requirement**: OpenAI Agents SDK, MCP server, ChatKit frontend, stateless architecture, streaming responses.

**Compliance**:
- OpenAI Agents SDK for AI orchestration (agents/todo_agent.py)
- Official MCP SDK for tool protocol (mcp/ directory with 5 tools)
- OpenAI ChatKit for frontend UI (components/chatkit/)
- Stateless architecture (all state persisted to database)
- Server-Sent Events for streaming responses
- All 5 core operations via natural language
- Conversation context maintenance

**Notes**: Fully compliant. Complete implementation of Phase 3 mandatory requirements.

---

**GATE RESULT**: ✅ **PASSED** - All constitution principles satisfied. Proceed with implementation.

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-chatbot/
├── spec.md              # Feature specification (created via /sp.specify)
├── plan.md              # This file (created via /sp.plan)
├── tasks.md             # Implementation tasks (created via /sp.tasks - pending)
└── checklists/
    └── requirements.md  # Specification quality checklist (validation passed)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── conversation.py      # NEW: Conversation model (user_id, created_at, updated_at)
│   │   ├── message.py           # NEW: Message model (conversation_id, role, content, tool_calls)
│   │   └── task.py              # EXISTING: Task model from Phase 2
│   ├── services/
│   │   ├── task_service.py      # NEW: Extract task CRUD logic (shared by MCP & REST)
│   │   └── conversation_service.py  # NEW: Conversation & message management
│   ├── agents/
│   │   ├── factory.py           # NEW: Model factory for AI provider abstraction
│   │   └── todo_agent.py        # NEW: TodoAgent with MCP tools integration
│   ├── mcp/
│   │   ├── __init__.py          # NEW: MCP server initialization
│   │   ├── tools.py             # NEW: 5 MCP tools (add/list/complete/delete/update_task)
│   │   └── server.py            # NEW: MCP server setup with Official MCP SDK
│   ├── routers/
│   │   ├── chat.py              # NEW: POST /api/{user_id}/chat endpoint (SSE streaming)
│   │   └── tasks.py             # EXISTING: Refactor to use task_service.py
│   ├── schemas/
│   │   └── chat.py              # NEW: ChatRequest, ChatResponse, MessageSchema
│   └── alembic/
│       └── versions/
│           └── [timestamp]_add_conversation_message.py  # NEW: Migration for Conversation & Message tables
└── tests/
    ├── integration/
    │   ├── test_chat_endpoint.py     # NEW: Chat endpoint integration tests
    │   ├── test_mcp_tools.py         # NEW: MCP tools integration tests
    │   └── test_conversation_service.py  # NEW: Conversation service tests
    ├── unit/
    │   ├── test_task_service.py      # NEW: Task service unit tests
    │   └── test_agent_factory.py    # NEW: Agent factory unit tests
    └── contract/
        └── test_chat_api.py          # NEW: Chat API contract tests

frontend/
├── src/
│   ├── components/
│   │   └── chatkit/
│   │       ├── ChatKitWidget.tsx       # NEW: ChatKit widget wrapper
│   │       ├── ChatKitProvider.tsx     # NEW: ChatKit provider with config
│   │       └── ChatKitConfig.ts        # NEW: ChatKit configuration
│   ├── app/
│   │   └── chat/
│   │       ├── page.tsx                # NEW: Chat page route
│   │       └── layout.tsx              # NEW: Chat layout (if needed)
│   └── lib/
│       └── api.ts                      # EXISTING: Add chat API methods
└── tests/
    └── components/
        └── chatkit/
            └── ChatKitWidget.test.tsx  # NEW: ChatKit widget tests
```

**Structure Decision**: Web application (Option 2) - Monorepo with /backend and /frontend directories. Phase 3 adds new subdirectories and files without disrupting existing Phase 2 structure. Service layer extraction improves code organization and enables MCP tool reuse of business logic.

## Complexity Tracking

> **No constitution violations detected. This section is empty.**

All Phase 3 requirements align with constitution principles. No additional complexity justification needed.

## Architecture Overview

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER (Browser)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                             │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  ChatKit Widget (@openai/chatkit)                                   │  │
│  │  - Conversational UI                                                │  │
│  │  - Message rendering                                                │  │
│  │  - Streaming response display                                       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Better Auth (JWT)                                                  │  │
│  │  - Attach JWT token to requests                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/{user_id}/chat (SSE)
                                    │ Authorization: Bearer <jwt_token>
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKEND (FastAPI)                                │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  JWT Middleware                                                     │  │
│  │  - Verify JWT token                                                │  │
│  │  - Extract user_id                                                 │  │
│  │  - Validate user_id matches URL path                              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Chat Router (routers/chat.py)                                      │  │
│  │  - POST /api/{user_id}/chat                                        │  │
│  │  - Extract conversation_id and message                             │  │
│  │  - Stream response via SSE                                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Conversation Service (services/conversation_service.py)            │  │
│  │  - Fetch conversation history from DB                              │  │
│  │  - Store user message to DB                                        │  │
│  │  - Store assistant response to DB                                  │  │
│  │  - Return conversation_id                                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  TodoAgent (agents/todo_agent.py)                                   │  │
│  │  - OpenAI Agents SDK Agent + Runner                                │  │
│  │  - Build message array (history + new message)                     │  │
│  │  - Run agent with MCP tools                                        │  │
│  │  - Stream responses                                                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Model Factory (agents/factory.py)                                  │  │
│  │  - create_model(provider: "openai" | "gemini")                     │  │
│  │  - AI provider abstraction                                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  MCP Tools (mcp/tools.py)                                           │  │
│  │  - add_task(user_id, title, description)                           │  │
│  │  - list_tasks(user_id, status)                                     │  │
│  │  - complete_task(user_id, task_id)                                 │  │
│  │  - delete_task(user_id, task_id)                                   │  │
│  │  - update_task(user_id, task_id, title, description)               │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Task Service (services/task_service.py)                            │  │
│  │  - create_task(user_id, task_data)                                 │  │
│  │  - get_tasks(user_id, filters)                                     │  │
│  │  - update_task_status(user_id, task_id, completed)                 │  │
│  │  - delete_task(user_id, task_id)                                   │  │
│  │  - update_task_details(user_id, task_id, updates)                  │  │
│  │  Shared by: MCP tools + REST endpoints                             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   DATABASE (Neon PostgreSQL)                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Conversation│  │   Message    │  │   Task   │  │   User   │          │
│  ├─────────────┤  ├──────────────┤  ├──────────┤  ├──────────┤          │
│  │ id          │  │ id           │  │ id       │  │ id       │          │
│  │ user_id     │  │ user_id      │  │ user_id  │  │ email    │          │
│  │ created_at  │  │ conversation_│  │ title    │  │ ...      │          │
│  │ updated_at  │  │ role         │  │ completed│  └──────────┘          │
│  └─────────────┘  │ content      │  │ ...      │                        │
│                   │ tool_calls   │  └──────────┘                        │
│                   │ created_at   │                                      │
│                   └──────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow (Detailed)

**1. User sends message** → Frontend ChatKit Widget
```
User: "Add a task to buy groceries"
```

**2. Frontend** → Backend
```
POST /api/ziakhan/chat
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "conversation_id": null,  // or existing conversation_id
  "message": "Add a task to buy groceries"
}
```

**3. JWT Middleware** (Backend)
```
- Verify JWT token signature
- Extract user_id from token: "ziakhan"
- Validate user_id matches URL path
- Pass to Chat Router
```

**4. Chat Router** (routers/chat.py)
```
- Extract conversation_id (null → create new) and message
- Call Conversation Service to store user message
- Build message history from database
- Call TodoAgent with message history
- Stream response via SSE
```

**5. Conversation Service** (services/conversation_service.py)
```
IF conversation_id is null:
  - Create new Conversation(user_id="ziakhan")
  - Get conversation_id
ELSE:
  - Fetch existing Conversation
  - Validate user_id matches conversation.user_id

- Store Message(
    user_id="ziakhan",
    conversation_id=conversation_id,
    role="user",
    content="Add a task to buy groceries"
  )
- Fetch all messages for conversation_id (ordered by created_at)
- Return conversation_id and message history
```

**6. TodoAgent** (agents/todo_agent.py)
```
- Create AI model via Model Factory (OpenAI or Gemini)
- Build message array: [history messages + new user message]
- Initialize OpenAI Agents SDK Agent with MCP tools
- Run agent.run(messages) → streams responses
- Agent interprets intent: "add task"
- Agent invokes MCP tool: add_task(user_id="ziakhan", title="Buy groceries")
```

**7. MCP Tool** (mcp/tools.py)
```
add_task(user_id="ziakhan", title="Buy groceries", description=None):
  - Call Task Service
  - task_service.create_task(
      user_id="ziakhan",
      task_data={"title": "Buy groceries", "description": None}
    )
  - Return {"task_id": 42, "status": "created", "title": "Buy groceries"}
```

**8. Task Service** (services/task_service.py)
```
create_task(user_id, task_data):
  - Create Task(user_id="ziakhan", title="Buy groceries", completed=False)
  - Save to database
  - Return task object
```

**9. Agent completes** → Generate response
```
Agent: "✅ I've added 'Buy groceries' to your task list!"
```

**10. Conversation Service** → Store assistant response
```
- Store Message(
    user_id="ziakhan",
    conversation_id=conversation_id,
    role="assistant",
    content="✅ I've added 'Buy groceries' to your task list!",
    tool_calls=[{"tool": "add_task", "args": {"user_id": "ziakhan", "title": "Buy groceries"}}]
  )
```

**11. Chat Router** → Stream response to Frontend
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"conversation_id": 1, "response": "✅ I've added 'Buy groceries' to your task list!", "tool_calls": [...]}

data: [DONE]
```

**12. Frontend** → Display response
```
ChatKit Widget displays streamed response in conversation UI
```

## Key Design Decisions

### 1. Service Layer Extraction

**Decision**: Extract task business logic from routers into dedicated service layer (services/task_service.py).

**Rationale**:
- **Code reuse**: MCP tools and REST endpoints share identical business logic (create task, list tasks, etc.)
- **Single responsibility**: Routers handle HTTP concerns (request/response), services handle business logic
- **Testability**: Services can be unit tested independently from HTTP layer
- **Consistency**: Same validation rules and database operations regardless of interface (chat vs REST)
- **Maintainability**: Business logic changes in one place propagate to both MCP tools and REST endpoints

**Alternatives Considered**:
- **Direct database access in MCP tools**: Rejected - leads to code duplication and inconsistency
- **MCP tools call REST endpoints**: Rejected - adds unnecessary HTTP overhead for in-process calls
- **Shared utility functions**: Rejected - not sufficient for complex business logic and transaction management

**Implementation**: All task operations (create, read, update, delete, toggle completion) implemented in task_service.py. Both routers/tasks.py (REST) and mcp/tools.py (MCP) call task_service methods.

---

### 2. Model Factory Pattern

**Decision**: Centralized create_model() function in agents/factory.py for AI provider abstraction.

**Rationale**:
- **Multi-provider support**: Supports both OpenAI and Gemini via environment variables (LLM_PROVIDER)
- **Configuration centralization**: API keys, model names, and settings in one place
- **Easy testing**: Mock factory in tests to avoid real API calls
- **Future extensibility**: New providers (Anthropic, Cohere) can be added without changing agent code
- **Environment-based configuration**: Different providers for dev/staging/prod

**Alternatives Considered**:
- **Hardcoded OpenAI**: Rejected - vendor lock-in, no flexibility
- **Provider parameter in every agent call**: Rejected - repetitive, error-prone
- **Separate agent classes per provider**: Rejected - code duplication

**Implementation**:
```python
def create_model(provider: str = None) -> Any:
    provider = provider or os.getenv("LLM_PROVIDER", "openai")
    if provider == "openai":
        return OpenAI(api_key=os.getenv("OPENAI_API_KEY"), model=os.getenv("OPENAI_DEFAULT_MODEL"))
    elif provider == "gemini":
        return Gemini(api_key=os.getenv("GEMINI_API_KEY"), model=os.getenv("GEMINI_DEFAULT_MODEL"))
    else:
        raise ValueError(f"Unsupported provider: {provider}")
```

---

### 3. In-Process MCP Tools

**Decision**: Run MCP tools in the same process as FastAPI server (not as subprocess or separate service).

**Rationale**:
- **Lower latency**: No inter-process communication overhead (30-50ms saved per tool call)
- **Simpler deployment**: Single service to deploy, no orchestration complexity
- **Shared database connection**: MCP tools and REST endpoints use same SQLModel session pool
- **Easier debugging**: Single process to debug, stack traces across entire request flow
- **Resource efficiency**: No duplicate memory/CPU for separate MCP server process

**Alternatives Considered**:
- **MCP tools as subprocess**: Rejected - adds latency, complicates deployment, harder to debug
- **MCP tools as separate microservice**: Rejected - over-engineering for 5 simple tools, network overhead
- **MCP tools via HTTP**: Rejected - HTTP overhead (100-200ms) for in-process calls is wasteful

**Implementation**: MCP server initialized in main.py FastAPI app, tools directly call task_service.py methods. OpenAI Agents SDK invokes tools via function calling protocol.

---

### 4. Stateless Chat Architecture (Updated Implementation)

**Decision**: **Dual Architecture** - SQLiteSession for ChatKit endpoint, database persistence for direct endpoint.

**Rationale**:
- **ChatKit Integration**: OpenAI Agents SDK's `SQLiteSession` provides automatic conversation memory management
- **Horizontal scalability**: Stateless server design still maintained
- **Resilience**: SQLiteSession persists across server restarts (SQLite database)
- **Simplicity**: Automatic history management reduces manual conversation loading code
- **Dual Support**: Both ChatKit protocol and direct REST endpoints supported

**Alternatives Considered**:
- **Database-only persistence**: Rejected - More complex manual history management, ChatKit SDK provides SQLiteSession
- **In-memory conversation state**: Rejected - doesn't scale horizontally, lost on restart
- **Redis session store**: Rejected - adds infrastructure complexity

**Actual Implementation**:

**ChatKit Endpoint** (`/api/chatkit`):
```
For each chat request:
1. Create/load SQLiteSession for user+thread combination
2. SQLiteSession automatically retrieves conversation history
3. Run agent with session (automatic memory)
4. SQLiteSession stores conversation for future turns
5. Return response (server forgets everything, session persists in SQLite)
```

**Direct Chat Endpoint** (`/api/{user_id}/chat`):
```
For each chat request:
1. Fetch conversation history from PostgreSQL (Conversation + Messages)
2. Store new user message to PostgreSQL
3. Run agent with full message history
4. Store assistant response to PostgreSQL
5. Return response (server forgets everything)
```

**Storage**:
- **ChatKit**: SQLiteSession (SQLite database: `chat_sessions.db`)
- **Direct Endpoint**: PostgreSQL (Conversation and Message tables)
- **Both**: Stateless server, state persisted externally

**Note**: See `backend/CONVERSATION_MEMORY.md` for detailed SQLiteSession implementation.

---

### 5. Server-Sent Events (SSE) Streaming

**Decision**: Stream chat responses using Server-Sent Events instead of full response waiting or WebSockets.

**Rationale**:
- **Better UX**: Users see responses appear in real-time (like ChatGPT), not waiting 5-10 seconds
- **ChatKit compatibility**: @openai/chatkit library expects SSE streaming protocol
- **Simpler than WebSockets**: No bidirectional communication needed, HTTP-based, works through proxies
- **Browser support**: SSE supported in all modern browsers, simpler fallback than WebSockets
- **FastAPI support**: Native StreamingResponse support in FastAPI

**Alternatives Considered**:
- **Full response waiting**: Rejected - poor UX for long responses (10+ seconds)
- **WebSockets**: Rejected - over-engineering for one-way streaming, harder to implement/debug
- **Long polling**: Rejected - inefficient, not real-time

**Implementation**:
```python
async def stream_chat_response(agent_response):
    async for chunk in agent_response:
        yield f"data: {json.dumps(chunk)}\n\n"
    yield "data: [DONE]\n\n"

@router.post("/api/{user_id}/chat")
async def chat(user_id: str, request: ChatRequest):
    # ... conversation service, agent invocation ...
    return StreamingResponse(stream_chat_response(agent_response), media_type="text/event-stream")
```

## Implementation Phases

### Phase A: Service Layer Foundation

**Goal**: Extract task business logic into reusable service layer.

**Deliverables**:
1. Create `services/task_service.py` with all task operations:
   - `create_task(user_id, task_data) → Task`
   - `get_tasks(user_id, filters) → List[Task]`
   - `get_task_by_id(user_id, task_id) → Task | None`
   - `update_task_status(user_id, task_id, completed) → Task`
   - `delete_task(user_id, task_id) → bool`
   - `update_task_details(user_id, task_id, updates) → Task`

2. Refactor `routers/tasks.py` to use task_service methods (replace direct DB access)

3. Add unit tests for task_service.py (pytest)

**Acceptance Criteria**:
- All existing Phase 2 task REST endpoints still work (no breaking changes)
- All REST endpoints use task_service methods (no direct DB access in routers)
- Task service methods enforce user isolation (user_id parameter required)
- Unit test coverage >80% for task_service.py

**Estimated Effort**: 2-3 hours

---

### Phase B: Database Models & Conversation Service

**Goal**: Add Conversation and Message models with conversation management service.

**Deliverables**:
1. Create `models/conversation.py`:
   ```python
   class Conversation(SQLModel, table=True):
       id: Optional[int] = Field(default=None, primary_key=True)
       user_id: str = Field(index=True)
       created_at: datetime = Field(default_factory=datetime.utcnow)
       updated_at: datetime = Field(default_factory=datetime.utcnow)
   ```

2. Create `models/message.py`:
   ```python
   class Message(SQLModel, table=True):
       id: Optional[int] = Field(default=None, primary_key=True)
       user_id: str = Field(index=True)
       conversation_id: int = Field(foreign_key="conversation.id", index=True)
       role: str = Field()  # "user" or "assistant"
       content: str = Field()
       tool_calls: Optional[str] = Field(default=None)  # JSON string
       created_at: datetime = Field(default_factory=datetime.utcnow)
   ```

3. Create Alembic migration: `alembic/versions/[timestamp]_add_conversation_message.py`

4. Create `services/conversation_service.py`:
   - `get_or_create_conversation(user_id, conversation_id=None) → Conversation`
   - `add_message(user_id, conversation_id, role, content, tool_calls=None) → Message`
   - `get_conversation_history(user_id, conversation_id) → List[Message]`
   - `get_user_conversations(user_id) → List[Conversation]`

5. Add unit tests for conversation_service.py

**Acceptance Criteria**:
- Database migration runs successfully (creates conversation and message tables)
- Conversation service methods enforce user isolation
- Messages ordered by created_at when fetching history
- Unit test coverage >80% for conversation_service.py

**Estimated Effort**: 3-4 hours

---

### Phase C: MCP Tools Implementation

**Goal**: Implement 5 MCP tools using Official MCP SDK.

**Deliverables**:
1. Create `mcp/__init__.py` (MCP server initialization)

2. Create `mcp/tools.py` with 5 tools:
   - `add_task(user_id: str, title: str, description: str = None) → dict`
   - `list_tasks(user_id: str, status: str = "all") → dict`
   - `complete_task(user_id: str, task_id: int) → dict`
   - `delete_task(user_id: str, task_id: int) → dict`
   - `update_task(user_id: str, task_id: int, title: str = None, description: str = None) → dict`

3. Create `mcp/server.py` (MCP server setup with Official MCP SDK)

4. Each tool calls task_service methods (code reuse from Phase A)

5. Add integration tests for MCP tools (pytest)

**Tool Specifications**:

**add_task**:
- Parameters: user_id (required), title (required), description (optional)
- Returns: `{"task_id": int, "status": "created", "title": str}`
- Error: Returns `{"error": "message"}` on failure

**list_tasks**:
- Parameters: user_id (required), status ("all" | "pending" | "completed", default "all")
- Returns: `{"tasks": [{"id": int, "title": str, "completed": bool}, ...], "count": int}`
- Error: Returns `{"error": "message"}` on failure

**complete_task**:
- Parameters: user_id (required), task_id (required)
- Returns: `{"task_id": int, "status": "completed", "title": str}`
- Error: Returns `{"error": "Task not found"}` if task_id doesn't exist

**delete_task**:
- Parameters: user_id (required), task_id (required)
- Returns: `{"task_id": int, "status": "deleted", "title": str}`
- Error: Returns `{"error": "Task not found"}` if task_id doesn't exist

**update_task**:
- Parameters: user_id (required), task_id (required), title (optional), description (optional)
- Returns: `{"task_id": int, "status": "updated", "title": str}`
- Error: Returns `{"error": "Task not found"}` if task_id doesn't exist

**Acceptance Criteria**:
- All 5 tools implemented and registered with MCP server
- Tools call task_service methods (no direct DB access)
- Tools enforce user isolation (user_id parameter)
- Tools return consistent JSON format (success and error cases)
- Integration test coverage >80% for MCP tools

**Estimated Effort**: 4-5 hours

---

### Phase D: Agent Integration (TodoAgent)

**Goal**: Implement AI agent with OpenAI Agents SDK and MCP tool integration.

**Deliverables**:
1. Create `agents/factory.py`:
   ```python
   def create_model(provider: str = None) -> Any:
       # OpenAI or Gemini based on LLM_PROVIDER env var
   ```

2. Create `agents/todo_agent.py`:
   ```python
   class TodoAgent:
       def __init__(self, mcp_tools: list):
           self.model = create_model()
           self.agent = Agent(model=self.model, tools=mcp_tools)
           self.runner = Runner(self.agent)

       async def run(self, messages: list) -> AsyncGenerator[str, None]:
           # Stream responses using agent.run()
   ```

3. Integrate MCP tools from Phase C into TodoAgent

4. Add unit tests for agent factory and TodoAgent

**Acceptance Criteria**:
- Agent successfully invokes MCP tools for natural language commands
- Agent supports both OpenAI and Gemini providers (configurable via env)
- Agent streams responses (async generator)
- Agent maintains conversation context (message history)
- Unit test coverage >80% for agent components

**Estimated Effort**: 5-6 hours

---

### Phase E: Chat API Endpoint (SSE Streaming)

**Goal**: Implement stateless chat endpoint with Server-Sent Events streaming.

**Deliverables**:
1. Create `schemas/chat.py`:
   ```python
   class ChatRequest(BaseModel):
       conversation_id: Optional[int] = None
       message: str

   class ChatResponse(BaseModel):
       conversation_id: int
       response: str
       tool_calls: List[dict]
   ```

2. Create `routers/chat.py`:
   ```python
   @router.post("/api/{user_id}/chat")
   async def chat(user_id: str, request: ChatRequest, current_user: User = Depends(get_current_user)):
       # 1. Validate user_id matches JWT token
       # 2. Get or create conversation
       # 3. Store user message
       # 4. Load conversation history
       # 5. Run TodoAgent
       # 6. Store assistant response
       # 7. Stream response via SSE
   ```

3. Add JWT authentication dependency (reuse from Phase 2)

4. Implement SSE streaming response

5. Add integration tests for chat endpoint

**Acceptance Criteria**:
- POST /api/{user_id}/chat endpoint works with SSE streaming
- JWT authentication required (401 if missing/invalid)
- User isolation enforced (cannot access other users' conversations)
- Conversation history persisted to database
- Responses stream in real-time
- Integration test coverage >80% for chat endpoint

**Estimated Effort**: 5-6 hours

---

### Phase F: Frontend ChatKit Integration

**Goal**: Integrate OpenAI ChatKit widget into Next.js frontend.

**Deliverables**:
1. Install @openai/chatkit dependency: `pnpm add @openai/chatkit`

2. Create `components/chatkit/ChatKitConfig.ts`:
   ```typescript
   export const chatKitConfig = {
       apiUrl: process.env.NEXT_PUBLIC_CHATKIT_API_URL || '/api/chat',
       headers: {
           Authorization: `Bearer ${getAuthToken()}`, // Better Auth JWT
       },
   };
   ```

3. Create `components/chatkit/ChatKitProvider.tsx`:
   ```typescript
   import { ChatKitProvider as Provider } from '@openai/chatkit';

   export function ChatKitProvider({ children }: { children: React.ReactNode }) {
       return <Provider config={chatKitConfig}>{children}</Provider>;
   }
   ```

4. Create `components/chatkit/ChatKitWidget.tsx`:
   ```typescript
   'use client';
   import { ChatWidget } from '@openai/chatkit';

   export function ChatKitWidget() {
       return <ChatWidget />;
   }
   ```

5. Create `app/chat/page.tsx`:
   ```typescript
   import { ChatKitWidget } from '@/components/chatkit/ChatKitWidget';

   export default function ChatPage() {
       return (
           <div className="container mx-auto p-4">
               <h1 className="text-2xl font-bold mb-4">AI Todo Assistant</h1>
               <ChatKitWidget />
           </div>
       );
   }
   ```

6. Update `lib/api.ts` to add chat methods (if needed)

7. Add component tests for ChatKit integration

**Acceptance Criteria**:
- ChatKit widget renders on /chat page
- Widget sends messages to /api/{user_id}/chat endpoint
- JWT token attached to chat requests
- Streaming responses displayed in real-time
- Conversation history persists across page refreshes
- Component test coverage >80% for ChatKit components

**Estimated Effort**: 4-5 hours

---

### Phase G: Testing & Polish

**Goal**: Comprehensive testing, error handling, and production readiness.

**Deliverables**:
1. **Integration Tests**:
   - End-to-end chat flow (user message → agent → MCP tool → task creation → response)
   - Conversation persistence across multiple messages
   - User isolation (cannot access other users' conversations/tasks)
   - JWT authentication (valid token, expired token, missing token)
   - Error scenarios (task not found, invalid input, API failures)

2. **Error Handling**:
   - Graceful handling of AI API failures (OpenAI/Gemini down)
   - Network interruption during streaming (frontend retry)
   - Invalid task IDs (friendly error messages)
   - Ambiguous natural language (clarification requests)
   - Rate limit handling (exponential backoff)

3. **Performance Testing**:
   - Load test: 50 concurrent chat sessions
   - Response streaming latency (<2 seconds to first token)
   - Task operation latency (<5 seconds end-to-end)

4. **Documentation**:
   - API documentation update (OpenAPI/Swagger for chat endpoint)
   - README update (chat feature usage, environment variables)
   - Deployment guide (environment variables, migrations)

5. **Production Checklist**:
   - Environment variables configured (.env.example updated)
   - Database migrations tested (up and down)
   - CI/CD pipeline updated (backend tests include chat endpoint)
   - Error logging and monitoring (Sentry or similar)

**Acceptance Criteria**:
- All integration tests pass
- Error handling covers all edge cases from spec
- Performance goals met (streaming <2s, operations <5s, 50 concurrent sessions)
- API documentation complete
- Production deployment checklist verified

**Estimated Effort**: 6-8 hours

---

**Total Estimated Effort**: 29-37 hours (approximately 4-5 days of focused development)

## Environment Variables

### Backend (.env)

```bash
# Existing Phase 2 variables
DATABASE_URL=postgresql://user:pass@db.neon.tech/todo_db
BETTER_AUTH_SECRET=your-secret-key-here

# New Phase 3 variables
LLM_PROVIDER=openai  # "openai" or "gemini"

# OpenAI configuration (required if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o-mini  # or gpt-4o, gpt-4-turbo

# Gemini configuration (required if LLM_PROVIDER=gemini)
GEMINI_API_KEY=AIza...
GEMINI_DEFAULT_MODEL=gemini-2.0-flash-exp  # or gemini-1.5-pro
```

### Frontend (.env.local)

```bash
# Existing Phase 2 variables
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here

# New Phase 3 variables
NEXT_PUBLIC_CHATKIT_API_URL=/api/chat  # Relative path to chat endpoint
```

## Dependencies

### Backend (pyproject.toml)

```toml
[project]
dependencies = [
    # Existing Phase 2 dependencies
    "fastapi>=0.104.0",
    "sqlmodel>=0.0.14",
    "alembic>=1.12.0",
    "pydantic>=2.5.0",
    "python-jose[cryptography]>=3.3.0",

    # New Phase 3 dependencies
    "openai-agents>=0.1.0",  # OpenAI Agents SDK
    "mcp>=1.0.0",            # Official MCP SDK

    # Optional: Gemini support
    "google-generativeai>=0.3.0",  # If using Gemini
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-asyncio>=0.21.0",
    "pytest-cov>=4.1.0",
    "httpx>=0.25.0",  # For testing FastAPI endpoints
]
```

### Frontend (package.json)

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@openai/chatkit": "^0.1.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

## Risk Mitigation

### Risk 1: OpenAI ChatKit SDK Unavailable or Breaking Changes

**Impact**: High - Frontend chat UI cannot be built
**Probability**: Medium - SDK is new and may have limited availability

**Mitigation**:
1. **Fallback to custom chat UI**: Build simple chat interface with:
   - Message list component
   - Input field with send button
   - SSE streaming integration (fetch API with EventSource)
2. **Use @chatscope/chat-ui-kit-react**: Alternative React chat library if ChatKit unavailable
3. **Reference ChatGPT UI patterns**: Well-documented chat interface patterns

**Trigger**: If @openai/chatkit npm package is unavailable or incompatible with Next.js 16

---

### Risk 2: SSE Streaming Complexity

**Impact**: Medium - Worse UX but feature still works
**Probability**: Low - FastAPI and Next.js both support SSE

**Mitigation**:
1. **Start with non-streaming**: Implement full response waiting first (simpler)
2. **Add streaming incrementally**: Upgrade to SSE after basic flow works
3. **Use proven libraries**: FastAPI StreamingResponse, browser EventSource API
4. **Fallback to polling**: If SSE fails in production, use polling as backup

**Trigger**: If SSE implementation takes >8 hours or encounters browser compatibility issues

---

### Risk 3: MCP SDK Learning Curve

**Impact**: Medium - Implementation delay
**Probability**: High - New SDK with limited documentation

**Mitigation**:
1. **Reference official examples**: MCP SDK repository examples
2. **Start with simple tools**: Implement add_task first, then generalize pattern
3. **Use OpenAI function calling directly**: If MCP SDK too complex, use native OpenAI function calling
4. **Community resources**: Search for MCP SDK tutorials and examples

**Trigger**: If MCP SDK implementation takes >10 hours or documentation is insufficient

---

### Risk 4: AI Model Rate Limits (OpenAI/Gemini)

**Impact**: High - Chat feature unusable during rate limits
**Probability**: Medium - Depends on usage volume and API tier

**Mitigation**:
1. **Implement retry with exponential backoff**: Retry failed requests with increasing delays
2. **Rate limit detection**: Catch 429 errors, show friendly message to user
3. **Request queuing**: Queue requests during rate limits (Redis queue)
4. **Multi-provider fallback**: If OpenAI rate limited, fallback to Gemini (and vice versa)
5. **Usage monitoring**: Track API usage, alert before hitting limits

**Trigger**: If 429 errors occur during development or production usage

---

### Risk 5: Stateless Architecture Database Load

**Impact**: Medium - Slower response times under high load
**Probability**: Low - 50 concurrent sessions is modest load

**Mitigation**:
1. **Database connection pooling**: Use SQLModel connection pool (default 5-10 connections)
2. **Index optimization**: Add indexes on conversation.user_id, message.conversation_id
3. **Query optimization**: Fetch only necessary columns, paginate message history
4. **Caching layer**: Add Redis cache for conversation history (optional)
5. **Horizontal scaling**: Add more FastAPI server instances (stateless supports this)

**Trigger**: If chat endpoint latency exceeds 5 seconds or database CPU >80%

---

### Risk 6: Natural Language Understanding Accuracy

**Impact**: Medium - Users frustrated by misinterpretations
**Probability**: Medium - NLU is inherently probabilistic

**Mitigation**:
1. **Clear error messages**: Guide users toward successful phrasing
2. **Clarification requests**: Ask for disambiguation when intent unclear
3. **Example prompts**: Show example commands in UI ("Try: 'Add a task to...'")
4. **Feedback loop**: Log failed interpretations, improve system prompts
5. **Graceful degradation**: Allow users to fall back to traditional UI

**Trigger**: If SC-004 success criteria not met (90% interpretation accuracy)

---

## Success Metrics (Aligned with Spec Success Criteria)

1. **SC-001: Task Creation Speed** - Users can add task < 5 seconds
   - Measurement: Frontend timer (message submit → confirmation received)
   - Target: P95 latency < 5 seconds

2. **SC-002: All Operations Work** - All 5 operations via conversation
   - Measurement: Integration tests for add/list/complete/delete/update
   - Target: 100% success rate in tests

3. **SC-003: Conversation Persistence** - History persists across refreshes/restarts
   - Measurement: Integration tests (refresh browser, restart server, check history)
   - Target: 0 message loss

4. **SC-004: Interpretation Accuracy** - 90% first-attempt success
   - Measurement: Manual testing with 100 sample commands
   - Target: ≥90 successful interpretations

5. **SC-005: Streaming Latency** - Streaming starts < 2 seconds
   - Measurement: Frontend timer (message submit → first token received)
   - Target: P95 latency < 2 seconds

6. **SC-006: Concurrent Sessions** - 50 concurrent sessions without degradation
   - Measurement: Load test with 50 simultaneous chat requests
   - Target: All requests complete successfully, P95 latency < 5 seconds

7. **SC-007: User Satisfaction** - 80% "intuitive/easy to use"
   - Measurement: User feedback survey (5-point scale)
   - Target: ≥80% rate 4-5 stars

8. **SC-008: Error Message Helpfulness** - 90% guide to success
   - Measurement: Error scenario testing (task not found, invalid input, etc.)
   - Target: ≥90% of error messages provide actionable guidance

---

## Next Steps

After this plan is approved:

1. **Run `/sp.tasks`** to generate detailed task breakdown (tasks.md)
2. **Begin implementation** following Phase A → Phase G sequence
3. **Create feature branch**: `004-ai-chatbot` (already exists)
4. **Set up environment variables** for development
5. **Run database migrations** (Phase B)
6. **Implement incrementally**, testing after each phase
7. **Submit PR** after Phase G testing complete

---

**Plan Status**: ✅ Ready for task generation (`/sp.tasks`)
**Constitution Compliance**: ✅ All principles satisfied
**Estimated Timeline**: 4-5 days of focused development (29-37 hours)
