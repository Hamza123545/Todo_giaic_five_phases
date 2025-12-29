# Data Model: Phase V - Advanced Cloud Deployment

**Date**: 2025-12-29
**Feature**: 007-phase5-cloud-deployment
**Purpose**: Document database schema changes, migration strategy, and data model for Phase V

---

## Overview

Phase V extends the existing `tasks` table with fields for recurring patterns, reminders, and next occurrence tracking. The migration strategy uses **nullable columns** to maintain backward compatibility with existing tasks (Phase II/III/IV data).

**Key Principles**:
1. **Backward Compatibility**: Existing tasks remain valid (Phase V fields are NULL)
2. **Single Source of Truth**: Tasks table in PostgreSQL (no task caching in Dapr State Store per Clarification #4)
3. **UTC-Only Timestamps**: All datetime fields stored in UTC (per Clarification #1)
4. **User Isolation**: All queries filtered by `user_id` (per Clarification #2)

---

## Database Schema Changes

### Existing `tasks` Table (Phase II/III/IV)

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT tasks_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
```

---

### Phase V Schema Extensions

**New Fields**:
1. **`recurring_pattern`** (VARCHAR(500), NULL): RRULE string or simplified pattern (e.g., "FREQ=DAILY;INTERVAL=1")
2. **`recurring_end_date`** (TIMESTAMP, NULL): When recurring should stop (NULL = infinite recurrence)
3. **`next_occurrence`** (TIMESTAMP, NULL): When next occurrence should be created (calculated in UTC)
4. **`reminder_at`** (TIMESTAMP, NULL): When reminder notification should be sent (calculated in UTC)
5. **`reminder_sent`** (BOOLEAN, DEFAULT FALSE): Track if reminder was sent

**Migration SQL**:

```sql
-- Migration 006: Add Phase V fields
-- File: backend/migrations/006_add_phase5_fields.sql

BEGIN;

-- Add nullable columns (backward compatible)
ALTER TABLE tasks
  ADD COLUMN recurring_pattern VARCHAR(500) NULL,
  ADD COLUMN recurring_end_date TIMESTAMP NULL,
  ADD COLUMN next_occurrence TIMESTAMP NULL,
  ADD COLUMN reminder_at TIMESTAMP NULL,
  ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX idx_tasks_next_occurrence
  ON tasks(next_occurrence)
  WHERE next_occurrence IS NOT NULL;

CREATE INDEX idx_tasks_reminder_at
  ON tasks(reminder_at, user_id)
  WHERE reminder_at IS NOT NULL AND reminder_sent = FALSE;

-- Add comments for documentation
COMMENT ON COLUMN tasks.recurring_pattern IS 'RRULE string (RFC 5545) or simplified pattern (e.g., FREQ=DAILY;INTERVAL=1). NULL for non-recurring tasks.';
COMMENT ON COLUMN tasks.recurring_end_date IS 'UTC timestamp when recurring should stop. NULL for infinite recurrence.';
COMMENT ON COLUMN tasks.next_occurrence IS 'UTC timestamp when next occurrence should be created. NULL for non-recurring tasks or completed recurring tasks.';
COMMENT ON COLUMN tasks.reminder_at IS 'UTC timestamp when reminder notification should be sent. NULL if no reminder scheduled.';
COMMENT ON COLUMN tasks.reminder_sent IS 'TRUE if reminder notification was sent. FALSE otherwise.';

COMMIT;
```

---

### Rollback Script

```sql
-- Rollback 006: Remove Phase V fields
-- File: backend/migrations/006_rollback.sql

BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_tasks_next_occurrence;
DROP INDEX IF EXISTS idx_tasks_reminder_at;

-- Drop columns
ALTER TABLE tasks
  DROP COLUMN IF EXISTS recurring_pattern,
  DROP COLUMN IF EXISTS recurring_end_date,
  DROP COLUMN IF EXISTS next_occurrence,
  DROP COLUMN IF EXISTS reminder_at,
  DROP COLUMN IF EXISTS reminder_sent;

COMMIT;
```

---

## Updated Schema (Phase V)

```sql
CREATE TABLE tasks (
    -- Existing fields (Phase II/III/IV)
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Phase V fields
    recurring_pattern VARCHAR(500) NULL,      -- RRULE string (e.g., "FREQ=DAILY;INTERVAL=1")
    recurring_end_date TIMESTAMP NULL,       -- When recurring should stop (NULL = infinite)
    next_occurrence TIMESTAMP NULL,          -- When next occurrence should be created (UTC)
    reminder_at TIMESTAMP NULL,              -- When reminder should be sent (UTC)
    reminder_sent BOOLEAN DEFAULT FALSE,     -- Track if reminder was sent

    CONSTRAINT tasks_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_next_occurrence ON tasks(next_occurrence) WHERE next_occurrence IS NOT NULL;  -- Phase V
CREATE INDEX idx_tasks_reminder_at ON tasks(reminder_at, user_id) WHERE reminder_at IS NOT NULL AND reminder_sent = FALSE;  -- Phase V
```

---

## Field Semantics and Constraints

### `recurring_pattern` (VARCHAR(500), NULL)

**Purpose**: Store RRULE string for recurring tasks

**Format**: RFC 5545 RRULE syntax (https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10)

**Examples**:
```
Daily:    "FREQ=DAILY;INTERVAL=1"
Weekly:   "FREQ=WEEKLY;BYDAY=MO,WE,FR"
Monthly:  "FREQ=MONTHLY;BYMONTHDAY=15"
Yearly:   "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1"
Complex:  "FREQ=MONTHLY;BYDAY=-1FR"  (Last Friday of every month)
```

**Validation**:
- NULL for non-recurring tasks
- Must be parseable by python-dateutil `rrulestr()`
- Length limit: 500 characters (sufficient for complex patterns)

**Application Layer Validation** (Python):
```python
from dateutil.rrule import rrulestr
from pydantic import BaseModel, field_validator

class TaskCreate(BaseModel):
    title: str
    recurring_pattern: str | None = None

    @field_validator('recurring_pattern')
    def validate_rrule(cls, v):
        if v is None:
            return v
        try:
            rrulestr(v)  # Validate RRULE syntax
        except Exception as e:
            raise ValueError(f"Invalid RRULE pattern: {e}")
        return v
```

---

### `recurring_end_date` (TIMESTAMP, NULL)

**Purpose**: Define when recurring task should stop generating next occurrences

**Format**: UTC timestamp (naive datetime, no timezone info)

**Semantics**:
- NULL = infinite recurrence (continue forever)
- Non-NULL = stop after this UTC timestamp
- When task is completed and `next_occurrence` > `recurring_end_date`, do NOT create next occurrence

**Example**:
```sql
-- Task recurs daily until end of 2026
INSERT INTO tasks (user_id, title, recurring_pattern, recurring_end_date, next_occurrence)
VALUES (
    'user-123',
    'Daily standup',
    'FREQ=DAILY;INTERVAL=1',
    '2026-12-31 23:59:59',  -- Stop at end of 2026
    '2025-12-30 09:00:00'   -- Next occurrence tomorrow at 9am UTC
);
```

**Application Logic** (Recurring Task Service):
```python
from datetime import datetime, timezone

def should_create_next_occurrence(task):
    """Check if next occurrence should be created"""
    if task.recurring_pattern is None:
        return False  # Not a recurring task

    if task.recurring_end_date is None:
        return True  # Infinite recurrence

    # Compare next_occurrence with recurring_end_date (both UTC)
    next_occurrence = calculate_next_occurrence(task.recurring_pattern, datetime.now(timezone.utc))
    return next_occurrence <= task.recurring_end_date
```

---

### `next_occurrence` (TIMESTAMP, NULL)

**Purpose**: Store when the next task occurrence should be created (pre-calculated)

**Format**: UTC timestamp (naive datetime, no timezone info)

**Calculation**: Performed by Recurring Task Service using python-dateutil

**Semantics**:
- NULL for non-recurring tasks
- Set when recurring task is created
- Updated to next occurrence when task is completed
- Set to NULL when recurring_end_date is reached

**Query Pattern** (Recurring Task Service polling - optional optimization):
```sql
-- Find tasks whose next occurrence is due (if using polling instead of events)
SELECT id, user_id, title, recurring_pattern, next_occurrence
FROM tasks
WHERE next_occurrence IS NOT NULL
  AND next_occurrence <= NOW()
  AND completed = TRUE
ORDER BY next_occurrence ASC
LIMIT 100;
```

**Note**: Phase V uses **event-driven approach** (Kafka events on task completion), so this query is only for fallback/recovery scenarios.

---

### `reminder_at` (TIMESTAMP, NULL)

**Purpose**: Store when reminder notification should be sent (pre-calculated)

**Format**: UTC timestamp (naive datetime, no timezone info)

**Calculation**:
- Set when task with `due_date` is created
- Default: `due_date - 1 hour` (configurable)
- Can support multiple reminders (future enhancement: separate `reminders` table)

**Semantics**:
- NULL for tasks without reminders
- Notification Service schedules Dapr Job at this timestamp
- After reminder sent, set `reminder_sent = TRUE`

**Example**:
```sql
-- Task with due_date 2025-12-30 10:00:00 UTC
INSERT INTO tasks (user_id, title, due_date, reminder_at)
VALUES (
    'user-123',
    'Submit report',
    '2025-12-30 10:00:00',  -- Due at 10am UTC
    '2025-12-30 09:00:00'   -- Remind at 9am UTC (1 hour before)
);
```

---

### `reminder_sent` (BOOLEAN, DEFAULT FALSE)

**Purpose**: Track if reminder notification was successfully sent

**Semantics**:
- FALSE by default (no reminder sent yet)
- Set to TRUE after Notification Service sends email/push notification
- Prevents duplicate reminders if Dapr Job retries
- Query pattern: `WHERE reminder_at <= NOW() AND reminder_sent = FALSE` (for recovery)

**Application Logic** (Notification Service):
```python
async def send_reminder(task_id: int, user_email: str):
    """Send reminder notification and update reminder_sent flag"""
    # Send email via SMTP
    await send_email(
        to=user_email,
        subject=f"Reminder: {task.title}",
        body=f"Your task '{task.title}' is due soon."
    )

    # Update reminder_sent flag
    await db.execute(
        "UPDATE tasks SET reminder_sent = TRUE WHERE id = :task_id",
        {"task_id": task_id}
    )
```

---

## Data Examples

### Example 1: Non-Recurring Task (Backward Compatible)

```sql
INSERT INTO tasks (user_id, title, description, completed)
VALUES (
    'user-123',
    'Buy groceries',
    'Milk, bread, eggs',
    FALSE
);

-- Result:
-- id: 1
-- user_id: user-123
-- title: Buy groceries
-- description: Milk, bread, eggs
-- completed: FALSE
-- completed_at: NULL
-- recurring_pattern: NULL  ← Phase V field (NULL for non-recurring)
-- recurring_end_date: NULL
-- next_occurrence: NULL
-- reminder_at: NULL
-- reminder_sent: FALSE
```

---

### Example 2: Recurring Task (Daily Standup)

```sql
INSERT INTO tasks (user_id, title, recurring_pattern, recurring_end_date, next_occurrence)
VALUES (
    'user-123',
    'Daily standup',
    'FREQ=DAILY;INTERVAL=1',  -- Every day
    NULL,                     -- Infinite recurrence
    '2025-12-30 09:00:00'     -- Next occurrence tomorrow at 9am UTC
);

-- Result:
-- id: 2
-- user_id: user-123
-- title: Daily standup
-- completed: FALSE
-- recurring_pattern: FREQ=DAILY;INTERVAL=1
-- recurring_end_date: NULL (infinite)
-- next_occurrence: 2025-12-30 09:00:00
-- reminder_at: NULL (no reminder)
-- reminder_sent: FALSE
```

**Event Flow**:
1. User marks task complete → `completed = TRUE, completed_at = NOW()`
2. Task Service publishes `task.completed` event to Kafka
3. Recurring Task Service consumes event
4. Recurring Task Service creates next occurrence:
   ```sql
   INSERT INTO tasks (user_id, title, recurring_pattern, recurring_end_date, next_occurrence, completed)
   VALUES (
       'user-123',
       'Daily standup',
       'FREQ=DAILY;INTERVAL=1',
       NULL,
       '2025-12-31 09:00:00',  -- Next occurrence: day after tomorrow
       FALSE
   );
   ```

---

### Example 3: Task with Reminder

```sql
INSERT INTO tasks (user_id, title, due_date, reminder_at, reminder_sent)
VALUES (
    'user-123',
    'Submit Q4 report',
    '2025-12-31 17:00:00',  -- Due at 5pm UTC on Dec 31
    '2025-12-31 16:00:00',  -- Remind at 4pm UTC (1 hour before)
    FALSE                   -- Reminder not sent yet
);

-- Result:
-- id: 3
-- user_id: user-123
-- title: Submit Q4 report
-- due_date: 2025-12-31 17:00:00
-- reminder_at: 2025-12-31 16:00:00
-- reminder_sent: FALSE
```

**Event Flow**:
1. Task created → Task Service publishes `reminder.scheduled` event to Kafka
2. Notification Service consumes event
3. Notification Service schedules Dapr Job for `2025-12-31 16:00:00 UTC`
4. At scheduled time, Dapr Job invokes Notification Service webhook
5. Notification Service sends email notification
6. Notification Service updates: `UPDATE tasks SET reminder_sent = TRUE WHERE id = 3`

---

### Example 4: Recurring Task with End Date (Weekly Meeting)

```sql
INSERT INTO tasks (user_id, title, recurring_pattern, recurring_end_date, next_occurrence)
VALUES (
    'user-123',
    'Weekly team meeting',
    'FREQ=WEEKLY;BYDAY=TU',           -- Every Tuesday
    '2026-06-30 23:59:59',            -- Stop at end of June 2026 (6 months)
    '2026-01-07 14:00:00'             -- Next occurrence: Tuesday Jan 7, 2026 at 2pm UTC
);

-- Result:
-- recurring_pattern: FREQ=WEEKLY;BYDAY=TU
-- recurring_end_date: 2026-06-30 23:59:59
-- next_occurrence: 2026-01-07 14:00:00
```

**Recurring Task Service Logic**:
```python
from datetime import datetime, timezone
from dateutil.rrule import rrulestr

def calculate_next_occurrence(task):
    """Calculate next occurrence for recurring task"""
    rrule = rrulestr(task.recurring_pattern, dtstart=datetime.now(timezone.utc))
    next_occurrence = rrule.after(datetime.now(timezone.utc), inc=False)

    # Check recurring_end_date
    if task.recurring_end_date and next_occurrence > task.recurring_end_date:
        return None  # Recurring ended

    return next_occurrence

# When task completed on 2026-06-24 (last Tuesday in June)
next_occurrence = calculate_next_occurrence(task)  # Returns 2026-07-01 (first Tuesday in July)
# But 2026-07-01 > 2026-06-30 (recurring_end_date)
# → Do NOT create next occurrence, recurring series ends
```

---

## Index Strategy

### Performance Considerations

**Query Patterns**:
1. **List user's tasks**: `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`
2. **Find tasks due for next occurrence**: `SELECT * FROM tasks WHERE next_occurrence IS NOT NULL AND next_occurrence <= NOW()`
3. **Find tasks due for reminder**: `SELECT * FROM tasks WHERE reminder_at IS NOT NULL AND reminder_at <= NOW() AND reminder_sent = FALSE`

**Indexes**:

```sql
-- Existing indexes (Phase II/III/IV)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);  -- Primary query pattern
CREATE INDEX idx_tasks_completed ON tasks(completed);  -- Filter by completion status

-- Phase V indexes
CREATE INDEX idx_tasks_next_occurrence
  ON tasks(next_occurrence)
  WHERE next_occurrence IS NOT NULL;  -- Partial index (only recurring tasks)

CREATE INDEX idx_tasks_reminder_at
  ON tasks(reminder_at, user_id)  -- Composite index for reminder queries
  WHERE reminder_at IS NOT NULL AND reminder_sent = FALSE;  -- Partial index (only pending reminders)
```

**Index Explanation**:
- **`idx_tasks_next_occurrence`**: Partial index (only rows with `next_occurrence IS NOT NULL`) → Smaller index, faster queries
- **`idx_tasks_reminder_at`**: Composite index (reminder_at, user_id) → Supports both reminder queries AND user-specific reminder queries

**Query Performance** (Estimated):
- List user tasks: <10ms (indexed by user_id)
- Find next occurrences: <5ms (indexed by next_occurrence, typically <100 recurring tasks active)
- Find pending reminders: <5ms (indexed by reminder_at, filtered by reminder_sent = FALSE)

---

## Migration Strategy

### Pre-Migration Checklist

1. **Backup Database**:
   ```bash
   pg_dump -h neon-db.neon.tech -U postgres -d todo_db > backup_pre_phase5.sql
   ```

2. **Test Migration on Staging**:
   ```bash
   psql -h staging-db.neon.tech -U postgres -d todo_db_staging -f migrations/006_add_phase5_fields.sql
   ```

3. **Verify Indexes Created**:
   ```sql
   SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'tasks';
   ```

---

### Migration Execution

**Timeline**: Estimated <1 minute (ALTER TABLE on Neon PostgreSQL is fast for nullable columns)

**Steps**:

1. **Apply Migration** (Production):
   ```bash
   psql -h neon-db.neon.tech -U postgres -d todo_db -f migrations/006_add_phase5_fields.sql
   ```

2. **Verify Migration**:
   ```sql
   -- Check new columns exist
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'tasks'
   AND column_name IN ('recurring_pattern', 'recurring_end_date', 'next_occurrence', 'reminder_at', 'reminder_sent');

   -- Check indexes created
   SELECT indexname FROM pg_indexes WHERE tablename = 'tasks' AND indexname LIKE 'idx_tasks_%';
   ```

3. **Smoke Test**:
   ```sql
   -- Create test recurring task
   INSERT INTO tasks (user_id, title, recurring_pattern, next_occurrence)
   VALUES ('test-user', 'Test recurring', 'FREQ=DAILY;INTERVAL=1', NOW() + INTERVAL '1 day');

   -- Verify insertion
   SELECT id, title, recurring_pattern, next_occurrence FROM tasks WHERE user_id = 'test-user';

   -- Cleanup
   DELETE FROM tasks WHERE user_id = 'test-user';
   ```

---

### Rollback Plan

**If Migration Fails**:

1. **Rollback Migration**:
   ```bash
   psql -h neon-db.neon.tech -U postgres -d todo_db -f migrations/006_rollback.sql
   ```

2. **Restore from Backup** (if rollback fails):
   ```bash
   psql -h neon-db.neon.tech -U postgres -d todo_db < backup_pre_phase5.sql
   ```

3. **Verify Rollback**:
   ```sql
   -- Check columns removed
   SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks';
   -- Should NOT include: recurring_pattern, recurring_end_date, next_occurrence, reminder_at, reminder_sent
   ```

---

## Data Consistency Guarantees

### User Isolation

**Principle**: All queries MUST filter by `user_id` to enforce user isolation (per Clarification #2)

**Application Layer Enforcement** (SQLModel example):
```python
from sqlmodel import select, Session
from models import Task

async def list_user_tasks(session: Session, user_id: str):
    """List tasks for a specific user (user isolation)"""
    statement = select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
    results = session.exec(statement)
    return results.all()

async def create_next_occurrence(session: Session, user_id: str, task_data: dict):
    """Create next occurrence with user_id from event (user isolation)"""
    new_task = Task(
        user_id=user_id,  # ALWAYS set from authenticated context
        title=task_data["title"],
        recurring_pattern=task_data["recurring_pattern"],
        next_occurrence=task_data["next_occurrence"]
    )
    session.add(new_task)
    session.commit()
```

---

### UTC-Only Timestamps

**Principle**: All timestamps stored in UTC (per Clarification #1)

**Application Layer Enforcement**:
```python
from datetime import datetime, timezone

def now_utc():
    """Get current UTC timestamp (naive datetime)"""
    return datetime.now(timezone.utc).replace(tzinfo=None)

# Example: Calculate reminder_at (1 hour before due_date)
def calculate_reminder_at(due_date: datetime) -> datetime:
    """Calculate reminder time (UTC)"""
    return due_date - timedelta(hours=1)
```

**Frontend Conversion** (TypeScript):
```typescript
// Convert UTC timestamp to user's local timezone for display
function formatTaskDueDate(utcTimestamp: string): string {
  const utcDate = new Date(utcTimestamp + 'Z');  // Append 'Z' to indicate UTC
  return utcDate.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

// Example:
// Database: "2025-12-30 09:00:00" (UTC)
// Display (PST): "12/30/2025, 1:00:00 AM" (PST = UTC-8)
```

---

## Related Documents

- [spec.md](./spec.md) - Phase V Feature Specification
- [plan.md](./plan.md) - Implementation Plan
- [research.md](./research.md) - Technical Research (python-dateutil, UTC-only approach)
- [contracts/event-schemas.yaml](./contracts/event-schemas.yaml) - Event schemas referencing these database fields

---

**Document Version**: 1.0
**Last Updated**: 2025-12-29
**Next Steps**: Run migration 006 on staging, verify indexes, test recurring task creation
