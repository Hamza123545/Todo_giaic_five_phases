# Phase III: AI Chatbot Quickstart Guide

**Feature**: AI-Powered Todo Chatbot
**Created**: 2025-12-14
**Status**: Ready for Implementation

This guide provides step-by-step instructions to set up and test the AI-powered conversational interface for task management.

## Prerequisites

Before starting Phase III implementation, ensure these Phase II components are working:

- ✅ **Phase 2 Backend Running**: FastAPI backend at `http://localhost:8000`
- ✅ **Phase 2 Frontend Running**: Next.js frontend at `http://localhost:3000`
- ✅ **Neon PostgreSQL Configured**: Database accessible via `DATABASE_URL` environment variable
- ✅ **Better Auth Working**: User signup/signin functional with JWT token issuance
- ✅ **OpenAI API Key** OR **Gemini API Key**: Valid API key with sufficient quota

## Setup Steps

### 1. Backend Dependencies

Install required Python packages for AI agents and MCP:

```bash
cd backend
# Install core packages
uv add openai-agents mcp

# Install LiteLLM with openai-agents integration for Gemini support
uv add "openai-agents[litellm]"
```

**Note**: The `openai-agents[litellm]` package includes LiteLLM integration, which is required if you plan to use Gemini models. For OpenAI-only setups, you can skip this step.

Verify installation:

```bash
uv pip list | grep -E "(openai-agents|mcp|litellm)"
```

Expected output:
```
litellm              1.80.0+
mcp                  1.0.0+
openai-agents        0.2.9+
```

### 2. Environment Variables

#### Backend `.env` Configuration

**Option A: Using OpenAI**

```bash
# AI Provider Configuration
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_DEFAULT_MODEL=gpt-4o

# Existing Phase 2 Variables (keep these)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-shared-secret
```

**Option B: Using Gemini**

```bash
# AI Provider Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=...your-gemini-key-here...
GEMINI_DEFAULT_MODEL=gemini-1.5-flash

# Existing Phase 2 Variables (keep these)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-shared-secret
```

#### Frontend `.env.local` Configuration

```bash
# ChatKit API Configuration
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/api/chat

# Optional: ChatKit Domain Key (required for production deployment)
# NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key

# Existing Phase 2 Variables (keep these)
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-shared-secret
```

**Notes**:
- The `NEXT_PUBLIC_CHATKIT_API_URL` should be the full URL to your chat endpoint, not a relative path.
- `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` is **optional for local development** (localhost works without it) but **required for production** deployment with domain allowlisting.

### 3. Database Tables

#### Option A: Auto-Creation (Recommended for Development)

SQLModel will automatically create Conversation and Message tables on first backend startup. No manual action required.

#### Option B: Manual Migration (Optional)

If you prefer explicit migrations:

```bash
cd backend
# Generate migration
alembic revision --autogenerate -m "Add Conversation and Message tables"

# Apply migration
alembic upgrade head
```

Or using raw SQL:

```bash
psql $DATABASE_URL -f scripts/create_chat_tables.sql
```

### 4. Start Backend

```bash
cd backend
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uvicorn src.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### Backend Health Check

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Expected: {"status": "healthy"}
```

#### Test Chat Endpoint

```bash
# Replace TOKEN with valid JWT from Better Auth login
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me with my tasks?"}'
```

**Expected Response** (streaming SSE format):
```
data: {"content": "Hello! I"}
data: {"content": "'d be happy"}
data: {"content": " to help"}
...
data: [DONE]
```

### 5. Frontend Dependencies

Install ChatKit package for the conversational UI:

```bash
cd frontend
# For React/Next.js applications
pnpm add @openai/chatkit-react
# Or using npm
npm install @openai/chatkit-react
```

**Alternative**: If using vanilla JavaScript (not React), use:
```bash
pnpm add @openai/chatkit
```

Verify installation:

```bash
pnpm list @openai/chatkit-react
# Expected: @openai/chatkit-react@latest
```

### 6. Start Frontend

```bash
cd frontend
pnpm dev
# Or: npm run dev
```

