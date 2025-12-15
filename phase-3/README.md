# Phase 3: AI-Powered Todo Chatbot

**Status**: ✅ Complete
**Version**: 1.0.0
**Date**: 2025-12-14

AI-powered conversational interface for natural language task management using OpenAI ChatKit, OpenAI Agents SDK, and Official MCP SDK.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

### Core Functionality

✅ **Natural Language Task Management**
- Add tasks: "Add a task to buy groceries"
- List tasks: "Show me all my tasks", "What's pending?"
- Complete tasks: "Mark task 3 as complete"
- Delete tasks: "Delete task 2", "Remove the shopping task"
- Update tasks: "Change task 1 to 'Call mom tonight'"

✅ **Conversation Context**
- Multi-turn conversations with context retention
- Follow-up references: "Complete the first one", "Update that task"
- Conversation history persists across sessions and server restarts

✅ **Real-Time Streaming**
- Server-Sent Events (SSE) for streaming AI responses
- Responses begin streaming < 2 seconds after message submission
- ChatKit widget displays responses in real-time

✅ **Production Features**
- JWT authentication with Better Auth integration
- User isolation (each user sees only their own tasks and conversations)
- Error handling with retry logic and exponential backoff
- Rate limit handling for OpenAI/Gemini APIs
- Conversation history management

---

## Architecture

### System Overview

```
┌──────────────┐      HTTPS      ┌─────────────────┐      REST/SSE      ┌──────────────────┐
│   Browser    │ ←────────────→  │  Next.js 16     │ ←────────────────→ │  FastAPI         │
│  (ChatKit)   │                  │  Frontend       │                     │  Backend         │
└──────────────┘                  └─────────────────┘                     └──────────────────┘
                                         │                                        │
                                         │ Better Auth JWT                        │
                                         ▼                                        ▼
                                  ┌─────────────────┐                     ┌──────────────────┐
                                  │  Better Auth    │                     │  OpenAI Agents   │
                                  │  (Auth Server)  │                     │  SDK + MCP Tools │
                                  └─────────────────┘                     └──────────────────┘
                                         │                                        │
                                         │                                        │
                                         ▼                                        ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │           Neon Serverless PostgreSQL                    │
                                  │  - Users, Sessions (Better Auth)                        │
                                  │  - Tasks, Conversations, Messages (Application)         │
                                  └────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User sends message** → ChatKit widget
2. **Frontend** → Backend: `POST /api/{user_id}/chat` with JWT token
3. **Backend validates JWT** → Extracts user_id
4. **Conversation service** → Loads history from database
5. **TodoAgent (OpenAI Agents SDK)** → Processes message with MCP tools
6. **MCP Tools** → Execute task operations (add, list, complete, delete, update)
7. **Response streams** → Client via Server-Sent Events (SSE)
8. **Conversation service** → Saves message and response to database

---

## Tech Stack

### Backend

- **Framework**: FastAPI (Python 3.13+)
- **AI Orchestration**: OpenAI Agents SDK (>=0.2.9)
- **MCP Protocol**: Official MCP SDK (>=1.0.0)
- **Database**: Neon Serverless PostgreSQL
- **ORM**: SQLModel with Alembic migrations
- **Authentication**: JWT verification (shared secret with Better Auth)
- **Streaming**: Server-Sent Events (SSE)

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+
- **Chat UI**: OpenAI ChatKit React (@openai/chatkit-react 1.3.0)
- **Authentication**: Better Auth with JWT plugin
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks

### Database Schema

```sql
-- Conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  INDEX idx_conversations_user_id (user_id)
);

-- Messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role VARCHAR NOT NULL,  -- 'user' | 'assistant'
  content TEXT NOT NULL,
  tool_calls JSON,
  created_at TIMESTAMP NOT NULL,
  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_user_id (user_id)
);

-- Tasks (from Phase 2)
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  INDEX idx_tasks_user_id (user_id)
);
```

---

## Prerequisites

### Required Software

- **Node.js**: 22+ (for frontend)
- **Python**: 3.13+ (for backend)
- **UV**: Python package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **pnpm**: 9+ (for frontend: `npm install -g pnpm`)
- **PostgreSQL**: Neon Serverless PostgreSQL account
- **OpenAI API Key**: For GPT models (or Gemini API key)

### API Keys Required

1. **OpenAI API Key** (for GPT-4o or GPT-4o-mini)
   - Sign up: https://platform.openai.com/signup
   - Get API key: https://platform.openai.com/api-keys

2. **Neon PostgreSQL Database**
   - Sign up: https://neon.tech
   - Create database and get connection string

3. **Better Auth Secret**
   - Generate: `openssl rand -base64 32`
   - Same secret for frontend and backend

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd Todo_giaic_five_phases/phase-3
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies with UV
uv sync --extra dev

# Create .env file
cp .env.example .env
# Edit .env with your credentials (see Configuration section)

# Run database migrations
uv run alembic upgrade head
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Create .env.local file
cp .env.local.example .env.local
# Edit .env.local with your credentials (see Configuration section)
```

---

## Configuration

### Backend Environment Variables

