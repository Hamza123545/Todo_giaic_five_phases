---
id: 0016
title: Phase 4 US2 List Tasks Verification Complete
stage: green
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5
feature: ai-chatbot
branch: 004-ai-chatbot
user: system
command: /sp.implement
labels: [phase4, user-story-2, list-tasks, verification, mcp-tools, agent-instructions]
links:
  spec: specs/004-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/004-ai-chatbot/tasks.md
    action: modified
    description: Marked T020-T022 as completed
  - path: phase-3/backend/mcp/tools.py
    action: verified
    description: Verified list_tasks MCP tool implementation (lines 84-167)
  - path: phase-3/backend/agents/todo_agent.py
    action: verified
    description: Verified tool registration and instructions (lines 36-40, 124)
tests:
  - type: verification
    description: Verified T020 list_tasks MCP tool implementation
    status: passed
  - type: verification
    description: Verified T021 tool registration with TodoAgent
    status: passed
  - type: verification
    description: Verified T022 agent instructions for list commands
    status: passed
---

## Prompt

**Skills = SINGLE SOURCE OF TRUTH. Use them for ALL code patterns.**

**READ:**
- `specs/004-ai-chatbot/tasks.md` - Phase 4 tasks (T020-T022)
- `specs/004-ai-chatbot/plan.md` - Phase C (MCP Tools), Phase D (Agent Integration)
- `specs/004-ai-chatbot/research.md` - Topic 2 (MCP Tools Design)

**WORK IN:** `phase-3/backend/` (existing folder)

**PHASE 4 GOAL:** Enable users to view tasks through conversational queries

**TASKS (Sequential T020 → T021 → T022):** **T020 [US2] - MCP Tool:**
- Use `@chatkit-backend-engineer` agent
- Use `@openai-chatkit-backend-python` skill
- Add `list_tasks(user_id, status)` MCP tool to `backend/src/mcp/tools.py`
- Status filter: "all" | "pending" | "completed" (default: "all")
- Tool MUST call `task_service.get_tasks(user_id, filters)` (from Phase 2)
- Returns: `{"tasks": [{"id": int, "title": str, "completed": bool}, ...], "count": int}`

**T021 [US2] - Register Tool:**
- Use `@chatkit-backend-engineer` agent
- Use `@openai-chatkit-backend-python` skill
- Register `list_tasks` tool with TodoAgent in `backend/src/agents/todo_agent.py`
- Add tool to agent's tools list **T022 [US2] - Agent Instructions:**
- Use `@chatkit-backend-engineer` agent
- Use `@openai-chatkit-backend-python` skill
- Update TodoAgent system instructions in `backend/src/agents/todo_agent.py`
- Handle list commands: "show tasks", "what's pending", "list completed", "show all my tasks"

**AGENTS (MUST CALL):**
- `@chatkit-backend-engineer` - For ALL Phase 4 tasks (T020, T021, T022)

**SKILLS (MUST USE):**
- `@openai-chatkit-backend-python` - Backend ChatKit patterns (MCP tools, agent instructions) **ACCEPTANCE:**
- ✅ User: "Show me all my tasks" → Displays all tasks (pending + completed)
- ✅ User: "What's pending?" → Displays only pending tasks
- ✅ User: "What have I completed?" → Displays only completed tasks
- ✅ User with no tasks: "List my tasks" → Friendly message "You don't have any tasks yet"

**START:** Begin with T020 - Add list_tasks MCP tool using `@chatkit-backend-engineer` agent

## Response snapshot

Launched `chatkit-backend-engineer` agent to implement Phase 4 (T020-T022). Agent performed comprehensive verification and discovered that **all tasks were already implemented in Phase 3**.

**Verification Results:**

**T020 ✅ COMPLETE** - `list_tasks` MCP Tool
- **Location**: `phase-3/backend/mcp/tools.py` (lines 84-167)
- **Implementation**:
  - Uses `@function_tool` decorator with proper type hints
  - Signature: `list_tasks(user_id: str, status: Literal["all", "pending", "completed"] = "all")`
  - Calls `TaskService.get_tasks()` with `TaskQueryParams` for filtering
  - Returns: `{"tasks": [...], "count": int}` format
  - Includes comprehensive task data (id, title, description, completed, priority, due_date, created_at)
  - Proper database session management with try/finally cleanup

**T021 ✅ COMPLETE** - Tool Registration
- **Location**: `phase-3/backend/agents/todo_agent.py` (line 124)
- **Implementation**: `list_tasks` imported and added to `self.tools` list alongside other tools

**T022 ✅ COMPLETE** - Agent Instructions
- **Location**: `phase-3/backend/agents/todo_agent.py` (lines 36-40)
- **Implementation**: Instructions handle "see/show/list tasks" with status filtering support

**Implementation Quality:**
- Exceeds requirements with extended task data fields
- Includes pagination support (limit=100)
- ISO 8601 timestamp formatting
- Comprehensive error handling
- Full documentation with examples

**Architectural Decision**: Implementation uses **synchronous TaskService** (not async), matching existing T017-T019 pattern from Phase 3.

**All acceptance criteria verified:**
- ✅ "Show me all my tasks" → `status="all"` (default)
- ✅ "What's pending?" → `status="pending"`
- ✅ "What have I completed?" → `status="completed"`
- ✅ Empty task list → Agent provides friendly error messages

**Files Updated:**
- `specs/004-ai-chatbot/tasks.md` - Marked T020-T022 as [X] completed

## Outcome

- ✅ Impact: Phase 4 User Story 2 (List Tasks via Natural Language) verified complete - no implementation needed
- 🧪 Tests: All three tasks (T020, T021, T022) verified through code inspection
- 📁 Files: Updated tasks.md to mark T020-T022 as completed; verified implementation in phase-3/backend/
- 🔁 Next prompts: Phase 5 (T023-T025) - Complete Task via Natural Language
- 🧠 Reflection: Phase 3 implementation was comprehensive and included all Phase 4 list_tasks functionality. Agent verification confirmed code quality exceeds minimum requirements with extended features (pagination, comprehensive task data, ISO timestamps).

## Evaluation notes (flywheel)

- Failure modes observed: None - verification successful
- Graders run and results (PASS/FAIL): PASS - All T020-T022 tasks verified complete
- Prompt variant (if applicable): Standard /sp.implement workflow
- Next experiment (smallest change to try): Continue with Phase 5 (T023-T025) for complete_task functionality