**Expected Output:**
```
  ▲ Next.js 16.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

#### Navigate to Chat Interface

Open your browser and go to:
```
http://localhost:3000/chat
```

**Expected Behavior:**
1. If not logged in → Redirected to login page
2. After login → Chat interface appears with ChatKit widget
3. Chat input is active and ready for messages

## Verification Checklist

Use this checklist to confirm all Phase III components are working:

### Backend Verification

- [ ] **Backend starts without errors**: No import errors, no database connection failures
- [ ] **`/api/health` returns 200**: Health endpoint responds successfully
- [ ] **Chat endpoint accepts messages**: POST to `/api/chat` with valid JWT returns response
- [ ] **Streaming response works**: Response arrives as Server-Sent Events (SSE) stream
- [ ] **Database tables created**: `conversations` and `messages` tables exist in database

### Frontend Verification

- [ ] **Frontend starts without errors**: No compilation errors, no missing dependencies
- [ ] **Chat page renders**: `/chat` route loads successfully
- [ ] **ChatKit widget appears**: OpenAI ChatKit custom element is visible
- [ ] **Authentication works**: JWT token attached to chat API requests
- [ ] **Messages send successfully**: User can type and send messages

### Integration Verification

- [ ] **Tasks can be created via chat**: "Add a task to buy groceries" creates task
- [ ] **Tasks can be listed via chat**: "Show me all my tasks" displays task list
- [ ] **Tasks can be completed via chat**: "Mark task 1 as complete" updates task status
- [ ] **Tasks can be deleted via chat**: "Delete task 2" removes task
- [ ] **Tasks can be updated via chat**: "Change task 1 to 'Call mom'" updates title
- [ ] **Conversations persist in database**: Messages appear in `messages` table
- [ ] **Conversation context maintained**: Follow-up questions work with context
- [ ] **User isolation enforced**: Users only see their own tasks and conversations

## Test Commands

Once everything is running, test the chatbot with these natural language commands:

| Command | Expected Result |
|---------|-----------------|
| "Add a task to buy groceries" | Creates task with title "Buy groceries", confirms with friendly message |
| "Show me all my tasks" | Lists all user's tasks with their status (pending/completed) |
| "What's pending?" | Lists only incomplete tasks |
| "Mark task 1 as complete" | Marks task with ID 1 as completed, provides congratulatory message |
| "Delete the groceries task" | Identifies task by title, deletes it, confirms deletion |
| "Update task 1 to 'Call mom tonight'" | Changes task 1 title to new value, confirms update |
| "I need to remember to pay bills" | Creates task with extracted title "Pay bills" |
| "What have I completed?" | Lists only completed tasks |
| "Complete the first task" | (After listing tasks) Completes the first task from previous list |

### Test Scenarios

#### Scenario 1: Basic Task Creation
1. Open chat interface
2. Type: "Add a task to buy groceries"
3. **Expected**: Chatbot responds with confirmation, task appears in database
4. Type: "Show me all my tasks"
5. **Expected**: List includes "Buy groceries" task

#### Scenario 2: Task Completion Flow
1. Type: "Show me my pending tasks"
2. **Expected**: List of incomplete tasks
3. Type: "Mark task 1 as complete"
4. **Expected**: Confirmation message, task 1 marked complete
5. Type: "What have I completed?"
6. **Expected**: List includes task 1

#### Scenario 3: Conversation Context
1. Type: "List my tasks"
2. **Expected**: Numbered list of tasks
3. Type: "Complete the first one"
4. **Expected**: Chatbot remembers list, completes first task

#### Scenario 4: Error Handling
1. Type: "Delete task 999"
2. **Expected**: Friendly error message "Task 999 not found"
3. Type: "asdfghjkl"
4. **Expected**: Polite response asking for clarification or suggesting valid commands

## Troubleshooting

### Common Issues and Solutions

#### 401 Unauthorized Error

**Symptom**: Chat endpoint returns 401 status code

**Causes**:
- JWT token missing from request headers
- JWT token expired
- JWT secret mismatch between frontend and backend

**Solutions**:
1. Check Better Auth is issuing tokens: Login and inspect browser network tab
2. Verify `BETTER_AUTH_SECRET` matches in both frontend and backend `.env` files
3. Check token expiration settings in Better Auth configuration
4. Verify Authorization header format: `Bearer <token>`

#### No Response from Chatbot

**Symptom**: Messages send but no response appears

**Causes**:
- OpenAI API key invalid or quota exceeded
- Gemini API key invalid or quota exceeded
- LLM provider misconfigured in environment variables
- Network connection issues

**Solutions**:
1. Verify `OPENAI_API_KEY` or `GEMINI_API_KEY` is valid
2. Check API quota hasn't been exceeded
3. Verify `LLM_PROVIDER` matches available API key (openai or gemini)
4. Check backend logs for API errors
5. Test API key with direct API call

Example OpenAI API test:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

#### Database Connection Errors

**Symptom**: Backend fails to start with database errors

**Causes**:
- DATABASE_URL incorrect or inaccessible
- Database credentials expired
- Network firewall blocking Neon connection

**Solutions**:
1. Verify DATABASE_URL format: `postgresql://user:password@host/database?sslmode=require`
2. Test direct database connection: `psql $DATABASE_URL`
3. Check Neon dashboard for database status
4. Verify IP allowlist in Neon settings (if configured)

#### ChatKit Widget Not Appearing

