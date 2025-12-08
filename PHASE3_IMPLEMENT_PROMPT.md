# Backend Phase 3: Basic Task CRUD - Implementation Prompt

Use with `/sp.implement` or Claude.

---

## Agent & References:
**Agent:** `backend-feature-builder`  
**Read:** `specs/003-backend-todo-app/spec.md` (FR-009 to FR-018, User Story 2), `plan.md` (Phase 3), `tasks.md`, `contracts/api-contracts.md`, `.specify/memory/constitution.md`  
**Skills:** `.claude/skills/backend-database/`, `.claude/skills/backend-service-layer/`, `.claude/skills/backend-api-routes/`, `.claude/skills/backend-error-handling/`, `.claude/skills/backend-jwt-auth/`

## Implementation Tasks:

1. **Task Model** (`/backend/models.py`): Task SQLModel (id, user_id UUID FK, title max 200, description max 1000 optional, priority enum low|medium|high default medium, due_date optional, tags JSON array, completed boolean default false, created_at, updated_at) + indexes: user_id, completed, priority, due_date

2. **TaskService** (`/backend/services/task_service.py`): create_task(), get_tasks(), get_task_by_id(), update_task(), delete_task(), toggle_complete() - all with user isolation (filter by user_id)

3. **Pydantic Schemas** (`/backend/schemas/requests.py`, `/backend/schemas/responses.py`): CreateTaskRequest (title required max 200, description optional max 1000, priority enum, due_date ISO 8601 optional, tags array optional), UpdateTaskRequest (all optional), ToggleCompleteRequest (completed boolean), TaskResponse, TaskListResponse (data array, meta pagination, success)

4. **Task Routes** (`/backend/routes/tasks.py`): GET /api/{user_id}/tasks (200), POST /api/{user_id}/tasks (201), GET /api/{user_id}/tasks/{id} (200), PUT /api/{user_id}/tasks/{id} (200), DELETE /api/{user_id}/tasks/{id} (200), PATCH /api/{user_id}/tasks/{id}/complete (200) - all require JWT, verify user_id from JWT matches URL path (403 if mismatch), errors: 400/401/403/404

5. **User Isolation**: All service methods filter by user_id, all routes verify JWT user_id matches URL user_id, return 403 for cross-user access, database queries always WHERE user_id = :user_id

6. **Validation**: Title required max 200, description optional max 1000, priority enum (low|medium|high) default medium, due_date ISO 8601, tags array stored as JSON

7. **Migration**: Alembic migration for tasks table with fields and indexes

8. **Update main.py**: Register task routes

## Dependencies: None (already installed)

## Expected Files:
- `/backend/models.py` - Task model
- `/backend/services/task_service.py` - TaskService
- `/backend/schemas/requests.py` - Task request schemas
- `/backend/schemas/responses.py` - Task response schemas
- `/backend/routes/tasks.py` - Task endpoints
- `/backend/alembic/versions/xxxx_create_tasks.py` - Migration
- Updated `/backend/main.py` - Routes registered

## Testing:
```bash
cd backend && uv run pytest tests/ -v
cd backend && uv run pytest tests/api/test_task_endpoints.py -v
cd backend && uv run pytest --cov=. --cov-report=html
```

## Test API (replace TOKEN and USER_ID):
```bash
# Create: POST /api/$USER_ID/tasks -H "Authorization: Bearer $TOKEN" -d '{"title":"Test","priority":"high","tags":["work"]}'
# List: GET /api/$USER_ID/tasks -H "Authorization: Bearer $TOKEN"
# Get: GET /api/$USER_ID/tasks/1 -H "Authorization: Bearer $TOKEN"
# Update: PUT /api/$USER_ID/tasks/1 -H "Authorization: Bearer $TOKEN" -d '{"title":"Updated"}'
# Toggle: PATCH /api/$USER_ID/tasks/1/complete -H "Authorization: Bearer $TOKEN" -d '{"completed":true}'
# Delete: DELETE /api/$USER_ID/tasks/1 -H "Authorization: Bearer $TOKEN"
```

Implement Phase 3: All FR-009 to FR-018, user isolation enforced, 6 endpoints, database indexes, tags as JSON array.

