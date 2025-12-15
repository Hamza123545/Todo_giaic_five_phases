# Implementation Tasks: AI-Powered Todo Chatbot

**Feature**: 004-ai-chatbot
**Branch**: `004-ai-chatbot`
**Generated**: 2025-12-14
**Status**: ✅ **COMPLETE** - All 42 tasks implemented
**Total Tasks**: 42
**Completed Tasks**: 42/42 (100%)

## User Story Mapping

| Story | Priority | Description | Tasks |
|-------|----------|-------------|-------|
| US1 | P1 | Add Task via Natural Language | T017, T018, T019 |
| US2 | P1 | List Tasks via Natural Language | T020, T021, T022 |
| US3 | P1 | Complete Task via Natural Language | T023, T024, T025 |
| US4 | P2 | Delete Task via Natural Language | T026, T027, T028 |
| US5 | P2 | Update Task via Natural Language | T029, T030, T031 |
| US6 | P2 | Conversation Context Maintenance | T032, T033, T034 |

## Dependency Graph

```text
Phase 1: Setup (6 tasks)
┌─────────────────────────────────────────────────────┐
│ T001-T006 [All parallelizable]                      │
│ - Add dependencies, env vars, create directories    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
Phase 2: Foundational (10 tasks)
┌─────────────────────────────────────────────────────┐
│ Service Layer: T007 → T008 → T009 → T010 → T011    │
│ Database Models: T012 [P] → T013 [P] → T014         │
│ Agent Infrastructure: T015 [P], T016 [P]            │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │  US1    │     │  US2    │     │  US3    │
   │  (P1)   │     │  (P1)   │     │  (P1)   │
   │ T017-19 │     │ T020-22 │     │ T023-25 │
   └─────────┘     └─────────┘     └─────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │  US4    │     │  US5    │     │  US6    │
   │  (P2)   │     │  (P2)   │     │  (P2)   │
   │ T026-28 │     │ T029-31 │     │ T032-34 │
   └─────────┘     └─────────┘     └─────────┘
                        │
                        ▼
Phase 9: Frontend ChatKit (4 tasks)
┌─────────────────────────────────────────────────────┐
│ T035 [P] → T036 [P] → T037 → T038 [P]              │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
Phase 10: Polish & Integration (4 tasks)
┌─────────────────────────────────────────────────────┐
│ T039, T040 [P], T041 [P], T042 [P]                 │
└─────────────────────────────────────────────────────┘

Legend:
  → Sequential dependency
  [P] Parallelizable (can run concurrently with other [P] tasks in same phase)
  US# User Story number
```

## MVP Scope

**Suggested MVP**: Complete through **Phase 5** (User Stories 1, 2, 3)

**Core Value Delivered**:
- Users can add tasks via natural language ("Add a task to buy groceries")
- Users can view all tasks via natural language ("Show me all my tasks", "What's pending?")
- Users can complete tasks via natural language ("Mark task 3 as complete")
- Conversation history persists across page refreshes and server restarts
- Responses stream in real-time via Server-Sent Events

**MVP Test Criteria**:
1. ✅ User sends "Add a task to buy groceries" → Task created, confirmation received
2. ✅ User sends "Show me all my tasks" → Task list displayed with correct status
3. ✅ User sends "Mark task 1 as complete" → Task marked complete, confirmation received
4. ✅ User refreshes page → Conversation history loads from database
5. ✅ Response streaming begins < 2 seconds after message submission

## Phase 1: Setup (6 tasks)

**Goal**: Initialize project dependencies and directory structure for Phase 3.

**Tasks**:

- [X] T001 [P] Add openai-agents>=0.2.9, mcp>=1.0.0, and "openai-agents[litellm]" to backend/pyproject.toml dependencies
- [X] T002 [P] Add LLM_PROVIDER, OPENAI_API_KEY (default: gpt-4o), GEMINI_API_KEY, GEMINI_DEFAULT_MODEL (default: gemini-1.5-flash) to backend/.env.example
- [X] T003 [P] Add NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/api/chat (full URL) and optional NEXT_PUBLIC_OPENAI_DOMAIN_KEY (for production) to frontend/.env.local.example
- [X] T004 [P] Create backend/services/__init__.py (already exists from Phase 2)
- [X] T005 [P] Create backend/agents/__init__.py with module documentation
- [X] T006 [P] Create backend/mcp/__init__.py with module documentation

**Parallel Execution**: All tasks in Phase 1 can run in parallel (T001-T006).

