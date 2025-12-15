# Technical Research: AI-Powered Todo Chatbot

**Feature**: 004-ai-chatbot
**Date**: 2025-12-14
**Status**: Complete

This document captures the technical research and decision-making process for implementing the AI-Powered Todo Chatbot feature. Each section documents a key technical decision, the rationale behind it, alternatives considered, and the implementation pattern to follow.

---

## 1. OpenAI Agents SDK Integration

### Decision
Use **OpenAI Agents SDK** with `function_tool` decorator pattern for agent orchestration and tool calling.

### Rationale
- **Official SDK**: Built and maintained by OpenAI, ensuring compatibility with latest models and features
- **Structured Tool Calling**: Native support for function calling with type-safe parameters and return values
- **SSE Streaming Support**: Built-in streaming via `Runner.run_streamed()` for real-time response delivery
- **Model Factory Pattern**: Supports multiple AI providers (OpenAI, Gemini) through unified interface
- **Simplified Integration**: Reduces boilerplate code compared to direct API calls or custom agent loops

### Alternatives Considered
1. **Direct OpenAI API Calls**
   - Pros: Maximum control, no additional dependencies
   - Cons: Requires manual function calling logic, streaming implementation, error handling
   - Rejected: Too much boilerplate, harder to maintain

2. **LangChain**
   - Pros: Rich ecosystem, many integrations, well-documented
   - Cons: Heavy dependency, complex abstraction layers, overkill for our use case
   - Rejected: Adds unnecessary complexity for 5 simple tools

3. **Custom Agent Loop**
   - Pros: Full control, tailored to exact requirements
   - Cons: Significant development effort, testing burden, maintenance overhead
   - Rejected: Reinventing the wheel, not aligned with "use official SDKs" principle

### Implementation Pattern

```python
import asyncio
from agents import Agent, Runner, function_tool

# Define tools with function_tool decorator
@function_tool
def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task for the user.

    Args:
        user_id: The user's unique identifier
        title: The task title (required)
        description: Optional task description

    Returns:
        dict with task_id, title, created_at
    """
    # Call service layer (shared with REST API)
    task = task_service.create_task(user_id, title, description)
    return {"task_id": task.id, "title": task.title, "created_at": task.created_at}

# Create agent with tools
todo_agent = Agent(
    name="TodoAgent",
    instructions="You are a helpful task management assistant...",
    tools=[add_task, list_tasks, complete_task, delete_task, update_task],
    model="gpt-4o-2024-11-20"
)

# Run agent with Runner.run()
async def handle_chat(user_message: str, user_id: str):
    result = await Runner.run(todo_agent, input=user_message)
    return result.final_output
```

**Key Points**:
- Import from `agents` package (not `openai_agents`)
- Tools decorated with `@function_tool` for automatic schema generation
- Agent configured with instructions and model selection (no separate client needed)
- Runner.run() is a class method that executes the agent
- Service layer called from within tools for business logic reuse

**Note**: The OpenAI Agents SDK does not expose `run_streamed()` method. For streaming, we'll need to implement SSE streaming at the FastAPI layer by yielding chunks from the agent's response.

---

## 2. MCP Tools Design

### Decision
Implement **in-process MCP tools** using `function_tool` pattern rather than subprocess-based MCP server.

### Rationale
- **Lower Latency**: In-process function calls (< 1ms) vs subprocess communication (30-50ms overhead)
- **Shared Database Session**: Direct access to SQLAlchemy session and service layer without serialization
- **Simpler Deployment**: No separate MCP server process to manage, monitor, or scale
- **Easier Debugging**: Standard Python debugging tools work, no inter-process complexity
- **Better Error Handling**: Direct exception propagation, no protocol-level error parsing

### Alternatives Considered
1. **stdio Subprocess MCP**
   - Pros: Process isolation, language-agnostic MCP protocol
   - Cons: 30-50ms latency overhead, complex serialization, harder debugging
   - Rejected: Latency unacceptable for interactive chat, adds operational complexity

2. **HTTP MCP Server**
   - Pros: Network-accessible, could support external MCP clients
   - Cons: Network latency, authentication complexity, separate deployment
   - Rejected: Not needed for single-application use case, overkill