Create `backend/.env`:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Better Auth (MUST match frontend)
BETTER_AUTH_SECRET=your-secret-key-here

# AI Provider Configuration
LLM_PROVIDER=openai  # or "gemini"

# OpenAI Configuration (if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-proj-...
OPENAI_DEFAULT_MODEL=gpt-4o-2024-11-20  # or gpt-4o-mini

# Gemini Configuration (if LLM_PROVIDER=gemini)
GEMINI_API_KEY=AIza...
GEMINI_DEFAULT_MODEL=gemini-2.0-flash-exp

# Server Configuration
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
LOG_LEVEL=INFO
PORT=8000
REQUEST_TIMEOUT=30
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```bash
# Backend API URL
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000

# Better Auth (MUST match backend)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Database (for Better Auth)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional: Production domain key for ChatKit
# NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
```

**CRITICAL**: `BETTER_AUTH_SECRET` MUST be identical in both frontend and backend for JWT verification to work.

---

## Running the Application

### Development Mode (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
uv run uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
pnpm dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Mode

**Backend:**
```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
pnpm build
pnpm start
```

### Docker (Full Stack)

```bash
# From project root
docker-compose up

# Or build and run backend only
cd backend
docker build -t todo-backend .
docker run -p 8000:8000 --env-file .env todo-backend
```

---

## Usage

### Getting Started

1. **Sign up / Sign in** at http://localhost:3000
2. **Navigate to Chat** via "AI Chat" link in navigation
3. **Start chatting** with the AI assistant

### Example Conversations

#### Adding Tasks

```
You: Add a task to buy groceries
AI: ✅ I've added "Buy groceries" to your task list!

You: Remind me to call mom tonight
AI: ✅ Task created: "Call mom tonight"
```

#### Listing Tasks

```
You: Show me all my tasks
AI: Here are your tasks:
1. Buy groceries (pending)
2. Call mom tonight (pending)
3. Finish report (completed)

You have 2 pending tasks and 1 completed task.

You: What's pending?
AI: You have 2 pending tasks:
1. Buy groceries
2. Call mom tonight
```

#### Completing Tasks

```
You: Mark task 1 as complete
AI: ✅ Great job! I've marked "Buy groceries" as complete.

You: I finished calling mom
AI: ✅ Excellent! I've marked "Call mom tonight" as complete.
```

#### Deleting Tasks

```
You: Delete task 2
AI: ✅ I've removed "Call mom tonight" from your task list.

You: Remove the groceries task
AI: ✅ Task "Buy groceries" has been deleted.
```

#### Updating Tasks

```
You: Change task 1 to "Call mom at 8pm"
AI: ✅ I've updated task 1 to "Call mom at 8pm"

You: Update the report task to "Finish Q4 report"
AI: ✅ Task updated to "Finish Q4 report"
```

#### Follow-up References

```
You: Show my tasks
AI: Here are your tasks:
1. Buy groceries
2. Call mom
3. Finish report

You: Complete the first one
AI: ✅ Great job! I've marked "Buy groceries" as complete.

You: Delete that report task
AI: ✅ I've removed "Finish report" from your task list.
```

---

## API Endpoints

### Chat Endpoints

#### POST `/api/{user_id}/chat`

Stream AI chat responses with Server-Sent Events.

**Headers:**
- `Authorization: Bearer <jwt_token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "conversation_id": 1,  // optional, null for new conversation
  "message": "Add a task to buy groceries"
}
```

**Response:** Server-Sent Events stream

```
data: {"type": "content", "content": "✅ I've added"}
data: {"type": "content", "content": " \"Buy groceries\""}
data: {"type": "content", "content": " to your task list!"}
data: {"type": "done", "conversation_id": 1}
```

**Error Response:**
```
data: {"type": "error", "code": "RATE_LIMIT_EXCEEDED", "message": "The AI service is currently experiencing high demand..."}
```

#### GET `/api/{user_id}/conversations`

List user's conversations.

**Headers:**
- `Authorization: Bearer <jwt_token>` (required)

**Query Parameters:**
- `limit` (optional, default: 50): Number of conversations to return
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "created_at": "2025-12-14T10:30:00",
        "updated_at": "2025-12-14T11:45:00"
      }
    ],
    "count": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### MCP Tools (Internal)

The backend exposes 5 MCP tools for the AI agent:

1. **add_task(user_id, title, description)** - Create new task
2. **list_tasks(user_id, status)** - List tasks (all/pending/completed)
3. **complete_task(user_id, task_id)** - Mark task as complete
4. **delete_task(user_id, task_id)** - Remove task
5. **update_task(user_id, task_id, title, description)** - Update task details

---

## Environment Variables

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | - | Shared secret for JWT (must match frontend) |
| `LLM_PROVIDER` | ✅ | `openai` | AI provider: `openai` or `gemini` |
| `OPENAI_API_KEY` | If `LLM_PROVIDER=openai` | - | OpenAI API key |
| `OPENAI_DEFAULT_MODEL` | No | `gpt-4o-2024-11-20` | OpenAI model name |
| `GEMINI_API_KEY` | If `LLM_PROVIDER=gemini` | - | Gemini API key |
| `GEMINI_DEFAULT_MODEL` | No | `gemini-2.0-flash-exp` | Gemini model name |
| `ENVIRONMENT` | No | `development` | Environment: `development` or `production` |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `LOG_LEVEL` | No | `INFO` | Log level: DEBUG, INFO, WARNING, ERROR |
| `PORT` | No | `8000` | Backend server port |
| `REQUEST_TIMEOUT` | No | `30` | Request timeout in seconds |

