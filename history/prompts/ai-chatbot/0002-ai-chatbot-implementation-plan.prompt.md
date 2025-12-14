---
id: 0002
title: AI Chatbot Implementation Plan
stage: plan
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: ai-chatbot
branch: 004-ai-chatbot
user: system
command: /sp.plan
labels: [plan, phase3, chatbot, architecture, design-decisions]
links:
  spec: specs/004-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/004-ai-chatbot/plan.md
    status: created
    lines: 1160
tests: []
---

## Prompt

**IMPORTANT: Before creating the plan, you MUST:**
1. Read `.specify/memory/constitution.md` first to understand project principles and Phase 3 mandatory requirements
2. Read `specs/003-ai-chatbot/spec.md` to understand the feature specification
3. Ensure all Phase 3 mandatory requirements from constitution are included in the plan
4. Follow all constitution principles (Spec-Driven Development, Clean Code, etc.)

Create implementation plan for **Phase 3: AI-Powered Todo Chatbot** in `specs/003-ai-chatbot/plan.md`.

**Plan Requirements:**

**Summary Section:**
- Brief description of adding conversational AI interface
- Technology stack: OpenAI ChatKit (frontend), Agents SDK (orchestration), MCP tools (task operations)
- Key feature: Natural language task management with stateless server architecture

**Technical Context:**
- Language/Version: Python 3.13+ (backend), TypeScript/Node.js 22+ (frontend)
- Primary Dependencies: FastAPI, SQLModel, OpenAI Agents SDK, MCP SDK (backend); Next.js 16, @openai/chatkit (frontend)
- Storage: Neon Serverless PostgreSQL (existing + new tables)
- Testing: pytest (backend), vitest (frontend)
- Target Platform: Web application (browser + server)
- Project Type: Web application (frontend + backend)
- Performance Goals: Response streaming < 2s, 50 concurrent sessions
- Constraints: Stateless server (conversation persisted to DB), JWT authentication
- Scale/Scope: Single user per conversation, 5 MCP tools

**Constitution Check:**
- Check all 6 principles (I-VI) against the plan
- Mark each as PASS/FAIL with notes
- Gate Result: Must be PASSED before proceeding

**Project Structure:**
- Documentation structure (specs/003-ai-chatbot/)
- Source code structure (phase-3/backend/ and phase-3/frontend/)
- New directories: services/, agents/, mcp/, models/conversation.py, models/message.py
- New files: routers/chat.py, schemas/chat.py, components/chatkit/, app/chat/

**Architecture Overview:**
- ASCII diagram showing system flow
- Request flow: POST /api/chat → JWT → Conversation service → Agent → MCP tools → Task service → Database
- Response flow: Streaming via SSE

**Key Design Decisions (5 required):**
1. Service Layer Extraction
2. Model Factory Pattern
3. In-Process MCP Tools
4. Stateless Chat Architecture
5. SSE Streaming

**Implementation Phases (7 phases required):**
- Phase A: Service Layer Foundation
- Phase B: Database Models
- Phase C: MCP Tools
- Phase D: Agent Integration
- Phase E: Chat API
- Phase F: Frontend ChatKit
- Phase G: Testing & Polish

**Environment Variables, Dependencies, Risk Mitigation**

## Response snapshot

Created comprehensive Phase 3 AI-Powered Todo Chatbot implementation plan following all constitution requirements and Spec-Kit Plus workflow.

**Plan Structure:**
- **Branch**: 004-ai-chatbot
- **File**: specs/004-ai-chatbot/plan.md (1160 lines)
- **Status**: Ready for task generation

**Summary:**
AI-powered conversational interface for task management using OpenAI ChatKit (frontend), Agents SDK (orchestration), and Official MCP SDK (tools). Stateless server architecture with database-persisted conversations, SSE streaming responses, and shared service layer for MCP tools and REST endpoints.