### Tool Specifications

| Tool Name       | Parameters                                | Returns                          | Service Method                   |
|-----------------|-------------------------------------------|----------------------------------|----------------------------------|
| add_task        | user_id: str, title: str, description: str = "" | dict(task_id, title, created_at) | task_service.create_task()       |
| list_tasks      | user_id: str, status: str = "all"        | list[dict(id, title, status)]    | task_service.get_tasks()         |
| complete_task   | user_id: str, task_id: int               | dict(task_id, status, updated_at)| task_service.complete_task()     |
| delete_task     | user_id: str, task_id: int               | dict(success: bool, message: str)| task_service.delete_task()       |
| update_task     | user_id: str, task_id: int, title: str = None, description: str = None | dict(task_id, updated_fields) | task_service.update_task() |

**Implementation Note**: Each tool validates user_id matches JWT token claim to enforce user isolation.

---

## 3. Streaming Architecture

### Decision
Use **Server-Sent Events (SSE)** for streaming AI responses from backend to frontend.

### Rationale
- **Native Browser Support**: SSE built into all modern browsers via `EventSource` API
- **One-Way Server-to-Client**: Perfect match for AI streaming use case (no client-to-server needed)
- **FastAPI StreamingResponse**: First-class support via `StreamingResponse` with `text/event-stream` MIME type
- **ChatKit Expectation**: OpenAI ChatKit widget designed to consume SSE streams
- **Simpler Than WebSockets**: No bidirectional handshake, no connection state management, auto-reconnect

### Alternatives Considered
1. **WebSockets**
   - Pros: Bidirectional, lower overhead for many messages, widely supported
   - Cons: Overkill for one-way streaming, complex connection lifecycle, requires separate endpoint
   - Rejected: Bidirectional not needed, adds complexity without benefit

2. **Long Polling**
   - Pros: Works with any HTTP client, simple fallback
   - Cons: Inefficient (repeated requests), high latency, poor user experience
   - Rejected: Unacceptable latency for interactive chat

3. **HTTP/2 Server Push**
   - Pros: Part of HTTP/2 standard, efficient
   - Cons: Complex to implement, browser support inconsistent, being deprecated
   - Rejected: Not widely adopted, SSE simpler and more reliable

### Implementation Pattern

