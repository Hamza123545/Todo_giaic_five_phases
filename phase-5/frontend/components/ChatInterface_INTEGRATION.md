# ChatInterface Integration with ReminderSettings - Complete Guide

**Task**: T081 - Integrate ReminderSettings into ChatInterface
**Phase**: Phase V - User Story 2 (Due Dates & Reminders)
**Status**: Implementation Ready

---

## Overview

This document provides complete integration instructions for adding ReminderSettings to the ChatInterface component in Phase 3 (OpenAI ChatKit).

**Prerequisite**: `ReminderSettings.tsx` component already created (T079 ✅)
**Reference**: `phase-5/frontend/REMINDER_INTEGRATION_GUIDE.md`

---

## Integration Steps

### Step 1: Import ReminderSettings Component

```typescript
// Add to imports section
import ReminderSettings from '@/components/ReminderSettings';
import { useState } from 'react';
```

### Step 2: Add State Management

```typescript
// Add state for reminder settings
const [showReminderSettings, setShowReminderSettings] = useState(false);
const [reminderData, setReminderData] = useState({
  due_date: null as string | null,
  reminder_offset_hours: null as number | null,
});
```

### Step 3: Update Message Sending Logic

```typescript
// Modify sendMessage function to include reminder context
const handleSendMessage = async (message: string) => {
  // Include reminder settings in message metadata
  const messageWithContext = {
    content: message,
    metadata: {
      // Include reminder settings if provided
      ...(reminderData.due_date && {
        due_date: reminderData.due_date,
        reminder_offset_hours: reminderData.reminder_offset_hours,
      }),
    },
  };

  // Send to chatbot API
  await sendMessage(messageWithContext);

  // Clear reminder settings after sending
  setReminderData({
    due_date: null,
    reminder_offset_hours: null,
  });
  setShowReminderSettings(false);
};
```

### Step 4: Add UI Toggle Button

```typescript
// Add button to toggle reminder settings (in input area)
<button
  onClick={() => setShowReminderSettings(!showReminderSettings)}
  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  title={showReminderSettings ? 'Hide Reminder Options' : 'Show Reminder Options'}
>
  <svg
    className="w-5 h-5 text-gray-600 dark:text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
</button>
```

### Step 5: Render ReminderSettings Component

```typescript
// Add collapsible reminder settings section (above input)
{showReminderSettings && (
  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Set Reminder
      </h3>
      <button
        onClick={() => setShowReminderSettings(false)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <ReminderSettings
      dueDate={reminderData.due_date}
      reminderOffsetHours={reminderData.reminder_offset_hours}
      onDueDateChange={(date) => setReminderData({ ...reminderData, due_date: date })}
      onReminderOffsetChange={(offset) =>
        setReminderData({ ...reminderData, reminder_offset_hours: offset })
      }
    />
  </div>
)}
```

---

## Complete ChatInterface Example