**Acceptance Criteria**:
- ✅ Backend dependencies include openai-agents and mcp packages
- ✅ Environment variable examples document all required AI provider configurations
- ✅ Directory structure ready for service layer, agents, and MCP tools

---

## Phase 2: Foundational (10 tasks)

**Goal**: Extract service layer, create database models, and set up agent infrastructure.

### Service Layer Extraction (T007-T011)

- [X] T007 Create backend/services/task_service_async.py with async create_task(session, user_id, title, description) → Task
- [X] T008 Add async get_tasks(session, user_id, status, filters) → List[Task] and get_task_by_id(session, user_id, task_id) → Task to backend/services/task_service_async.py
- [X] T009 Add async update_task_status(session, user_id, task_id, completed) → Task to backend/services/task_service_async.py
- [X] T010 Add async delete_task(session, user_id, task_id) → bool and update_task_details(session, user_id, task_id, updates) → Task to backend/services/task_service_async.py
- [X] T011 Refactor backend/routes/tasks.py to use task_service methods (already using TaskService class from Phase 2)

### Database Models (T012-T014)

- [X] T012 [P] Create backend/models/conversation.py with Conversation model (id, user_id, created_at, updated_at) with indexes
- [X] T013 [P] Create backend/models/message.py with Message model (id, user_id, conversation_id, role, content, tool_calls, created_at) with indexes
- [X] T014 Create backend/services/conversation_service.py with async get_or_create_conversation, add_message, get_conversation_history, get_user_conversations

### Agent Infrastructure (T015-T016)

- [X] T015 [P] Create backend/agents/factory.py with create_model(provider) supporting OpenAI and Gemini via AsyncOpenAI and LitellmModel
- [X] T016 [P] Create backend/schemas/chat.py with ChatRequest(conversation_id, message), ChatResponse(conversation_id, response, tool_calls), and MessageSchema

**Parallel Execution Groups**:
- Group A (Sequential): T007 → T008 → T009 → T010 → T011 (Service layer tasks must be sequential)
- Group B (Parallel): T012, T013 can run in parallel → T014 depends on both
- Group C (Parallel): T015, T016 can run in parallel with Group A and B

**Acceptance Criteria**:
- ✅ Task service methods enforce user isolation (user_id required parameter)
- ✅ All Phase 2 REST endpoints still work (no breaking changes)
- ✅ Conversation and Message models include database indexes on user_id and conversation_id
- ✅ Model factory supports both OpenAI and Gemini providers via LLM_PROVIDER environment variable

---

## Phase 3: User Story 1 - Add Task via Natural Language (P1)

**Goal**: Enable users to create tasks through conversational interface.

**Story**: As a user, I want to create tasks by describing them naturally in conversation, so that I can quickly capture ideas without navigating forms or UI controls.

**Independent Test**:
```
GIVEN user is authenticated and in chat interface
WHEN user types "Add a task to buy groceries"
THEN chatbot creates task with title "Buy groceries"
AND responds with confirmation message
AND task appears in database with correct user_id
```

**Tasks**:

- [X] T017 [US1] Create backend/src/mcp/tools.py with add_task(user_id, title, description) MCP tool calling task_service.create_task
- [X] T018 [US1] Create backend/src/agents/todo_agent.py with TodoAgent class using OpenAI Agents SDK and add_task MCP tool
- [X] T019 [US1] Create backend/src/routers/chat.py with POST /api/{user_id}/chat endpoint using SSE streaming

**Parallel Execution**: T017 and T018 can be developed in parallel → T019 depends on both.

**Acceptance Scenarios**:
1. ✅ User: "Add a task to buy groceries" → Task created: {id: 1, title: "Buy groceries", user_id: "user123"}
2. ✅ User: "Remind me to call mom tonight" → Task created: {id: 2, title: "Call mom tonight"}
3. ✅ User: "I need to remember to pay bills" → Task created: {id: 3, title: "Pay bills"}
4. ✅ Response streaming begins within 2 seconds of message submission

---

## Phase 4: User Story 2 - List Tasks via Natural Language (P1)

**Goal**: Enable users to view tasks through conversational queries.

**Story**: As a user, I want to view my tasks by asking for them naturally, so that I can quickly check what I need to do without navigating to different pages or filters.

**Independent Test**:
```
GIVEN user has 5 tasks (3 pending, 2 completed)
WHEN user types "Show me all my tasks"
THEN chatbot displays all 5 tasks with their status
AND tasks are formatted in readable list
```