```python
import json
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from agents import Runner
from sqlmodel.ext.asyncio.session import AsyncSession

app = FastAPI()

@app.post("/api/{user_id}/chat")
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """Stream AI chat responses via Server-Sent Events."""

    # Validate JWT and user_id match (middleware handles this)

    # Retrieve conversation from database
    conversation = await conversation_service.get_or_create_conversation(
        session, user_id, request.conversation_id
    )

    # Save user message to database
    await conversation_service.add_message(
        session, conversation.id, "user", request.message
    )

    async def generate_stream():
        """Generator function for SSE streaming."""
        from openai.types.responses import ResponseTextDeltaEvent

        # Use Runner.run_streamed() for token-by-token streaming
        result = Runner.run_streamed(todo_agent, input=request.message)

        assistant_message = ""
        async for event in result.stream_events():
            # Filter for text delta events (token-by-token)
            if event.type == "raw_response_event":
                if isinstance(event.data, ResponseTextDeltaEvent):
                    delta = event.data.delta or ""
                    assistant_message += delta

                    # Yield SSE-formatted chunk to client
                    yield f"data: {json.dumps({'content': delta})}\n\n"

        # Save assistant message to database (stateless requirement)
        await conversation_service.add_message(
            session, conversation.id, "assistant", assistant_message
        )

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

**Key Points**:
- `StreamingResponse` with `media_type="text/event-stream"`
- `Runner.run_streamed()` enables token-by-token streaming
- Filter `raw_response_event` with `ResponseTextDeltaEvent` for text chunks
- Each chunk formatted as `data: {json}\n\n` (SSE protocol)
- Accumulate full message while streaming for database persistence (stateless)
- `[DONE]` marker signals stream completion
- Import `ResponseTextDeltaEvent` from `openai.types.responses` for type checking

---

## 4. Conversation Persistence (Updated Implementation)

### Decision
Implement **dual architecture** with SQLiteSession for ChatKit endpoint and database persistence for direct endpoint.

### Rationale
- **ChatKit Integration**: OpenAI Agents SDK's `SQLiteSession` provides automatic conversation memory management
- **Stateless Server Requirement**: Constitution Principle XII mandates stateless architecture (still maintained)
- **Horizontal Scalability**: Any server instance can handle any user's request (no sticky sessions)
- **Survives Server Restarts**: SQLiteSession persists in SQLite database, conversations survive restarts
- **Automatic Memory**: SDK handles history retrieval/storage automatically
- **Dual Support**: Both ChatKit protocol and direct REST endpoints supported

### Alternatives Considered
1. **In-Memory with Redis Cache**
   - Pros: Fast access, reduces database load
   - Cons: Violates stateless requirement, adds Redis dependency, cache invalidation complexity
   - Rejected: Not compliant with constitution stateless mandate

2. **File-Based Storage**
   - Pros: Simple, no database schema changes
   - Cons: Slow, no concurrent access, poor scalability, hard to query
   - Rejected: Not suitable for multi-user web application

3. **Session Storage**
   - Pros: Native to web apps, simple integration
   - Cons: Violates stateless requirement, lost on session expiry, not persistent
   - Rejected: Conversations must persist across sessions

### Stateless Request Cycle Flow

**ChatKit Endpoint** (`/api/chatkit`):
```text
Step 1: User sends message via ChatKit widget to POST /api/chatkit
Step 2: Middleware validates JWT token (user_id extracted)
Step 3: ChatKit server creates/loads SQLiteSession for user+thread
        session_id = f"user_{user_id}_thread_{thread.id}"
        session = SQLiteSession(session_id, "chat_sessions.db")
Step 4: SQLiteSession automatically retrieves conversation history
        history = await session.get_items()  # Returns full conversation
Step 5: Agent invoked with session (automatic memory management)
        Runner.run_streamed(agent, user_message, session=session)
Step 6: Agent streams response chunks to client via SSE
Step 7: SQLiteSession automatically stores conversation for future turns
Step 8: Server state cleared (stateless), session persists in SQLite
```

**Direct Chat Endpoint** (`/api/{user_id}/chat`):
```text
Step 1: User sends message to POST /api/{user_id}/chat
Step 2: Middleware validates JWT token (user_id matches token claim)
Step 3: Endpoint retrieves conversation from database (or creates new)
        SELECT * FROM conversations WHERE user_id = ? AND id = ?
Step 4: Endpoint retrieves conversation history from database
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at
Step 5: User message saved to database
        INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)
Step 6: Agent invoked with full conversation history (from database)
Step 7: Agent streams response chunks to client via SSE
Step 8: Full assistant message saved to database after streaming completes
        INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)
Step 9: Database session closed, server state cleared (stateless)
```

**Database Schema**:

```python
# models/conversation.py
from datetime import datetime
from sqlmodel import Field, SQLModel
from typing import Optional

class Conversation(SQLModel, table=True):
    """Conversation model for AI chatbot.

    State Transitions: [New] → [Active] → [Archived/Deleted]
    Current Scope: Active only (no archived/deleted states implemented)
    """
    __tablename__ = "conversations"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Keys & Indexes
    user_id: str = Field(index=True)  # User isolation (indexed for queries)

    # Timestamps with default_factory
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Validation: user_id non-empty, created_at <= updated_at enforced at service layer


# models/message.py
from datetime import datetime
from sqlmodel import Field, SQLModel, Column
from sqlalchemy import JSON
from typing import Optional

