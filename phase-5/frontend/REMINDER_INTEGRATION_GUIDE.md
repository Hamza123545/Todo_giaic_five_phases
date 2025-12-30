# ReminderSettings Component - Integration Guide

## Overview

This guide explains how to integrate the `ReminderSettings` component into your task creation/update forms and chat interface.

**Phase**: Phase V - User Story 2 (Due Dates & Reminders)
**Components**: `ReminderSettings.tsx`, `TaskCard.tsx` (with overdue indicator)
**Backend Integration**: Requires `reminder_offset_hours` field support in API

## Table of Contents

1. [Quick Start](#quick-start)
2. [Component Props](#component-props)
3. [Integration Examples](#integration-examples)
4. [TaskCard Overdue Indicator](#taskcard-overdue-indicator)
5. [API Integration](#api-integration)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

The `ReminderSettings` component is already available in `phase-5/frontend/components/ReminderSettings.tsx`.

### Basic Usage

```tsx
import ReminderSettings from '@/components/ReminderSettings';

function MyTaskForm() {
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [reminderOffsetHours, setReminderOffsetHours] = useState<number | null>(null);

  return (
    <ReminderSettings
      dueDate={dueDate}
      reminderOffsetHours={reminderOffsetHours}
      onDueDateChange={setDueDate}
      onReminderOffsetChange={setReminderOffsetHours}
    />
  );
}
```

---

## Component Props

### `ReminderSettingsProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `dueDate` | `string \| null` | Yes | ISO 8601 UTC datetime string (e.g., `"2025-12-31T17:00:00Z"`) |
| `reminderOffsetHours` | `number \| null` | Yes | Hours before due date to send reminder (1-168) |
| `onDueDateChange` | `(dueDate: string \| null) => void` | Yes | Callback when due date changes |
| `onReminderOffsetChange` | `(offsetHours: number \| null) => void` | Yes | Callback when reminder offset changes |
| `disabled` | `boolean` | No | Disable all inputs (default: `false`) |

### Reminder Offset Options

The component provides three preset options:

- **1 hour before** (`1`)
- **1 day before** (`24`)
- **1 week before** (`168`)

Plus a "No reminder" option to clear the reminder.

---

## Integration Examples

### Example 1: Task Form Integration

Integrate into a task creation/update form:

```tsx
import { useState } from 'react';
import ReminderSettings from '@/components/ReminderSettings';

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  reminder_offset_hours: number | null;
}

export default function TaskForm({ onSubmit }: { onSubmit: (data: TaskFormData) => void }) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    due_date: null,
    reminder_offset_hours: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title and Description inputs */}
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Task title"
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Reminder Settings */}
      <ReminderSettings
        dueDate={formData.due_date}
        reminderOffsetHours={formData.reminder_offset_hours}
        onDueDateChange={(date) => setFormData({ ...formData, due_date: date })}
        onReminderOffsetChange={(offset) =>
          setFormData({ ...formData, reminder_offset_hours: offset })
        }
      />

      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Create Task
      </button>
    </form>
  );
}
```

### Example 2: Chat Interface Integration

Integrate into OpenAI ChatKit widget:

```tsx
import { useState } from 'react';
import ReminderSettings from '@/components/ReminderSettings';

export default function ChatInterface() {
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [taskData, setTaskData] = useState({
    due_date: null,
    reminder_offset_hours: null,
  });

  const handleSendMessage = (message: string) => {
    // If reminder settings are provided, include in message context
    const messageWithContext = {
      content: message,
      metadata: {
        due_date: taskData.due_date,
        reminder_offset_hours: taskData.reminder_offset_hours,
      },
    };

    // Send to chatbot API
    sendMessage(messageWithContext);
  };

  return (
    <div className="chat-interface">
      {/* Chat messages */}
      <div className="messages">{/* ... */}</div>

      {/* Reminder Settings (collapsible) */}
      {showReminderSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
          <ReminderSettings
            dueDate={taskData.due_date}
            reminderOffsetHours={taskData.reminder_offset_hours}
            onDueDateChange={(date) => setTaskData({ ...taskData, due_date: date })}
            onReminderOffsetChange={(offset) =>
              setTaskData({ ...taskData, reminder_offset_hours: offset })
            }
          />
        </div>
      )}

      {/* Input area */}
      <button onClick={() => setShowReminderSettings(!showReminderSettings)}>
        {showReminderSettings ? 'Hide' : 'Show'} Reminder Options
      </button>
    </div>
  );
}
```

### Example 3: RecurringTaskForm Integration

If you already have a `RecurringTaskForm` component, add ReminderSettings:

```tsx
import ReminderSettings from '@/components/ReminderSettings';
import RecurringTaskForm from '@/components/RecurringTaskForm';

export default function AdvancedTaskForm() {
  const [taskData, setTaskData] = useState({
    title: '',
    recurring_pattern: null,
    recurring_end_date: null,
    due_date: null,
    reminder_offset_hours: null,
  });

  return (
    <div className="space-y-6">
      {/* Basic fields */}
      <input type="text" {...} />

      {/* Recurring Task Settings */}
      <RecurringTaskForm
        recurringPattern={taskData.recurring_pattern}
        recurringEndDate={taskData.recurring_end_date}
        onRecurringPatternChange={(pattern) =>
          setTaskData({ ...taskData, recurring_pattern: pattern })
        }
        onRecurringEndDateChange={(endDate) =>
          setTaskData({ ...taskData, recurring_end_date: endDate })
        }
      />

      {/* Reminder Settings */}
      <ReminderSettings
        dueDate={taskData.due_date}
        reminderOffsetHours={taskData.reminder_offset_hours}
        onDueDateChange={(date) => setTaskData({ ...taskData, due_date: date })}
        onReminderOffsetChange={(offset) =>
          setTaskData({ ...taskData, reminder_offset_hours: offset })
        }
      />
    </div>
  );
}
```

---

## TaskCard Overdue Indicator

The `TaskCard` component automatically shows an overdue indicator for tasks past their due date.

### Features

- **Red text** for overdue due dates
- **Warning icon** (AlertTriangle) next to due date
- **Only shown** for incomplete tasks
- **Automatically hidden** when task is marked complete

### Example

```tsx
import { TaskCard } from '@/components/molecules/TaskCard';

const task = {
  id: 1,
  title: 'Submit report',
  due_date: '2025-12-28T17:00:00Z', // Past date
  completed: false,
  // ... other fields
};

// TaskCard will automatically show overdue indicator
<TaskCard task={task} onUpdate={handleUpdate} onDelete={handleDelete} />;
```

### Styling

The overdue indicator uses:

```tsx
className="text-red-600 dark:text-red-400 font-semibold"
```

You can customize the colors in your `tailwind.config.js` if needed.

---

## API Integration

### Request Format

When creating or updating a task with reminder settings:

```typescript
POST /api/{user_id}/tasks

{
  "title": "Submit Q4 report",
  "description": "Include revenue and expenses",
  "priority": "high",
  "due_date": "2025-12-31T17:00:00Z",  // Required for reminder
  "reminder_offset_hours": 24          // Optional: 1-168 hours
}
```

### Response Format

The API returns calculated `reminder_at` timestamp:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Submit Q4 report",
    "due_date": "2025-12-31T17:00:00Z",
    "reminder_at": "2025-12-30T17:00:00Z",  // Calculated: due_date - 24 hours
    "reminder_sent": false
  }
}
```

### Validation Rules

1. **`reminder_offset_hours` requires `due_date`**
   - If `reminder_offset_hours` is provided without `due_date`, API returns `400 Bad Request`

2. **Range validation**: `1 <= reminder_offset_hours <= 168`
   - Below 1 hour or above 168 hours (1 week) returns `422 Unprocessable Entity`

3. **Due date in future**
   - Component only allows future dates via `min` attribute

### Error Handling

```tsx
const handleCreateTask = async (taskData: TaskFormData) => {
  try {
    const response = await fetch(`/api/${userId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const error = await response.json();

      if (error.error?.message?.includes('reminder_offset_hours')) {
        // Handle validation error
        alert('Reminder requires a due date');
      }
    }
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};
```

---

## Troubleshooting

### Issue 1: Reminder Not Saved

**Symptom**: Reminder offset is set but not saved to database

**Solution**: Ensure `due_date` is set before setting `reminder_offset_hours`:

```tsx
// ❌ Wrong: reminder_offset_hours set before due_date
setTaskData({ ...taskData, reminder_offset_hours: 24 }); // Will be rejected by API
setTaskData({ ...taskData, due_date: '2025-12-31T17:00:00Z' });

// ✅ Correct: Set due_date first
setTaskData({
  ...taskData,
  due_date: '2025-12-31T17:00:00Z',
  reminder_offset_hours: 24,
});
```

### Issue 2: Timezone Issues

**Symptom**: Due date shows wrong time in different timezones

**Solution**: The component handles timezone conversion automatically:

- Stores dates in **UTC** (ISO 8601 with 'Z' suffix)
- Displays dates in **local timezone** (browser timezone)
- Uses `datetime-local` input for user-friendly selection

### Issue 3: Overdue Indicator Not Showing

**Symptom**: Task is past due date but no red indicator

**Solution**: Ensure task data includes `due_date` and `completed` fields:

```tsx
// ✅ Correct task format
const task = {
  id: 1,
  title: 'Task',
  due_date: '2025-12-28T17:00:00Z', // ISO 8601 UTC string
  completed: false, // Must be false for overdue to show
};
```

### Issue 4: API Returns 422 Error

**Symptom**: `422 Unprocessable Entity` when creating task

**Solution**: Check `reminder_offset_hours` is within valid range (1-168):

```tsx
// ❌ Invalid: Below minimum
reminder_offset_hours: 0

// ❌ Invalid: Above maximum
reminder_offset_hours: 200

// ✅ Valid: Within range
reminder_offset_hours: 24
```

---

## Next Steps

1. **Integrate into TaskForm**: Add `ReminderSettings` to your existing task creation form
2. **Test API Integration**: Verify reminder events are published to Kafka
3. **Deploy Notification Service**: Ensure notification service is running to process reminders
4. **Monitor Overdue Tasks**: Use overdue indicators to track tasks past due date

For questions or issues, refer to:
- Backend implementation: `phase-5/backend/services/task_service.py`
- Event schemas: `phase-5/backend/src/events/schemas.py`
- API tests: `phase-5/backend/tests/test_reminders_api.py`