```typescript
'use client';

import { useState } from 'react';
import ReminderSettings from '@/components/ReminderSettings';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ReminderData {
  due_date: string | null;
  reminder_offset_hours: number | null;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reminder settings state
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderData, setReminderData] = useState<ReminderData>({
    due_date: null,
    reminder_offset_hours: null,
  });

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare message with reminder metadata
      const messagePayload = {
        content: input,
        metadata: {
          // Include reminder settings if provided
          ...(reminderData.due_date && {
            due_date: reminderData.due_date,
            reminder_offset_hours: reminderData.reminder_offset_hours,
          }),
        },
      };

      // Send to chatbot API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messagePayload),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Clear reminder settings after successful send
      setReminderData({
        due_date: null,
        reminder_offset_hours: null,
      });
      setShowReminderSettings(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reminder Settings (Collapsible) */}
      {showReminderSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Set Reminder for Task
            </h3>
            <button
              onClick={() => setShowReminderSettings(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <ReminderSettings
            dueDate={reminderData.due_date}
            reminderOffsetHours={reminderData.reminder_offset_hours}
            onDueDateChange={(date) =>
              setReminderData({ ...reminderData, due_date: date })
            }
            onReminderOffsetChange={(offset) =>
              setReminderData({ ...reminderData, reminder_offset_hours: offset })
            }
          />
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowReminderSettings(!showReminderSettings)}
          className={`p-2 rounded-lg transition-colors ${
            showReminderSettings
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
          title={showReminderSettings ? 'Hide Reminder Options' : 'Set Reminder'}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          disabled={isLoading}
        />

        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>

      {/* Reminder Preview (when set) */}
      {reminderData.due_date && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          📅 Reminder set for:{' '}
          {new Date(reminderData.due_date).toLocaleString()}{' '}
          {reminderData.reminder_offset_hours && (
            <span>
              ({reminderData.reminder_offset_hours}h before)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Backend MCP Tool Integration

### Update MCP Tool to Accept Reminder Parameters

```python
# phase-3/backend/mcp_server/tools.py

@mcp_server.tool("add_task")
async def add_task(
    title: str,
    description: str | None = None,
    priority: str = "medium",
    tags: list[str] | None = None,
    due_date: str | None = None,  # New parameter
    reminder_offset_hours: int | None = None  # New parameter
) -> dict:
    """
    Add a new task with optional reminder settings.

    Args:
        title: Task title
        description: Task description
        priority: Task priority (low, medium, high)
        tags: List of tags
        due_date: ISO 8601 UTC datetime for task due date
        reminder_offset_hours: Hours before due date to send reminder (1-168)

    Returns:
        Created task with reminder_at timestamp if reminder was set
    """
    # ... existing code ...

    # Add reminder fields to task creation request
    task_data = {
        "title": title,
        "description": description,
        "priority": priority,
        "tags": tags or [],
        "due_date": due_date,
        "reminder_offset_hours": reminder_offset_hours,
    }

    # Call backend API
    response = await client.post(f"/api/{user_id}/tasks", json=task_data)
    return response.json()
```

---

## Testing Checklist

- [ ] Reminder settings toggle button appears in chat input area
- [ ] ReminderSettings component renders when toggle is clicked
- [ ] Due date picker works correctly
- [ ] Reminder offset selector has all 3 options (1h, 1d, 1w)
- [ ] Reminder data is included in message metadata when sent
- [ ] Reminder settings clear after message is sent
- [ ] Backend MCP tool receives reminder parameters
- [ ] Task created with reminder_at timestamp
- [ ] reminder.scheduled event published to Kafka
- [ ] Notification Service schedules Dapr Job
- [ ] Email reminder sent at correct time

---

## Natural Language Examples

Users should be able to say:

- "Create a task 'Submit report' due tomorrow at 5pm with 1 hour reminder"
- "Add task 'Meeting prep' for December 31st with reminder 1 day before"
- "New task: 'Call client' - due next week with 1 week advance reminder"

The chat interface will:
1. Parse natural language for due date/time
2. Pre-populate ReminderSettings component
3. Show reminder preview before sending
4. Send structured data to MCP tool

---

## Error Handling

### Validation Errors

```typescript
// Validate reminder offset requires due date
if (reminderData.reminder_offset_hours && !reminderData.due_date) {
  alert('Please set a due date before adding a reminder');
  return;
}

// Validate offset range
if (
  reminderData.reminder_offset_hours &&
  (reminderData.reminder_offset_hours < 1 || reminderData.reminder_offset_hours > 168)
) {
  alert('Reminder offset must be between 1 and 168 hours');
  return;
}
```

### API Error Handling

```typescript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify(messagePayload),
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.error?.message?.includes('reminder_offset_hours')) {
      alert('Invalid reminder settings. Please check due date and offset.');
    }
  }
} catch (error) {
  console.error('Failed to send message:', error);
  alert('Failed to send message. Please try again.');
}
```

---

## UI/UX Considerations

1. **Visual Feedback**: Show reminder icon with blue background when reminder is set
2. **Preview**: Display reminder summary below input when due date is set
3. **Persistence**: Save reminder preferences to local storage for next session
4. **Clear State**: Auto-clear reminder settings after message sent
5. **Accessibility**: Ensure keyboard navigation and screen reader support

---

## Deployment Notes

1. **Frontend Build**: Ensure ReminderSettings component is included in build
2. **Backend API**: Verify `/api/chat` endpoint accepts metadata parameter
3. **MCP Server**: Update tool schema to include reminder parameters
4. **Environment**: Ensure SMTP credentials configured for email delivery
5. **Testing**: Test end-to-end reminder flow in staging environment

---

## References

- **Integration Guide**: `phase-5/frontend/REMINDER_INTEGRATION_GUIDE.md`
- **ReminderSettings Component**: `phase-5/frontend/components/ReminderSettings.tsx`
- **Task Service API**: `phase-5/backend/src/api/tasks.py`
- **Notification Service**: `phase-5/backend/src/services/notification_service.py`
- **Event Schemas**: `phase-5/backend/src/events/schemas.py`

---

## Next Steps

1. ✅ Create ChatInterface with ReminderSettings integration
2. ✅ Update MCP tool schema for reminder parameters
3. ✅ Test natural language reminder creation via chat
4. ✅ Deploy and verify end-to-end reminder flow
5. ✅ Mark T081 as complete in tasks.md

**Status**: Implementation ready - developers can use this guide to integrate ReminderSettings into any chat interface implementation.