class Message(SQLModel, table=True):
    """Message model for conversation history.

    Immutable: No state transitions, messages are never modified after creation.
    """
    __tablename__ = "messages"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Keys & Indexes
    conversation_id: int = Field(foreign_key="conversations.id", index=True)
    user_id: str = Field(index=True)  # Denormalized for user isolation queries

    # Message Data
    role: str  # "user" | "assistant" | "system" (validated at service layer)
    content: str  # Message content (non-empty, validated at service layer)

    # Tool Calls (JSON) - only for "assistant" role
    tool_calls: Optional[dict] = Field(default=None, sa_column=Column(JSON))

    # Timestamp
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # Validation Rules (enforced at service layer):
    # - conversation_id must exist in conversations table
    # - user_id must match parent conversation.user_id
    # - role must be in ["user", "assistant", "system"]
    # - content must be non-empty
    # - tool_calls must be valid JSON (assistant role only)
```

**Database Indexes**:

```sql
-- Conversation indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- Message indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Composite index for conversation history queries
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
```

**Key Points**:
- **Conversation**: Uses `Optional[int]` for id (auto-generated), `default_factory` for timestamps
- **Message**: Uses `sa_column=Column(JSON)` for tool_calls JSON field, multiple indexes for query optimization
- **User Isolation**: Both models have user_id indexed for efficient per-user queries
- **Immutability**: Messages never modified (append-only log for conversation history)
- **State**: Conversations currently Active only (no archived/deleted implementation in Phase 3)
- **Validation**: All validation rules enforced at service layer (not database constraints)
- **Relationships**: Conversation → Messages (ordered by created_at for chronological history)

**SQLiteSession Storage** (ChatKit endpoint):
- **Location**: `chat_sessions.db` (SQLite database)
- **Schema**: Managed automatically by OpenAI Agents SDK
- **Session ID**: `user_{user_id}_thread_{thread.id}` for user+thread isolation
- **Automatic**: History retrieval and storage handled by SDK
- **Persistence**: Survives server restarts (SQLite file-based)

---

## 5. Model Factory Pattern

### Decision
Implement **centralized factory** with environment variable-based AI provider selection.

### Rationale
- **Single Configuration Point**: All AI provider configuration in one place (`agents/factory.py`)
- **Easy Provider Switching**: Change `LLM_PROVIDER=gemini` to switch from OpenAI to Gemini
- **No Hardcoded Keys**: API keys from environment variables, never in code
- **Testable**: Mock factory in tests without touching agent code
- **Future-Proof**: Easy to add new providers (Claude, Llama) without changing agent logic

### Implementation Pattern

```python
# backend/src/agents/factory.py
import os
from openai import AsyncOpenAI
from agents import set_default_openai_client, set_default_openai_key
from agents.extensions.models.litellm_model import LitellmModel