### Frontend (.env.local)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_CHATKIT_API_URL` | ✅ | - | Backend API base URL |
| `BETTER_AUTH_SECRET` | ✅ | - | Shared secret for JWT (must match backend) |
| `BETTER_AUTH_URL` | ✅ | - | Frontend URL for Better Auth |
| `DATABASE_URL` | ✅ | - | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` | No | - | ChatKit domain key (for production) |

---

## Testing

### Backend Tests

```bash
cd backend

# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=. --cov-report=html

# Run specific test file
uv run pytest tests/test_chat_error_handling.py -v

# Run specific test
uv run pytest tests/test_chat.py::test_chat_endpoint -v
```

### Frontend Tests

```bash
cd frontend

# Run all tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

### Manual Testing

1. **Start both services** (backend + frontend)
2. **Sign in** to create authenticated session
3. **Navigate to /chat** page
4. **Test scenarios:**
   - Add task: "Add a task to test the chat"
   - List tasks: "Show me all my tasks"
   - Complete task: "Mark task 1 as complete"
   - Delete task: "Delete task 2"
   - Update task: "Change task 1 to 'Updated task'"
   - Follow-up: "Show tasks" → "Complete the first one"

---

## Deployment

### Backend Deployment

**Option 1: Docker**
```bash
cd backend
docker build -t todo-backend .
docker run -p 8000:8000 --env-file .env todo-backend
```

**Option 2: Uvicorn**
```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Deployment

**Option 1: Vercel** (Recommended for Next.js)
```bash
cd frontend
vercel deploy --prod
```

**Option 2: Docker**
```bash
cd frontend
docker build -t todo-frontend .
docker run -p 3000:3000 todo-frontend
```

### Environment Variables (Production)

**Backend:**
- Set `ENVIRONMENT=production`
- Use production database URL
- Use HTTPS for `CORS_ORIGINS`
- Set appropriate `LOG_LEVEL` (WARNING or ERROR)

**Frontend:**
- Set `NEXT_PUBLIC_CHATKIT_API_URL` to production backend URL
- Use production `DATABASE_URL`
- Set `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` for ChatKit domain key (optional)

---

## Troubleshooting

### ChatKit Widget Blank/Not Rendering

**Solution**: Ensure ChatKit CDN script is loaded in `app/layout.tsx`:

```tsx
<Script
  src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
  strategy="afterInteractive"
/>
```

### "AI service unavailable" errors

**Causes:**
1. Invalid OpenAI API key → Check `OPENAI_API_KEY` in backend `.env`
2. Rate limit exceeded → Wait and retry, or upgrade OpenAI API tier
3. Network issues → Check internet connection

**Solution**: Check backend logs for detailed error messages:
```bash
cd backend
tail -f logs/app.log  # or check console output
```

### JWT Authentication Failing

**Cause**: `BETTER_AUTH_SECRET` mismatch between frontend and backend

**Solution**:
1. Verify both `.env` files have identical `BETTER_AUTH_SECRET`
2. Restart both frontend and backend after changing
3. Clear browser cookies and sign in again

### Database Connection Errors

**Causes:**
1. Invalid `DATABASE_URL` format
2. Neon database suspended (free tier)
3. Network issues

**Solution**:
1. Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/dbname`
2. Check Neon dashboard for database status
3. Test connection: `psql $DATABASE_URL`

### Conversation History Not Persisting

**Cause**: Database not saving messages

**Solution**:
1. Check backend logs for database errors
2. Verify migrations applied: `uv run alembic upgrade head`
3. Check `conversations` and `messages` tables exist:
   ```sql
   SELECT * FROM information_schema.tables
   WHERE table_name IN ('conversations', 'messages');
   ```

---

## Contributing

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Make changes** following code standards
3. **Write tests** for new functionality
4. **Run tests**: `pnpm test` (frontend), `uv run pytest` (backend)
5. **Commit**: `git commit -m "feat: add your feature"`
6. **Push**: `git push origin feature/your-feature`
7. **Create Pull Request**

### Code Standards

**Backend (Python):**
- Follow PEP 8 style guide
- Use type hints for all functions
- Write docstrings for public functions
- Run linter: `uv run ruff check .`
- Format code: `uv run black .`

**Frontend (TypeScript):**
- Follow ESLint rules
- Use TypeScript strict mode
- Write JSDoc comments for complex functions
- Run linter: `pnpm lint`
- Format code: `pnpm format`

---

## License

MIT License - See LICENSE file for details

---

## Support

- **Documentation**: See `/specs/004-ai-chatbot/` directory
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Built with ❤️ using OpenAI ChatKit, OpenAI Agents SDK, and FastAPI**