**Tasks**:

- [X] T020 [US2] Add list_tasks(user_id, status) MCP tool to backend/src/mcp/tools.py with filter support (all/pending/completed)
- [X] T021 [US2] Register list_tasks tool with TodoAgent in backend/src/agents/todo_agent.py
- [X] T022 [US2] Update TodoAgent system instructions in backend/src/agents/todo_agent.py to handle list commands ("show tasks", "what's pending", "list completed")

**Parallel Execution**: All tasks in Phase 4 are sequential (must complete in order T020 → T021 → T022).

**Acceptance Scenarios**:
1. ✅ User: "Show me all my tasks" → Displays all 5 tasks (3 pending, 2 completed)
2. ✅ User: "What's pending?" → Displays only 3 pending tasks
3. ✅ User: "What have I completed?" → Displays only 2 completed tasks
4. ✅ User with no tasks: "List my tasks" → Friendly message "You don't have any tasks yet"

---

## Phase 5: User Story 3 - Complete Task via Natural Language (P1)

**Goal**: Enable users to mark tasks as done through conversation.

**Story**: As a user, I want to mark tasks as done by saying so naturally, so that I can quickly acknowledge completed work without clicking checkboxes or buttons.

**Independent Test**:
```
GIVEN user has task with ID 3 that is pending
WHEN user types "Mark task 3 as complete"
THEN chatbot marks task 3 as completed
AND responds with encouraging message
AND task.completed = true in database
```

**Tasks**:

- [X] T023 [US3] Add complete_task(user_id, task_id) MCP tool to backend/src/mcp/tools.py calling task_service.update_task_status
- [X] T024 [US3] Register complete_task tool with TodoAgent in backend/src/agents/todo_agent.py
- [X] T025 [US3] Update TodoAgent system instructions in backend/src/agents/todo_agent.py to handle complete commands ("mark complete", "I finished", "done with task X")

**Parallel Execution**: All tasks in Phase 5 are sequential (must complete in order T023 → T024 → T025).

**Acceptance Scenarios**:
1. ✅ User: "Mark task 3 as complete" → Task 3 status updated to completed
2. ✅ User: "I finished buying groceries" → Agent identifies task by title, marks complete
3. ✅ User references multiple matching tasks → Agent asks for clarification
4. ✅ User references non-existent task ID → Agent responds with "Task not found" error

**MVP Checkpoint**: After Phase 5, users can add, list, and complete tasks via chat. This represents a functional MVP.

---

## Phase 6: User Story 4 - Delete Task via Natural Language (P2)

**Goal**: Enable users to remove tasks through conversation.

**Story**: As a user, I want to remove tasks by asking naturally, so that I can keep my task list clean without navigating menus or confirmation dialogs.

**Independent Test**:
```
GIVEN user has task with ID 2
WHEN user types "Delete task 2"
THEN chatbot removes the task
AND confirms deletion
AND task no longer exists in database
```

**Tasks**:

- [X] T026 [US4] Add delete_task(user_id, task_id) MCP tool to backend/src/mcp/tools.py calling task_service.delete_task
- [X] T027 [US4] Register delete_task tool with TodoAgent in backend/src/agents/todo_agent.py
- [X] T028 [US4] Update TodoAgent system instructions in backend/src/agents/todo_agent.py to handle delete commands ("delete task", "remove task", "cancel task")

**Parallel Execution**: All tasks in Phase 6 are sequential (must complete in order T026 → T027 → T028).

**Acceptance Scenarios**:
1. ✅ User: "Delete task 2" → Task 2 removed from database
2. ✅ User: "Remove the shopping task" → Agent identifies task by title, deletes it
3. ✅ User tries to delete non-existent task → Agent responds with friendly error

---

## Phase 7: User Story 5 - Update Task via Natural Language (P2)

**Goal**: Enable users to modify task details through conversation.

**Story**: As a user, I want to modify task details by describing changes naturally, so that I can refine tasks without navigating edit forms or fields.

**Independent Test**:
```
GIVEN user has task with ID 1
WHEN user types "Change task 1 to 'Call mom tonight'"
THEN chatbot updates task 1 title
AND confirms the change
AND task.title = "Call mom tonight" in database
```

**Tasks**:

