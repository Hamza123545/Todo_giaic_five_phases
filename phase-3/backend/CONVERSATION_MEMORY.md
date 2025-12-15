# Conversation Memory Implementation

## Problem Statement

The chatbot was not maintaining conversation context across messages. When a user said:
1. "delete the task with the name of shopping"
2. "Delete both tasks"

The agent would ask for clarification on the second message instead of remembering the context from the first message about "shopping" tasks.

## Solution: OpenAI Agents SDK SQLiteSession

We implemented conversation memory using OpenAI Agents SDK's `SQLiteSession` to automatically maintain conversation history across multiple turns.

## Implementation Details

### 1. Import SQLiteSession

```python
from agents import Agent, Runner, SQLiteSession
```

### 2. Create Session Per User+Thread

Each user's conversation in each thread gets a unique session ID:

```python
session_id = f"user_{user_id}_thread_{thread.id}"
session = SQLiteSession(session_id, self.session_db_path)
```

**Benefits:**
- **User Isolation**: Each user's conversations are separate
- **Thread Isolation**: Different chat threads maintain independent history
- **Automatic Persistence**: SQLite database persists across server restarts

### 3. Pass Session to Runner with String Input

**IMPORTANT**: When using sessions, you must pass **string inputs**, not lists!

```python
# Check if first message and add system context
history = await session.get_items()
if not history:
    system_message = {
        "role": "system",
        "content": f"User name: {user_name}, User ID: {user_id}"
    }
    await session.add_items([system_message])

# Extract user message as string
user_message = agent_input[0].get("content", "")

# Run with string input (required for sessions!)
result = Runner.run_streamed(
    self.agent,
    user_message,  # String, not list!
    context=agent_context,
    session=session,  # Enable conversation memory
)
```

**How It Works:**
1. **First Turn**: Add system message to session, then run with user message string
2. **Subsequent Turns**: Session automatically retrieves full history (system + previous messages)
3. **After Processing**: Session stores both the user message and agent response for future turns

**Why String Input?**
- Sessions manage conversation history automatically
- Passing a list would conflict with session's history management
- String input allows session to merge history correctly

## Example: Multi-Turn Conversation

### Before (No Memory)
```
User: "delete the task with the name of shopping"
Agent: "I found 5 tasks. Which one do you want to delete?"

User: "Delete both tasks"
Agent: "I see you have 5 tasks. Which two would you like to delete?"
  ❌ Agent forgot about "shopping" from previous message
```

### After (With SQLiteSession)
```
User: "delete the task with the name of shopping"
Agent: "I found 2 tasks with 'shopping' in the name. Would you like me to delete them?"

User: "Delete both tasks"
Agent: "Deleting both shopping tasks..."
  ✅ Agent remembers the context from previous message
```

## File Changes

### `services/chatkit_server.py`

**Added:**
- Import of `SQLiteSession` from agents SDK
- `session_db_path` parameter to `__init__`
- Session creation in `respond()` method
- Session parameter to `Runner.run_streamed()`

**Key Code:**
```python
# Create SQLiteSession for this user+thread combination
session_id = f"user_{user_id}_thread_{thread.id}"
session = SQLiteSession(session_id, self.session_db_path)

# Run agent with session to enable conversation memory
result = Runner.run_streamed(
    self.agent,
    personalized_input,
    context=agent_context,
    session=session,
)
```

## Database Storage

### Location
- **Development**: `phase-3/backend/chat_sessions.db`
- **Production**: Configurable via `session_db_path` parameter

### Structure
SQLiteSession automatically creates and manages the database schema:
- **Tables**: Stores conversation history per session_id
- **Schema**: Managed by OpenAI Agents SDK
- **Automatic**: No manual schema creation needed

### .gitignore
The `*.db` pattern in `.gitignore` ensures conversation databases are not committed to version control.

## Testing

### Test File: `tests/test_conversation_memory.py`

**Test Cases:**
1. **Multi-Turn Context**: Verifies agent remembers information from previous turns
2. **Session Isolation**: Ensures different users/threads don't share memory
3. **History Retrieval**: Tests ability to retrieve conversation history

**Run Tests:**
```bash
cd phase-3/backend
uv run pytest tests/test_conversation_memory.py -v
```

## Configuration

### Default Settings
```python
# In routers/chatkit.py
_chatkit_server = TaskChatKitServer(
    _store,
    session_db_path="chat_sessions.db"  # Default SQLite database
)
```

### Custom Database Path
```python
# Production example
_chatkit_server = TaskChatKitServer(
    _store,
    session_db_path="/var/data/chat_sessions.db"
)
```

## Performance Considerations

### Session Management
- **Automatic Cleanup**: Sessions persist until manually cleared
- **Memory Efficient**: Only loads relevant session history
- **Scalable**: SQLite handles thousands of concurrent sessions

### Best Practices
1. **Session Limits**: Consider limiting conversation history length for very long conversations
2. **Periodic Cleanup**: Implement cleanup for old/inactive sessions
3. **Database Backups**: Regular backups of `chat_sessions.db` for data retention

## Session Operations

### Get Conversation History
```python
history = await session.get_items()
# Returns: [{"role": "user", "content": "..."}, ...]
```

### Add Messages Manually
```python
await session.add_items([
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi!"}
])
```

### Clear Session (Reset Conversation)
```python
await session.clear_session()
```

### Pop Last Message (Undo)
```python
last_item = await session.pop_item()
```

## References

### OpenAI Agents SDK Documentation
- **Sessions Guide**: https://github.com/openai/openai-agents-python/blob/main/docs/sessions/index.md
- **SQLiteSession API**: Built-in session implementation with SQLite
- **Session Protocol**: Interface for custom session implementations

### Key Concepts
- **Session**: Container for conversation history
- **Session ID**: Unique identifier per user+thread
- **Automatic Memory**: SDK handles history retrieval/storage
- **User Isolation**: Different sessions = independent conversations

## Troubleshooting

### Issue: Agent Not Remembering Context
**Check:**
1. Session is created with correct `session_id`
2. Same session instance is used across turns
3. Session is passed to `Runner.run_streamed()`
4. Database file is writable

### Issue: Different Users Seeing Each Other's History
**Check:**
1. Session ID includes `user_id`: `f"user_{user_id}_thread_{thread.id}"`
2. Each request creates/loads the correct session
3. No session reuse across different users

### Issue: Database Lock Errors
**Solution:**
- SQLite handles concurrent reads well
- For high concurrency, consider Redis: `RedisSession.from_url()`

## Future Enhancements

1. **Redis Sessions**: For distributed/scalable deployments
2. **Session Expiration**: Auto-cleanup of old conversations
3. **History Limits**: Max messages per session
4. **Conversation Analytics**: Track session metrics
5. **Export/Import**: Backup and restore conversations

## Migration from Previous Implementation

### Before (Stateless)
```python
result = Runner.run_streamed(
    self.agent,
    personalized_input,
    context=agent_context,
)
```

### After (With Memory)
```python
session = SQLiteSession(session_id, self.session_db_path)
result = Runner.run_streamed(
    self.agent,
    personalized_input,
    context=agent_context,
    session=session,  # One line change!
)
```

**Migration Steps:**
1. Import `SQLiteSession`
2. Create session with unique ID
3. Pass session to Runner
4. Done! Memory automatically enabled
