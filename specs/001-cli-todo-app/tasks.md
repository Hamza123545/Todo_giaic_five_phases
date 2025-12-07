# Tasks: Basic CLI Todo App

**Input**: Design documents from `/specs/001-cli-todo-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, quickstart.md

**Tests**: The examples below include test tasks, as requested by the overall prompt.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below assume single project - adjust based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create `pyproject.toml` with project metadata and UV dependencies (Click, pytest) in project root.
- [X] T002 Create `src/` directory and `src/__init__.py` in project root.
- [X] T003 Create `tests/` directory and `tests/__init__.py` in project root.
- [X] T004 Create `tests/unit/` and `tests/integration/` directories with `__init__.py` files within `tests/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement `Task` dataclass in `src/models/task.py` as defined in `data-model.md`.
- [X] T006 Implement unit tests for `Task` dataclass in `tests/unit/test_task.py`.
- [X] T007 Implement `TaskStore` class with initial structure (e.g., `__init__` with an empty list for tasks) in `src/services/task_store.py`.
- [X] T008 Implement unit tests for `TaskStore` initial structure in `tests/unit/test_task_store.py`.

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add a New Task (Priority: P1) 🎯 MVP

**Goal**: As a user, I want to add new todo tasks with a title and an optional description, so I can keep track of what I need to do.

**Independent Test**: Can be fully tested by adding a task and then verifying its presence in the task list. Delivers immediate value by allowing initial task creation.

### Tests for User Story 1
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T009 [P] [US1] Unit test `TaskStore.add_task` method in `tests/unit/test_task_store.py` (ensure unique ID generation, correct status and description handling).
- [X] T010 [P] [US1] Integration test the `add` CLI command in `tests/integration/test_cli.py` (test with title, with title and description, and missing title).

### Implementation for User Story 1

- [X] T011 [US1] Implement `add_task` method in `src/services/task_store.py` to create and store new tasks.
- [X] T012 [US1] Implement the `add` CLI command in `src/cli/commands.py` using Click, integrating with `TaskStore.add_task`.
- [X] T013 [US1] Configure `src/__main__.py` to expose the `todo` CLI application.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - List All Tasks with Status (Priority: P1)

**Goal**: As a user, I want to view a list of all my tasks, including their unique ID, title, description, and completion status, so I can see what I need to work on.

**Independent Test**: Can be fully tested by adding multiple tasks (some complete, some incomplete) and then listing them, verifying that all details and statuses are displayed correctly. Delivers value by providing an overview of tasks.

### Tests for User Story 2
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T014 [P] [US2] Unit test `TaskStore.get_all_tasks` method in `tests/unit/test_task_store.py` (test empty list, multiple tasks with different statuses).
- [X] T015 [P] [US2] Integration test the `list` CLI command in `tests/integration/test_cli.py` (test empty list, multiple tasks output formatting).

### Implementation for User Story 2

- [X] T016 [US2] Implement `get_all_tasks` method in `src/services/task_store.py` to return all stored tasks.
- [X] T017 [US2] Implement the `list` CLI command in `src/cli/commands.py` to fetch and display tasks from `TaskStore`, applying appropriate formatting (Skill Hint: 'CLI-UX pattern').

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Mark Task Complete/Incomplete (Priority: P2)

**Goal**: As a user, I want to change the completion status of a task using its ID, so I can track my progress.

**Independent Test**: Can be tested by adding a task, marking it complete, listing to verify, and then marking it incomplete and listing again to verify. Delivers value by enabling status updates.

### Tests for User Story 3
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T018 [P] [US3] Unit test `TaskStore.mark_complete` and `TaskStore.mark_pending` methods in `tests/unit/test_task_store.py` (test valid ID, non-existent ID).
- [X] T019 [P] [US3] Integration test the `complete` and `uncomplete` CLI commands in `tests/integration/test_cli.py` (test valid ID, non-existent ID).

### Implementation for User Story 3

- [X] T020 [US3] Implement `mark_complete` method in `src/services/task_store.py` to change a task's status to `complete`.
- [X] T021 [US3] Implement `mark_pending` method in `src/services/task_store.py` to change a task's status to `pending`.
- [X] T022 [US3] Implement the `complete` and `uncomplete` CLI commands in `src/cli/commands.py`, integrating with `TaskStore`.

**Checkpoint**: All user stories up to US3 should now be independently functional

---

## Phase 6: User Story 4 - Update Task Details (Priority: P2)

**Goal**: As a user, I want to modify the title or description of an existing task using its ID, so I can correct mistakes or refine details.

**Independent Test**: Can be tested by adding a task, updating its title and/or description, and then listing to verify the changes. Delivers value by allowing task refinement.