- [X] T029 [US5] Add update_task(user_id, task_id, title, description) MCP tool to backend/src/mcp/tools.py calling task_service.update_task_details
- [X] T030 [US5] Register update_task tool with TodoAgent in backend/src/agents/todo_agent.py
- [X] T031 [US5] Update TodoAgent system instructions in backend/src/agents/todo_agent.py to handle update commands ("change task", "update task", "rename task")

**Parallel Execution**: All tasks in Phase 7 are sequential (must complete in order T029 → T030 → T031).

**Acceptance Scenarios**:
1. ✅ User: "Change task 1 to 'Call mom tonight'" → Task 1 title updated
2. ✅ User: "Update the groceries task to 'Buy groceries and fruits'" → Title updated
3. ✅ User tries to update non-existent task → Agent responds with helpful error

---

## Phase 8: User Story 6 - Conversation Context Maintenance (P2)

**Goal**: Enable chatbot to remember conversation across messages.

**Story**: As a user, I want the chatbot to remember our conversation across messages, so that I can have natural follow-up exchanges without repeating context.

**Independent Test**:
```
GIVEN user asked "Show my tasks" and received a list
WHEN user types "Complete the first one"
THEN chatbot remembers the list
AND completes the first task shown
AND does not ask for clarification
```

**Tasks**:

- [X] T032 [US6] Add conversation history loading to backend/src/routers/chat.py endpoint using conversation_service.get_conversation_history
- [X] T033 [US6] Build message array from database history + new user message in backend/src/routers/chat.py before calling TodoAgent
- [X] T034 [US6] Update TodoAgent system instructions in backend/src/agents/todo_agent.py to use conversation context for follow-up commands

**Parallel Execution**: All tasks in Phase 8 are sequential (must complete in order T032 → T033 → T034).

**Acceptance Scenarios**:
1. ✅ User asks "Show my tasks" then "Complete the first one" → Agent remembers list context
2. ✅ User refreshes browser → Conversation history loads from database
3. ✅ Server restarts during conversation → Next message continues naturally using DB history

---

## Phase 9: Frontend ChatKit Integration (4 tasks)

**Goal**: Integrate OpenAI ChatKit widget into Next.js frontend.

**Tasks**:

- [X] T035 [P] Install @openai/chatkit-react package and create frontend/src/components/chatkit/ChatKitWidget.tsx as 'use client' component using ChatKit and useChatKit from @openai/chatkit-react
- [X] T036 [P] Create frontend/src/components/chatkit/ChatKitProvider.tsx with useChatKit configuration (api.url, api.domainKey, custom fetch with Better Auth JWT)
- [X] T037 Create frontend/src/app/chat/page.tsx with ChatKitWidget component and "AI Todo Assistant" heading
- [X] T038 [P] Add navigation link to chat page in frontend/src/app/layout.tsx or navigation component

**Parallel Execution**: T035 and T036 can run in parallel → T037 depends on both → T038 can run in parallel with T037.

**Acceptance Criteria**:
- ✅ ChatKit widget renders on /chat page
- ✅ Widget sends messages to /api/{user_id}/chat endpoint with JWT token
- ✅ Streaming responses display in real-time
- ✅ Conversation history persists across page refreshes
- ✅ Navigation link accessible from main app

---

## Phase 10: Polish & Integration (4 tasks)

**Goal**: Complete integration, error handling, and documentation.

**Tasks**:

- [X] T039 Register chat router with FastAPI app in backend/src/main.py (app.include_router)
- [X] T040 [P] Add error handling for AI model unavailability (OpenAI/Gemini down) in backend/src/routers/chat.py with retry logic and user-friendly error messages
- [X] T041 [P] Create GET /api/{user_id}/conversations endpoint in backend/src/routers/chat.py to list user conversations using conversation_service.get_user_conversations
- [X] T042 [P] Update README.md with Phase 3 chat feature documentation (environment variables, setup instructions, usage examples)

**Parallel Execution**: T040, T041, T042 can run in parallel after T039 completes.

**Acceptance Criteria**:
- ✅ Chat router accessible at /api/{user_id}/chat
- ✅ API failures show user-friendly error messages (not stack traces)
- ✅ Users can retrieve list of their past conversations
- ✅ README documents all Phase 3 environment variables and setup steps

---

## Task Count Summary

