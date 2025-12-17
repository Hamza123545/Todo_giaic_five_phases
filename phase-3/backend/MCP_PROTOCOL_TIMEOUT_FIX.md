# MCP Protocol-Level Timeout Fix

## Issue Discovered

While the previous fixes set the MCPServerStdio `timeout` parameter, there was a **second timeout layer** at the MCP protocol level that was causing failures:

```
Error initializing MCP server: Timed out while waiting for response to ClientRequest. Waited 5.0 seconds.
```

### Root Cause
The error was occurring at two different layers:
1. **Server startup timeout** (`timeout` parameter) - Set to 30s ✅
2. **MCP protocol request timeout** (`request_timeout` parameter) - Still at default 5s ❌

The stack trace showed the timeout happening in `mcp/shared/session.py` during `session.initialize()`, which is the MCP protocol initialization, not the server startup.

## Solution

Added `request_timeout=30.0` parameter to MCPServerStdio configuration to set the **MCP protocol-level timeout** to 30 seconds.

### Before (Failing)
```python
self.mcp_server = MCPServerStdio(
    name="task-management-server",
    params={
        "command": "python",
        "args": ["-m", "mcp_server"],
        "env": os.environ.copy(),
        "timeout": 30.0,  # Only sets server startup timeout
    },
)
# MCP protocol timeout: Still at default 5s ❌
```

### After (Fixed)
```python
self.mcp_server = MCPServerStdio(
    name="task-management-server",
    params={
        "command": "python",
        "args": ["-m", "mcp_server"],
        "env": os.environ.copy(),
    },
    timeout=30.0,  # Server startup timeout
    request_timeout=30.0,  # MCP protocol request timeout ✅
)
```

## Technical Details

### Timeout Layers in MCP Architecture

```
User Request
    ↓
ChatKit Server
    ↓
MCPServerStdio.__aenter__()
    ├─ timeout=30.0 (Server startup: process initialization)
    ├─ request_timeout=30.0 (MCP protocol: individual requests)
    ↓
MCP Session.initialize()
    ├─ Calls send_request() with request_timeout
    ├─ anyio.fail_after(request_timeout)
    ↓
MCP Protocol Layer (communication with MCP server)
    ↓
Database Operations (<100ms with direct SQL)
    ↓
Response streamed back
```

### Key Parameters

| Parameter | Purpose | Default | New Value |
|-----------|---------|---------|-----------|
| `timeout` | Server process startup timeout | 5s | 30s |
| `request_timeout` | Individual MCP protocol request timeout | 5s | 30s |

Both must be set to handle:
1. **Server startup**: Spawning Python process, loading MCP server code
2. **MCP initialization**: Protocol handshake between client and server
3. **Tool requests**: Individual MCP tool calls (with <100ms direct SQL operations)

## Files Modified

**File**: `backend/agent_config/todo_agent.py`
**Lines**: 182-197

```python
# Create MCP server connection via stdio
# This launches the MCP server as a separate process
# Timeout parameters:
# - timeout: Process startup timeout (30s)
# - request_timeout: Individual MCP protocol request timeout (30s)
# Both are needed to handle database operations without timeouts
self.mcp_server = MCPServerStdio(
    name="task-management-server",
    params={
        "command": "python",
        "args": ["-m", "mcp_server"],
        "env": os.environ.copy(),  # Pass environment variables
    },
    timeout=30.0,  # Server startup timeout (increased from default 5s)
    request_timeout=30.0,  # MCP protocol request timeout (increased from default 5s)
)
```

## Commit

```
Commit: a99f4cc
Message: fix(phase-3): add MCP protocol-level timeout to prevent 5s timeout during session initialization
```

## Impact

- ✅ Eliminates "Timed out while waiting for response to ClientRequest. Waited 5.0 seconds" errors
- ✅ Allows MCP protocol initialization to complete within 30s window
- ✅ Enables bulk_update_tasks and other database operations to complete reliably
- ✅ Provides adequate buffer for server startup + protocol initialization + database operations

## Testing

To verify the fix:

1. **Start backend server**:
   ```bash
   cd phase-3/backend
   uv run uvicorn main:app --reload --port 8000
   ```

2. **Send chat request to trigger MCP**:
   ```bash
   POST http://localhost:8000/api/chatkit
   {
     "message": "Complete all pending tasks",
     "conversation_id": "test-conv"
   }
   ```

3. **Expected behavior**:
   - No "Timed out waiting" errors
   - Bulk operation completes in <100ms
   - Agent responds with completion summary
   - No MCP timeout errors in logs

## Related Issues

This fix complements the earlier optimizations:
- ✅ Increased server timeout: 5s → 30s
- ✅ Disabled parallel tool calls: Prevents database locks
- ✅ Optimized bulk_update_tasks: ORM loop → Direct SQL (<100ms)
- ✅ **NEW**: Added MCP protocol timeout: 5s → 30s

Together, these ensure the entire MCP request pipeline completes reliably.

## Summary

The MCP protocol timeout was an overlooked second layer that was causing failures even after fixing the server timeout. By adding `request_timeout=30.0`, we now have complete timeout coverage across all layers of the MCP architecture, ensuring reliable execution of database operations through the chat interface.
