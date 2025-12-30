# Phase 3 Implementation Prompt for Claude Code

## Prompt

```
@phase5-cloud-deployment-engineer

Implement Phase 3: User Story 1 - Recurring Tasks (T044-T064) from specs/007-phase5-cloud-deployment/tasks.md.

**Goal**: Enable users to create tasks that repeat automatically on a schedule (daily, weekly, monthly, yearly)

**Independent Test**: Create recurring task "Daily standup" → mark complete → verify next occurrence created with correct due date

**Requirements:**
1. Use Context7 MCP server for python-dateutil RRULE patterns and FastAPI integration
2. Use skills:
   - rrule-recurring-tasks (for RRULE parsing and next occurrence calculation)
   - dapr-integration (for event publishing via Dapr Pub/Sub)
   - kafka-event-driven (for event schemas and publishing)
   - microservices-patterns (for Recurring Task Service)
3. Reference files:
   - Constitution: .specify/memory/constitution.md
   - Spec: specs/007-phase5-cloud-deployment/spec.md
   - Plan: specs/007-phase5-cloud-deployment/plan.md
   - Data Model: specs/007-phase5-cloud-deployment/data-model.md

**Tasks to Complete:**

### RRULE Parsing and Next Occurrence Calculation (T044-T049)
- T044: Implement phase-5/backend/src/integrations/rrule_parser.py
  - Use rrule-recurring-tasks skill template
  - Support simplified patterns: DAILY, WEEKLY, MONTHLY, YEARLY
  - Use python-dateutil rrule() and rrulestr()
- T045: Add full RFC 5545 RRULE parsing fallback
  - Parse "FREQ=DAILY;INTERVAL=1" format
  - Use rrulestr() for full RRULE strings
- T046: Implement next occurrence calculation
  - UTC-only time handling (always use timezone.utc)
  - Support recurring_end_date to stop recurrence
  - Return None if past end date
- T047: Add unit tests phase-5/backend/tests/unit/test_rrule_parser.py
  - Test daily, weekly, monthly, yearly patterns
  - Test interval variations
- T048: Add edge case tests
  - DST transitions
  - Leap years
  - Timezone boundaries
- T049: Add recurring_end_date logic tests
  - Test stopping recurrence at end date
  - Test NULL end date (infinite recurrence)

### Recurring Task Service (T050-T056)
- T050: Create phase-5/backend/src/services/recurring_task_service.py
  - FastAPI app entry point
  - Dapr subscription endpoint (/dapr/subscribe)
  - Use microservices-patterns skill template
- T051: Implement task.completed event consumer
  - Subscribe to task-events topic
  - Extract event from CloudEvents format
  - Validate user_id for user isolation
- T052: Implement next occurrence creation logic
  - Check if task has recurring_pattern
  - Calculate next_occurrence using rrule_parser
  - Create new task via Dapr Service Invocation
  - Idempotency check (use event_id)
  - User isolation (filter by user_id)
- T053: Integrate python-dateutil
  - Use RRuleParser from rrule_parser.py
  - Calculate next_occurrence with UTC timestamps
- T054: Implement task.created event publishing
  - Publish to task-events topic via Dapr Pub/Sub
  - Include parent_task_id in payload
  - Use event publisher from Phase 2
- T055: Add unit tests phase-5/backend/tests/unit/test_recurring_task_service.py
  - Test next occurrence creation
  - Test idempotency
  - Test user isolation
- T056: Add integration tests phase-5/backend/tests/integration/test_kafka_events.py
  - Test task.completed event consumption
  - Test end-to-end flow: complete → next occurrence created

### Task Service Updates for Recurring Tasks (T057-T061)
- T057: Update Task model phase-5/backend/src/models.py
  - Add recurring_pattern (VARCHAR, nullable)
  - Add recurring_end_date (TIMESTAMP, nullable)
  - Add next_occurrence (TIMESTAMP, nullable)
  - All fields nullable for backward compatibility
- T058: Update task creation API phase-5/backend/src/api/tasks.py
  - Accept recurring_pattern parameter
  - Accept recurring_end_date parameter
  - Calculate and set next_occurrence if recurring_pattern provided
  - Use RRuleParser to calculate next occurrence
- T059: Implement task.completed event publishing
  - In phase-5/backend/src/services/task_service.py
  - When task marked complete, publish task.completed event
  - Include recurring_pattern in payload if exists
  - Use event publisher from Phase 2
- T060: Add validation for recurring_pattern
  - Validate RRULE format using RRuleParser.validate_pattern()
  - Return 400 error if invalid pattern
- T061: Add API tests phase-5/backend/tests/integration/test_tasks_api.py
  - Test recurring task creation
  - Test next_occurrence calculation
  - Test validation errors

### Frontend for Recurring Tasks (T062-T064)
- T062: Create phase-5/frontend/src/components/RecurringTaskForm.tsx
  - Simplified pattern UI: Daily, Weekly, Monthly, Yearly dropdowns
  - Optional recurring_end_date date picker
  - Generate simplified RRULE pattern
- T063: Create phase-5/frontend/src/lib/rrule-utils.ts
  - Helper functions for simplified pattern generation
  - Convert UI selection to RRULE string
- T064: Integrate RecurringTaskForm into ChatInterface
  - Add recurring task option in chat interface
  - Pass recurring_pattern to backend API

**Checkpoint**: User Story 1 fully functional - users can create recurring tasks and next occurrences are automatically generated.
```

## Quick Copy-Paste Version

```
@phase5-cloud-deployment-engineer

Implement Phase 3: User Story 1 - Recurring Tasks (T044-T064) from specs/007-phase5-cloud-deployment/tasks.md.

Use Context7 MCP server for python-dateutil RRULE patterns.
Use skills: rrule-recurring-tasks, dapr-integration, kafka-event-driven, microservices-patterns.

References: constitution.md, spec.md, plan.md, data-model.md.

Tasks:
- RRULE parser (T044-T049): Use rrule-recurring-tasks skill template, UTC-only, recurring_end_date support
- Recurring Task Service (T050-T056): Kafka consumer, next occurrence creation, Dapr Service Invocation
- Task Service updates (T057-T061): Model fields, API endpoints, event publishing
- Frontend (T062-T064): RecurringTaskForm component, RRULE utils

Test: Create "Daily standup" → mark complete → verify next occurrence created.
```

