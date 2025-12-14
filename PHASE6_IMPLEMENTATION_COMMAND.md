# Phase 6: User Story 4 - Delete Task via Natural Language

```
**Skills = SINGLE SOURCE OF TRUTH. Use them for ALL code patterns.**

**READ:**
- `specs/004-ai-chatbot/tasks.md` - Phase 6 tasks (T026-T028)
- `specs/004-ai-chatbot/plan.md` - Phase C (MCP Tools), Phase D (Agent Integration)
- `specs/004-ai-chatbot/research.md` - Topic 2 (MCP Tools Design)

**WORK IN:** `phase-3/backend/` (existing folder)

**PHASE 6 GOAL:** Enable users to remove tasks through conversation

**TASKS (Sequential T026 → T027 → T028):**

**T026 [US4] - MCP Tool:**
- Use `@chatkit-backend-engineer` agent
- Use `@openai-chatkit-backend-python` skill
- Add `delete_task(user_id, task_id)` MCP tool to `backend/src/mcp/tools.py`
- Tool MUST call `task_service.delete_task(user_id, task_id)` (from Phase 2)
- Returns: `{"task_id": int, "status": "deleted", "title": str}`
- Error: Returns `{"error": "Task not found"}` if task_id doesn't exist

**T027 [US4] - Register Tool:**
- Use `@chatkit-backend-engineer` agent
- Use `@openai-chatkit-backend-python` skill
- Register `delete_task` tool with TodoAgent in `backend/src/agents/todo_agent.py`
- Add tool to agent's tools list

**T028 [US4] - Agent Instructions:**
- Use `@chatkit-backend-engineer` agent
- Use `@openai-chatkit-backend-python` skill
- Update TodoAgent system instructions in `backend/src/agents/todo_agent.py`
- Handle delete commands: "delete task", "remove task", "cancel task", "delete task X"

**AGENTS (MUST CALL):**
- `@chatkit-backend-engineer` - For ALL Phase 6 tasks (T026, T027, T028)

**SKILLS (MUST USE):**
- `@openai-chatkit-backend-python` - Backend ChatKit patterns (MCP tools, agent instructions)

**ACCEPTANCE:**
- ✅ User: "Delete task 2" → Task 2 removed from database
- ✅ User: "Remove the shopping task" → Agent identifies task by title, deletes it
- ✅ User tries to delete non-existent task → Agent responds with friendly error

**START:** Begin with T026 - Add delete_task MCP tool using `@chatkit-backend-engineer` agent
```