**Symptom**: Chat page loads but ChatKit widget is missing

**Causes**:
- `@openai/chatkit` package not installed
- ChatKit import statement missing
- Custom element not registered
- JavaScript errors in browser console

**Solutions**:
1. Verify ChatKit installed: `pnpm list @openai/chatkit`
2. Check browser console for JavaScript errors
3. Verify import statement: `import '@openai/chatkit'`
4. Check custom element registration: `<openai-chatkit>` tag present

#### Streaming Not Working

**Symptom**: Response appears all at once instead of token-by-token

**Causes**:
- SSE endpoint not configured correctly
- Frontend not handling SSE stream properly
- Response buffering by proxy/CDN

**Solutions**:
1. Verify backend uses `StreamingResponse` with proper content type
2. Check frontend uses EventSource or fetch with streaming response handling
3. Disable response buffering in development proxy if applicable
4. Test SSE endpoint directly with curl to verify streaming

#### MCP Tools Not Being Called

**Symptom**: Chatbot responds but doesn't perform task operations

**Causes**:
- MCP tools not properly registered with agent
- Tool function signatures incorrect
- Agent not configured to use tools

**Solutions**:
1. Verify all 5 MCP tools are imported and registered
2. Check tool function signatures match expected parameters
3. Verify agent configuration includes tools array
4. Check backend logs for tool invocation errors

#### Conversation History Not Persisting

**Symptom**: Browser refresh loses conversation context

**Causes**:
- Conversations not being saved to database
- Conversation loading logic missing
- Database session management issues

**Solutions**:
1. Check `conversations` and `messages` tables have records after chat
2. Verify conversation_id returned in API response
3. Check conversation loading happens on chat page mount
4. Verify database session commits after message saves

## Production Deployment Notes

### Environment Configuration

**Production Backend Environment Variables:**
```bash
# AI Provider (use production-grade models)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-prod-...
OPENAI_DEFAULT_MODEL=gpt-4o

# Database (production Neon instance)
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host/prod-db?sslmode=require

# Security
BETTER_AUTH_SECRET=<strong-random-secret-64-chars>

# Optional: Rate limiting
RATE_LIMIT_PER_MINUTE=60
```

**Production Frontend Environment Variables:**
```bash
# ChatKit Configuration
NEXT_PUBLIC_CHATKIT_API_URL=https://api.yourdomain.com/chat

# Better Auth (production URLs)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
BETTER_AUTH_URL=https://yourdomain.com
BETTER_AUTH_SECRET=<same-as-backend>

# Optional: ChatKit Domain Key (for production)
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key
```

### Security Checklist

- [ ] HTTPS enabled for all endpoints
- [ ] Strong BETTER_AUTH_SECRET (64+ random characters)
- [ ] API keys stored in secure secrets manager (not in code)
- [ ] CORS properly configured for production domain only
- [ ] Rate limiting enabled on chat endpoint
- [ ] Database connection uses SSL/TLS (`sslmode=require`)
- [ ] User input sanitized before database storage
- [ ] JWT token expiration set appropriately (7 days recommended)

### Performance Optimization

- [ ] Database connection pooling enabled
- [ ] Conversation history pagination implemented (limit last 50 messages)
- [ ] Response streaming chunk size optimized
- [ ] Database indexes on conversation_id and user_id
- [ ] Static assets cached appropriately
- [ ] CDN configured for frontend assets

### Monitoring

**Key Metrics to Track:**
- Chat endpoint response time (target: < 2s for first token)
- OpenAI/Gemini API success rate (target: > 99%)
- Database query performance
- Concurrent chat sessions
- Token usage and costs
- Error rates by error type
- User satisfaction (via feedback mechanism)

## Next Steps

After completing this quickstart:

1. **Review Architecture**: Read `specs/004-ai-chatbot/plan.md` for detailed architecture
2. **Review Research**: Read `specs/004-ai-chatbot/research.md` for technical decisions
3. **Implement Tasks**: Follow `specs/004-ai-chatbot/tasks.md` for implementation steps
4. **Write Tests**: Add integration tests for chat endpoint and MCP tools
5. **User Testing**: Gather feedback on conversation quality and usability
6. **Optimize**: Refine prompts, add error handling, improve response quality

## Support

If you encounter issues not covered in this guide:

1. Check backend logs: Look for error messages in uvicorn output
2. Check frontend console: Open browser DevTools and check Console tab
3. Check database: Verify tables and data using `psql` or database GUI
4. Review specifications: Read full spec in `specs/004-ai-chatbot/spec.md`
5. Review implementation plan: Check `specs/004-ai-chatbot/plan.md` for architecture details

---

**Document Version**: 3.0
**Last Updated**: 2025-12-14