| Phase | Task Range | Count | Parallel Opportunities |
|-------|-----------|-------|----------------------|
| Phase 1: Setup | T001-T006 | 6 | All 6 tasks parallelizable |
| Phase 2: Foundational | T007-T016 | 10 | 4 parallel groups (T012-T013, T015-T016) |
| Phase 3: US1 (P1) | T017-T019 | 3 | 2 tasks parallel (T017-T018) |
| Phase 4: US2 (P1) | T020-T022 | 3 | Sequential |
| Phase 5: US3 (P1) | T023-T025 | 3 | Sequential |
| Phase 6: US4 (P2) | T026-T028 | 3 | Sequential |
| Phase 7: US5 (P2) | T029-T031 | 3 | Sequential |
| Phase 8: US6 (P2) | T032-T034 | 3 | Sequential |
| Phase 9: Frontend | T035-T038 | 4 | 3 parallel groups |
| Phase 10: Polish | T039-T042 | 4 | 3 parallel after T039 |
| **TOTAL** | T001-T042 | **42** | **~15-20 parallel tasks** |

---

## Implementation Strategy

### MVP First Approach

**Sprint 1 (Phases 1-2)**: Foundation (16 tasks, ~8-12 hours)
- Setup dependencies and directory structure
- Extract service layer for code reuse
- Create database models and conversation service
- Build agent infrastructure

**Sprint 2 (Phases 3-5)**: Core Chat Features (9 tasks, ~10-15 hours)
- **US1**: Add tasks via chat
- **US2**: List tasks via chat
- **US3**: Complete tasks via chat
- **MVP Delivery**: Users can add, list, and complete tasks conversationally

**Sprint 3 (Phases 6-8)**: Extended Operations (9 tasks, ~6-9 hours)
- **US4**: Delete tasks via chat
- **US5**: Update tasks via chat
- **US6**: Conversation context maintenance

**Sprint 4 (Phases 9-10)**: Frontend & Polish (8 tasks, ~5-8 hours)
- ChatKit widget integration
- Error handling and resilience
- Conversation list endpoint
- Documentation

**Total Estimated Effort**: 29-44 hours (approximately 4-5 days)

### Incremental Delivery Milestones

1. **Milestone 1** (After Phase 2): Service layer extracted, database models ready
   - **Test**: Task service unit tests pass
   - **Deliverable**: Shared business logic foundation

2. **Milestone 2** (After Phase 3): First working chat interaction
   - **Test**: User can add task via chat, receive confirmation
   - **Deliverable**: Basic chat endpoint with SSE streaming

3. **Milestone 3** (After Phase 5): MVP Complete
   - **Test**: All 3 P1 user stories work (add, list, complete)
   - **Deliverable**: Functional conversational task management

4. **Milestone 4** (After Phase 8): Full Backend Complete
   - **Test**: All 5 task operations work via chat, context maintained
   - **Deliverable**: Complete backend AI chatbot

5. **Milestone 5** (After Phase 10): Production Ready
   - **Test**: ChatKit integrated, error handling complete, documented
   - **Deliverable**: Phase 3 complete, ready for production deployment

### Test Verification Points

**After Each Phase**:
- Service Layer (Phase 2): Unit tests for task_service.py methods
- US1 (Phase 3): Integration test - add task via chat endpoint
- US2 (Phase 4): Integration test - list tasks with filters
- US3 (Phase 5): Integration test - complete task by ID
- US4 (Phase 6): Integration test - delete task by ID
- US5 (Phase 7): Integration test - update task details
- US6 (Phase 8): Integration test - multi-turn conversation with context
- Frontend (Phase 9): Component tests for ChatKit widget
- Polish (Phase 10): End-to-end test - full chat flow from frontend to database

**Success Criteria Validation**:
- **SC-001**: Task creation < 5 seconds (measure in Phase 3)
- **SC-002**: All 5 operations work (verify after Phase 8)
- **SC-003**: Conversation persistence (verify after Phase 8)
- **SC-004**: 90% interpretation accuracy (manual testing after Phase 8)
- **SC-005**: Streaming < 2 seconds (measure in Phase 3)
- **SC-006**: 50 concurrent sessions (load test after Phase 10)
- **SC-007**: 80% user satisfaction (user testing after Phase 10)
- **SC-008**: 90% error helpfulness (verify after Phase 10)

---

## Parallel Execution Examples

### Example 1: Phase 1 Setup (All Parallel)
```bash
# Terminal 1: Backend dependencies
task T001  # Add openai-agents, mcp to pyproject.toml

# Terminal 2: Environment variables
task T002  # Backend env vars
task T003  # Frontend env vars

# Terminal 3: Directory structure
task T004  # services/__init__.py
task T005  # agents/__init__.py
task T006  # mcp/__init__.py

# All 6 tasks complete in ~5-10 minutes
```