def configure_openai_client():
    """Configure AsyncOpenAI client for OpenAI models."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    # Set default client for the agents SDK
    client = AsyncOpenAI(api_key=api_key)
    set_default_openai_client(client, use_for_tracing=True)
    return client

def create_agent_model(provider: str | None = None, model: str | None = None):
    """Create agent with configured model based on environment.

    Args:
        provider: Override LLM_PROVIDER env var ("openai" | "gemini")
        model: Override model name

    Returns:
        Model configuration for Agent

    Raises:
        ValueError: If provider not supported or API key missing
    """
    provider = provider or os.getenv("LLM_PROVIDER", "openai")

    if provider == "openai":
        # Configure default client
        configure_openai_client()
        # Return model string (uses default client)
        return model or os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o-2024-11-20")

    elif provider == "gemini":
        # Use LiteLLM for Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        model_name = model or os.getenv("GEMINI_DEFAULT_MODEL", "gemini-2.0-flash")
        return LitellmModel(
            model=f"gemini/{model_name}",
            api_key=api_key
        )

    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")

# Usage in todo_agent.py
from agents import Agent
from agents.factory import create_agent_model

# Create agent with configured model
todo_agent = Agent(
    name="TodoAgent",
    instructions="You are a helpful task management assistant...",
    tools=[add_task, list_tasks, complete_task, delete_task, update_task],
    model=create_agent_model()  # Reads LLM_PROVIDER from env
)
```

**Environment Variables**:

```bash
# Backend .env
LLM_PROVIDER=openai  # or "gemini"

# OpenAI configuration (required if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o-2024-11-20

# Gemini configuration (required if LLM_PROVIDER=gemini)
GEMINI_API_KEY=...
GEMINI_DEFAULT_MODEL=gemini-2.0-flash
```

**Key Points**:
- OpenAI: Uses `AsyncOpenAI` client configured with `set_default_openai_client()`
- Gemini: Uses `LitellmModel` with "gemini/" prefix for model name
- Factory returns model configuration (string for OpenAI, LitellmModel for Gemini)
- Agent accepts either model string or LitellmModel instance
- AsyncOpenAI enables async/await patterns throughout the codebase
- `use_for_tracing=True` enables built-in tracing for debugging

---

## 6. ChatKit Frontend Integration

### Decision
Use **ChatKit custom backend mode** with JWT authentication from Better Auth session.

### Rationale
- **Full Control Over Agent Logic**: Agent runs in our FastAPI backend, not OpenAI Agent Builder
- **Better Auth Integration**: Reuses existing JWT authentication from Phase 2
- **No Agent Builder Dependency**: Don't need to create/configure agents in OpenAI dashboard
- **Custom Endpoint**: Points to our `/api/{user_id}/chat` endpoint with full control
- **User Isolation**: JWT token ensures user can only access their own conversations

### Implementation Pattern

```typescript
// frontend/src/components/chatkit/ChatWidget.tsx
'use client'

import '@openai/chatkit'
import { useSession } from 'better-auth/react'
import { useEffect, useRef } from 'react'

export function ChatWidget() {
  const { data: session } = useSession()
  const chatkitRef = useRef<any>(null)

  useEffect(() => {
    if (!session?.user || !chatkitRef.current) return

    // Create custom element if it doesn't exist
    if (!chatkitRef.current.hasChildNodes()) {
      const chatkit = document.createElement('openai-chatkit')

      // Configure ChatKit with custom backend
      chatkit.setOptions({
        api: {
          url: `${process.env.NEXT_PUBLIC_CHATKIT_API_URL}/api/${session.user.id}/chat`,
          domainKey: 'todo-app',
          fetch: async (url: string, options: RequestInit) => {
            // Add JWT authentication header
            return fetch(url, {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${session.accessToken}`,
              },
            })
          },
        },
        theme: {
          colorScheme: 'light',
          radius: 'round',
          color: {
            accent: { primary: '#3b82f6', level: 2 },
          },
        },
        composer: {
          placeholder: 'Ask me to manage your tasks...',
        },
      })

      chatkitRef.current.appendChild(chatkit)
    }
  }, [session])

  if (!session?.user) {
    return <div>Please log in to use chat</div>
  }

  return (
    <div
      ref={chatkitRef}
      className="h-[600px] w-full"
    />
  )
}
```

**Frontend Environment Variables**:

```bash
# Frontend .env.local
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000  # Points to FastAPI backend
```

**Key Points**:
- Import `@openai/chatkit` package to register custom element
- Create `<openai-chatkit>` custom element programmatically
- Configure with `setOptions()` method (not JSX props)
- Custom `fetch` function adds JWT authentication from Better Auth
- `api.url` points to our FastAPI backend endpoint
- `domainKey` is required for custom backend mode
- ChatKit handles SSE streaming and message rendering automatically

---

## 7. Service Layer Design

### Decision
Extract CRUD logic into **service layer** with async session management, shared by both MCP tools and REST endpoints.

### Rationale
- **Single Source of Truth**: Both MCP tools and REST API call same business logic
- **Testable**: Services can be unit tested independently of routers and agents
- **Clear Dependency Injection**: Session passed explicitly, no globals or singletons
- **Async Support**: Native async/await for non-blocking database operations
- **Separation of Concerns**: Routers handle HTTP, services handle business logic, models handle data

### Implementation Pattern

```python
# backend/src/services/task_service.py
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from models.task import Task
from datetime import datetime

async def create_task(
    session: AsyncSession,
    user_id: str,
    title: str,
    description: str = ""
) -> Task:
    """Create a new task for the user.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        title: Task title
        description: Optional task description

    Returns:
        Created Task instance
    """
    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        status="pending",
        created_at=datetime.utcnow()
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task

async def get_tasks(
    session: AsyncSession,
    user_id: str,
    status: str = "all"
) -> list[Task]:
    """Retrieve user's tasks with optional status filter.

    Args:
        session: Database session (injected)
        user_id: User's unique identifier
        status: Filter by status ("all" | "pending" | "completed")

    Returns:
        List of Task instances
    """
    query = select(Task).where(Task.user_id == user_id)

    if status != "all":
        query = query.where(Task.status == status)

    result = await session.execute(query)
    return result.scalars().all()

# Similar patterns for: complete_task, delete_task, update_task
```

**Usage in MCP Tools**:

```python
# backend/src/mcp/tools.py
from openai_agents import function_tool
from services import task_service
from database import get_db_session

@function_tool
async def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task via MCP tool."""
    async with get_db_session() as session:
        # Call service layer
        task = await task_service.create_task(session, user_id, title, description)
        return {"task_id": task.id, "title": task.title, "created_at": task.created_at}