**Constitution Check (All PASS):**
- ✅ Principle I: Persistent Database Storage (Conversation, Message models)
- ✅ Principle II: Web-First Multi-User (Next.js + FastAPI, JWT auth)
- ✅ Principle III: Clean Code (Service layer, small focused functions)
- ✅ Principle IV: Modular Monorepo (/frontend, /backend structure)
- ✅ Principle V: Spec-Driven Development (Following workflow)
- ✅ Principle VI: Automated Testing (pytest, vitest, >80% coverage)
- ✅ Principle XII: AI Conversational Interface (All Phase 3 requirements)

**GATE RESULT**: ✅ PASSED - All principles satisfied

**Architecture:**
- Comprehensive ASCII diagram showing system components
- Detailed request flow (12 steps: User → Frontend → Backend → Agent → MCP → Service → Database)
- Response flow with SSE streaming

**Key Design Decisions (5):**
1. **Service Layer Extraction**: Shared business logic for MCP tools + REST endpoints
2. **Model Factory Pattern**: AI provider abstraction (OpenAI/Gemini)
3. **In-Process MCP Tools**: Lower latency, simpler deployment
4. **Stateless Chat Architecture**: Horizontal scalability, resilience
5. **SSE Streaming**: Better UX, ChatKit compatibility

**Implementation Phases (7 phases, 29-37 hours total):**
- **Phase A**: Service Layer Foundation (2-3 hours) - task_service.py extraction
- **Phase B**: Database Models (3-4 hours) - Conversation, Message models + migrations
- **Phase C**: MCP Tools (4-5 hours) - 5 tools with Official MCP SDK
- **Phase D**: Agent Integration (5-6 hours) - TodoAgent + factory pattern
- **Phase E**: Chat API (5-6 hours) - SSE streaming endpoint
- **Phase F**: Frontend ChatKit (4-5 hours) - Widget integration
- **Phase G**: Testing & Polish (6-8 hours) - Integration tests, error handling, performance

**Project Structure:**
- **Backend**: New directories (services/, agents/, mcp/), 9 new files, refactored routers
- **Frontend**: New directories (components/chatkit/, app/chat/), 5 new files
- **Tests**: 7 new test files (unit, integration, contract)

**Dependencies:**
- **Backend**: openai-agents >=0.1.0, mcp >=1.0.0, google-generativeai (optional)
- **Frontend**: @openai/chatkit >=0.1.0

**Environment Variables:**
- Backend: LLM_PROVIDER, OPENAI_API_KEY, OPENAI_DEFAULT_MODEL, GEMINI_* (optional)
- Frontend: NEXT_PUBLIC_CHATKIT_API_URL

**Risk Mitigation (6 risks identified):**
1. ChatKit SDK unavailable → Fallback to custom chat UI
2. SSE streaming complexity → Start non-streaming, add incrementally
3. MCP SDK learning curve → Reference examples, fallback to direct function calling
4. AI model rate limits → Retry with backoff, multi-provider fallback
5. Database load → Connection pooling, indexes, caching
6. NLU accuracy → Clear error messages, example prompts, graceful degradation

**Success Metrics:** 8 measurable outcomes aligned with spec success criteria (SC-001 to SC-008)

**Next Steps:** Run `/sp.tasks` to generate detailed task breakdown

## Outcome

- ✅ Impact: Comprehensive implementation plan created with all Phase 3 requirements addressed, constitution compliance verified, and ready for task generation
- 🧪 Tests: No automated tests (planning document). Constitution check performed - all principles PASS
- 📁 Files: 1 file created (plan.md: 1160 lines)
- 🔁 Next prompts: `/sp.tasks` (generate implementation tasks)
- 🧠 Reflection: Plan successfully balances technical depth with clarity. 7 implementation phases provide clear progression path. 5 key design decisions justified with rationale and alternatives. Comprehensive architecture diagram and request flow aid implementation. Risk mitigation addresses all major uncertainties.

## Evaluation notes (flywheel)

- Failure modes observed: None. Plan created on first attempt with comprehensive coverage
- Graders run and results (PASS/FAIL): Constitution Check - PASS (all 7 principles validated)
- Prompt variant (if applicable): Standard `/sp.plan` workflow with Phase 3 requirements integration
- Next experiment (smallest change to try): N/A - ready to proceed with task generation