### Example 2: Phase 2 Foundational (Mixed)
```bash
# Sequential Group A (Service Layer)
task T007 → T008 → T009 → T010 → T011

# Parallel Group B (Database Models)
# Terminal 1:
task T012  # Conversation model
# Terminal 2:
task T013  # Message model
# Wait for both, then:
task T014  # conversation_service.py

# Parallel Group C (Agent Infrastructure)
# Terminal 3:
task T015  # Model factory
# Terminal 4:
task T016  # Chat schemas

# Groups B and C can run in parallel with Group A
```

### Example 3: User Story 1 (Partial Parallel)
```bash
# Parallel development
# Terminal 1:
task T017  # MCP add_task tool
# Terminal 2:
task T018  # TodoAgent with add_task

# Wait for both to complete
# Terminal 1:
task T019  # Chat endpoint (depends on T017, T018)
```

### Example 4: Phase 9 Frontend (Partial Parallel)
```bash
# Parallel component development
# Terminal 1:
task T035  # ChatKitWidget
# Terminal 2:
task T036  # ChatKitProvider

# Wait for both
# Terminal 1:
task T037  # Chat page

# Parallel with T037
# Terminal 2:
task T038  # Navigation link
```

---

## Dependencies & Blocking Tasks

### Critical Path (Must Complete Before Moving Forward)
1. **Phase 1** (T001-T006) → Blocks all subsequent phases
2. **Phase 2** (T007-T016) → Blocks all user story phases
3. **US1 Foundation** (T017-T019) → Enables all other user stories

### User Story Dependencies
- **US1 (T017-T019)** → Independent (can start after Phase 2)
- **US2 (T020-T022)** → Depends on US1 (needs TodoAgent from T018)
- **US3 (T023-T025)** → Depends on US1 (needs TodoAgent from T018)
- **US4 (T026-T028)** → Depends on US1 (needs TodoAgent from T018)
- **US5 (T029-T031)** → Depends on US1 (needs TodoAgent from T018)
- **US6 (T032-T034)** → Depends on US1 (needs chat endpoint from T019)

### Parallel User Story Execution
After US1 (T017-T019) completes, **US2, US3, US4, US5 can be developed in parallel** by different developers:
- Developer A: US2 (List tasks)
- Developer B: US3 (Complete task)
- Developer C: US4 (Delete task)
- Developer D: US5 (Update task)
- Developer E: US6 (Conversation context)

Each user story adds a new MCP tool and updates TodoAgent instructions independently.

---

## File Path Reference

### Backend Files Created/Modified

**New Files**:
- `backend/src/services/__init__.py`
- `backend/src/services/task_service.py`
- `backend/src/services/conversation_service.py`
- `backend/src/agents/__init__.py`
- `backend/src/agents/factory.py`
- `backend/src/agents/todo_agent.py`
- `backend/src/mcp/__init__.py`
- `backend/src/mcp/tools.py`
- `backend/src/models/conversation.py`
- `backend/src/models/message.py`
- `backend/src/routers/chat.py`
- `backend/src/schemas/chat.py`

**Modified Files**:
- `backend/pyproject.toml` (T001)
- `backend/.env.example` (T002)
- `backend/src/routers/tasks.py` (T011)
- `backend/src/main.py` (T039)

### Frontend Files Created/Modified

**New Files**:
- `frontend/src/components/chatkit/ChatKitWidget.tsx`
- `frontend/src/components/chatkit/ChatKitProvider.tsx`
- `frontend/src/app/chat/page.tsx`

**Modified Files**:
- `frontend/.env.local.example` (T003)
- `frontend/src/app/layout.tsx` or navigation component (T038)

### Documentation Files Modified

- `README.md` (T042)

---

## Next Steps

1. **Review Tasks**: Ensure all 42 tasks are clear and actionable
2. **Assign Owners**: Distribute tasks across team (if applicable)
3. **Begin Phase 1**: Start with setup tasks (all parallelizable)
4. **Track Progress**: Mark tasks as complete using checkbox syntax `- [x]`
5. **Verify at Milestones**: Run tests after each phase completion
6. **Deliver MVP**: Complete Phases 1-5 for first functional release
7. **Iterate**: Phases 6-10 for full feature set

**Estimated Timeline**: 4-5 days of focused development (29-44 hours total)