```

**Usage in REST Endpoints**:

```python
# backend/src/routers/tasks.py (REFACTORED to use service layer)
from fastapi import APIRouter, Depends
from services import task_service
from database import get_db_session

router = APIRouter()

@router.post("/api/{user_id}/tasks")
async def create_task_endpoint(
    user_id: str,
    request: CreateTaskRequest,
    session: AsyncSession = Depends(get_db_session)
):
    """REST endpoint to create task (now uses service layer)."""
    # Call same service layer as MCP tools
    task = await task_service.create_task(
        session, user_id, request.title, request.description
    )
    return {"task_id": task.id, "title": task.title}
```

**Key Points**:
- Service functions are pure async functions (no class inheritance)
- Database session passed as first parameter (dependency injection)
- Both MCP tools and REST endpoints call same service methods
- Services return domain objects (Task), callers handle serialization
- Clear separation: routers/tools → services → database

---

## Research Summary

| Topic                          | Decision                                      | Confidence | Implementation Status |
|--------------------------------|-----------------------------------------------|------------|----------------------|
| OpenAI Agents SDK Integration  | Use Agents SDK with function_tool pattern     | High       | ✅ Implemented       |
| MCP Tools Design               | In-process tools, no subprocess               | High       | ✅ Implemented       |
| Streaming Architecture         | Server-Sent Events (SSE)                      | High       | ✅ Implemented       |
| Conversation Persistence       | Dual: SQLiteSession + Database persistence    | High       | ✅ Implemented       |
| Model Factory Pattern          | Centralized factory with env-based selection  | High       | ✅ Implemented       |
| ChatKit Frontend Integration   | Custom backend mode with JWT auth             | High       | ✅ Implemented       |
| Service Layer Design           | Async service layer shared by MCP and REST    | High       | ✅ Implemented       |

**Confidence Justification**:
- All decisions align with constitution principles (especially Principle XII)
- Technical choices supported by official documentation and best practices
- Implementation patterns proven in similar projects
- Alternatives thoroughly evaluated with clear rejection criteria
- All decisions contribute to core requirements: stateless, scalable, testable, maintainable

---

## Status

**Status**: ✅ **Complete** - Implementation finished, documentation updated

**Implementation Status**:
- ✅ All 42 tasks completed (see `tasks.md`)
- ✅ All 5 MCP tools implemented
- ✅ ChatKit widget integrated
- ✅ Dual conversation memory (SQLiteSession + database)
- ✅ Both endpoints working (`/api/chatkit` and `/api/{user_id}/chat`)

**Next Steps**:
1. ✅ Implementation complete
2. ⚠️ Load testing for 50 concurrent sessions
3. ⚠️ User acceptance testing
4. ✅ Documentation updated

**Validation Checklist**:
- [x] All 7 research topics documented
- [x] Decisions clearly stated with rationale
- [x] Alternatives considered and rejection criteria explained
- [x] Implementation patterns provided with code examples
- [x] All decisions align with constitution principles
- [x] High confidence in all technical choices
- [x] Actual implementation documented (SQLiteSession approach)
- [x] Differences from plan documented

**See Also**:
- `IMPLEMENTATION_STATUS.md` - Detailed implementation status
- `backend/CONVERSATION_MEMORY.md` - SQLiteSession implementation details