### Tests for User Story 4
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T023 [P] [US4] Unit test `TaskStore.update_task` method in `tests/unit/test_task_store.py` (test updating title, description, both, and non-existent ID).
- [X] T024 [P] [US4] Integration test the `update` CLI command in `tests/integration/test_cli.py` (test various update scenarios, non-existent ID, missing arguments).

### Implementation for User Story 4

- [X] T025 [US4] Implement `update_task` method in `src/services/task_store.py` to modify a task's title and/or description.
- [X] T026 [US4] Implement the `update` CLI command in `src/cli/commands.py`, integrating with `TaskStore`.

**Checkpoint**: All user stories up to US4 should now be independently functional

---

## Phase 7: User Story 5 - Delete a Task (Priority: P2)

**Goal**: As a user, I want to remove a task entirely using its ID, so I can clean up my todo list.

**Independent Test**: Can be tested by adding a task, deleting it, and then listing to confirm its absence. Delivers value by enabling list maintenance.

### Tests for User Story 5
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T027 [P] [US5] Unit test `TaskStore.delete_task` method in `tests/unit/test_task_store.py` (test valid ID, non-existent ID).
- [X] T028 [P] [US5] Integration test the `delete` CLI command in `tests/integration/test_cli.py` (test valid ID, non-existent ID).

### Implementation for User Story 5

- [X] T029 [US5] Implement `delete_task` method in `src/services/task_store.py` to remove a task.
- [X] T030 [US5] Implement the `delete` CLI command in `src/cli/commands.py`, integrating with `TaskStore`.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Security - Input Sanitization (FR-009) 🔒 CRITICAL

**Goal**: Implement comprehensive input sanitization to prevent command injection and terminal corruption as specified in FR-009.

**Independent Test**: Can be fully tested with malicious inputs (shell metacharacters, control characters, boundary cases) to ensure security requirements are met.

### Tests for Security (FR-009)
> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T035 [P] [FR-009] Unit test `sanitize_input()` function with valid inputs in `tests/unit/test_input_sanitizer.py`.
- [X] T036 [P] [FR-009] Unit test `sanitize_input()` rejection of shell metacharacters ($, `, ;, |, &, >, <) in `tests/unit/test_input_sanitizer.py`.
- [X] T037 [P] [FR-009] Unit test `sanitize_input()` rejection of control characters (ASCII 0-31) in `tests/unit/test_input_sanitizer.py`.
- [X] T038 [P] [FR-009] Unit test `sanitize_input()` whitelist validation and max length in `tests/unit/test_input_sanitizer.py`.
- [X] T039 [FR-009] Integration test CLI add/update commands with malicious inputs in `tests/integration/test_cli.py`.

### Implementation for Security (FR-009)

- [X] T040 [FR-009] Create `src/utils/__init__.py` and `src/utils/input_sanitizer.py` with `sanitize_input()` function.
- [X] T041 [FR-009] Integrate `sanitize_input()` in `add` command in `src/cli/commands.py` with error handling.
- [X] T042 [FR-009] Integrate `sanitize_input()` in `update` command in `src/cli/commands.py` with error handling.
- [X] T043 [FR-009] Run pytest to verify all security tests pass; fix any failures.

**Checkpoint**: All security requirements (FR-009) should now be fully implemented and tested.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T031 Refine error messages and user feedback for all CLI commands (Skill Hint: 'error-message-generator').
- [X] T032 Review code for clean code practices, consistent formatting, type hints, and docstrings.
- [X] T033 Update `README.md` with detailed setup, running, and testing instructions, referring to `quickstart.md`.
- [X] T034 Run `uv run pytest` to ensure all unit and integration tests pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for adding tasks to list.
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 to add/list tasks for status changes.
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 to add/list tasks for updates.
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 and US2 to add/list tasks for deletion.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before CLI commands
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, several user stories can begin implementation in parallel, provided their foundational dependencies (e.g., ability to add and list tasks) are met.
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members, especially those with fewer dependencies on other stories (e.g., US1 and US2 can be developed relatively independently after foundational).

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test TaskStore.add_task method in tests/unit/test_task_store.py"
Task: "Integration test the `add` CLI command in tests/integration/test_cli.py"

# Launch implementation for User Story 1 (after tests are written and fail):
Task: "Implement `add_task` method in src/services/task_store.py"
Task: "Implement the `add` CLI command in src/cli/commands.py"
Task: "Configure `src/__main__.py` to expose the `todo` CLI application"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 & 2
   - Developer B: User Story 3 & 4
   - Developer C: User Story 5
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
