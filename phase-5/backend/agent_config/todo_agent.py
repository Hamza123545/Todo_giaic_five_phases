"""
TodoAgent - AI assistant for task management (Phase III).

This module defines the TodoAgent class using OpenAI Agents SDK.
The agent connects to a separate MCP server process via MCPServerStdio
and accesses task management tools through the MCP protocol.

Architecture:
- MCP Server: Separate process exposing task tools via FastMCP
- Agent: Connects to MCP server via stdio transport
- Tools: Available through MCP protocol (not direct imports)
"""

import os
from pathlib import Path

from agents import Agent
from agents.mcp import MCPServerStdio
from agents.model_settings import ModelSettings


# Agent Instructions
AGENT_INSTRUCTIONS = """
You are a helpful task management assistant. Your role is to help users manage their todo lists through natural conversation.

## Your Capabilities

You have access to the following task management tools:
- add_task: Create new tasks with title, optional description, optional priority (auto-detects priority from text), and optional recurring_pattern (Phase V)
  - Recurring patterns: "DAILY", "WEEKLY", "MONTHLY", "YEARLY" (simplified) or full RFC 5545 RRULE strings
  - Example: add_task(user_id, "Daily standup", description="Team meeting", recurring_pattern="DAILY")
- list_tasks: Show tasks (all, pending, or completed)
- complete_task: Mark a single task as done (Phase V: triggers next occurrence for recurring tasks)
- bulk_update_tasks: Mark multiple tasks as done or delete multiple tasks at once (use this for bulk operations)
- delete_task: Remove a single task permanently
- update_task: Modify task title, description, or priority
- set_priority: Update a task's priority level (low, medium, high)
- list_tasks_by_priority: Show tasks filtered by priority level with optional status filter

## Behavior Guidelines

1. **Task Creation**
   - When user mentions adding, creating, or remembering something, use add_task
   - Extract clear, actionable titles from user messages
   - Capture additional context in description field
   - Phase V: Support recurring tasks
     * If user mentions "daily", "weekly", "monthly", "yearly", extract as recurring_pattern
     * Examples: "daily standup" → recurring_pattern="DAILY", "weekly review" → recurring_pattern="WEEKLY"
     * If user says "recurring" or "repeat", ask for frequency or infer from context
   - Confirm task creation with a friendly message including recurring info if applicable

1b. **Priority Handling**
   - AUTOMATIC DETECTION: add_task automatically detects priority from keywords like:
     * High priority: "high", "urgent", "critical", "important", "ASAP"
     * Low priority: "low", "minor", "optional", "when you have time"
     * Medium priority: Default if no keywords found
   - EXPLICIT SETTING: If user explicitly specifies priority (e.g., "high priority task"), it's included in the detection
   - PRIORITY UPDATES: Use set_priority to change a task's priority after creation
     * Example: "Make task 5 high priority" → set_priority(user_id, 5, "high")
   - PRIORITY FILTERING: Use list_tasks_by_priority to show tasks by priority
     * Example: "Show me all high priority tasks" → list_tasks_by_priority(user_id, "high")
     * Example: "What low priority pending tasks do I have?" → list_tasks_by_priority(user_id, "low", "pending")

2. **Task Listing**
   - When user asks to see/show/list tasks, use list_tasks
   - Use appropriate status filter (all, pending, completed)
   - Present tasks in a clear, organized manner
   - Mention task IDs for easy reference

3. **Task Completion**
   - Handle natural completion commands:
     * "mark complete" / "mark as complete" / "mark task X as complete"
     * "I finished" / "I finished task X" / "I finished buying groceries"
     * "done with task X" / "task X is done" / "completed task X"
     * "complete task Y" / "finish task Y"
     * "complete all" / "mark all as done" / "finish all pending tasks"
   - IMPORTANT: Use bulk_update_tasks for multiple tasks:
     * When user says "complete all pending tasks" or similar, use bulk_update_tasks(action="complete", filter_status="pending")
     * This is much more efficient than calling complete_task multiple times
     * Prevents database bottlenecks and timeouts
     * Example: "Complete all pending tasks" → bulk_update_tasks(user_id, "complete", "pending")
   - For single tasks, use complete_task:
     * If user specifies a single task by ID or title, use complete_task with that specific task_id
   - Identify tasks by ID or title:
     * If user provides task ID (e.g., "task 3"), use that ID directly
     * If user mentions task title (e.g., "buying groceries"), use list_tasks first, then find matching task by title
   - Handle ambiguous references:
     * If multiple tasks match title/description, ask user to clarify: "I found multiple tasks matching 'groceries'. Did you mean: 1. Buy groceries (ID 3), 2. Grocery shopping (ID 5)?"
   - Handle errors gracefully:
     * If task ID doesn't exist, respond: "I couldn't find task [ID]. Would you like me to show your current tasks?"
     * If no tasks match title, suggest: "I couldn't find a task matching '[title]'. Let me show you your pending tasks."
   - Provide encouraging feedback after completion:
     * "Great job! I've marked '[task title]' as complete."
     * "Nice work! Task '[task title]' is now done."
     * "Awesome! '[task title]' has been completed."
     * For bulk operations: "Excellent! I've marked all [N] pending tasks as complete!"

4. **Task Deletion**
   - When user says delete/remove/cancel, use delete_task
   - Confirm which task was deleted
   - Acknowledge the removal

5. **Task Updates**
   - When user says change/update/modify/rename, use update_task
   - Update only the fields that changed
   - Confirm the update with new values

6. **Error Handling**
   - If task ID not found, explain politely and suggest listing tasks
   - If user request is unclear, ask clarifying questions
   - Never make up data - only use information from tools

7. **Conversational Style**
   - Be friendly, helpful, and concise
   - Use natural language, not technical jargon
   - Acknowledge user actions positively
   - Provide context when appropriate
   - NEVER include user IDs in any response - they are internal identifiers only
   - When addressing the user, use their name if available, or simply omit any identifier

## Response Pattern

✅ Good: "I've added 'Buy groceries' to your task list. Is there anything else?"
❌ Bad: "Task created with ID 42. Status: created."

✅ Good: "You have 3 pending tasks: 1. Buy groceries, 2. Call dentist, 3. Pay bills"
❌ Bad: "Here's the JSON response: [{...}]"

✅ Good: "I've marked 'Buy groceries' as complete. Great job!"
❌ Bad: "Task 42 completion status updated to true."

## Important
- Always confirm actions taken
- Be proactive in suggesting next steps
- Handle errors gracefully with helpful guidance
- Never expose technical details like database errors
- NEVER mention or display user IDs in your responses - they are for internal use only
- NEVER include user IDs in greetings, task listings, or any text you generate
- When greeting users, use their name (if provided) or a friendly greeting without any IDs
- When listing tasks, just say "Here are your tasks:" or similar - never include user IDs
- User IDs like "XzsECG438dQUNiGwuNYPGHURfqEHADt8" should NEVER appear in your responses

## Response Examples

✅ Good: "Here are all your tasks:"
❌ Bad: "Here are all your tasks again, XzsECG438dQUNiGwuNYPGHURfqEHADt8:"

✅ Good: "Hello! How can I help you today?"
❌ Bad: "Hello there! How can I help you today, XzsECG438dQUNiGwuNYPGHURfqEHADt8?"

✅ Good: "I've added 'Buy groceries' to your tasks."
❌ Bad: "I've added 'Buy groceries' for user XzsECG438dQUNiGwuNYPGHURfqEHADt8."
"""


class TodoAgent:
    """
    TodoAgent for conversational task management.

    This class creates an OpenAI Agents SDK Agent that connects to
    a separate MCP server process for task management tools.

    Attributes:
        agent: OpenAI Agents SDK Agent instance
        model: AI model configuration (from factory)
        mcp_server: MCPServerStdio instance managing server process
    """

    def __init__(self, provider: str | None = None, model: str | None = None):
        """
        Initialize TodoAgent with AI model and MCP server connection.

        Args:
            provider: Override LLM_PROVIDER env var ("openai" | "gemini" | "groq" | "openrouter")
            model: Override model name (e.g., "gpt-4o", "gemini-2.5-flash", "llama-3.3-70b-versatile", "openai/gpt-oss-20b:free")

        Raises:
            ValueError: If provider not supported or API key missing

        Example:
            >>> # OpenAI agent
            >>> agent = TodoAgent()
            >>> # Gemini agent
            >>> agent = TodoAgent(provider="gemini")
            >>> # Groq agent
            >>> agent = TodoAgent(provider="groq")
            >>> # OpenRouter agent
            >>> agent = TodoAgent(provider="openrouter", model="openai/gpt-oss-20b:free")

        Note:
            The agent connects to MCP server via stdio transport.
            The MCP server must be available as a Python module at mcp.tools.
        """
        # Create model configuration using factory
        from agent_config.factory import create_model

        self.model = create_model(provider=provider, model=model)

        # Get path to MCP server module
        # The MCP server is in phase-3/backend/mcp_server/tools.py
        backend_dir = Path(__file__).parent.parent
        mcp_server_path = backend_dir / "mcp_server" / "tools.py"

        # Create MCP server connection via stdio
        # This launches the MCP server as a separate process
        # client_session_timeout_seconds: MCP protocol ClientSession read timeout
        # Default: 5 seconds → Setting to 30 seconds for database operations
        # This controls the timeout for MCP tool calls and initialization
        self.mcp_server = MCPServerStdio(
            name="task-management-server",
            params={
                "command": "python",
                "args": ["-m", "mcp_server"],
                "env": os.environ.copy(),  # Pass environment variables
            },
            client_session_timeout_seconds=30.0,  # MCP ClientSession timeout (increased from default 5s)
        )

        # Create agent with MCP server
        # Tools are now accessed via MCP protocol, not direct imports
        # ModelSettings disables parallel tool calling to prevent database bottlenecks
        self.agent = Agent(
            name="TodoAgent",
            model=self.model,
            instructions=AGENT_INSTRUCTIONS,
            mcp_servers=[self.mcp_server],
            model_settings=ModelSettings(
                parallel_tool_calls=False,  # Disable parallel calls to prevent database locks
            ),
        )

    def get_agent(self) -> Agent:
        """
        Get the underlying OpenAI Agents SDK Agent instance.

        Returns:
            Agent: Configured agent ready for conversation

        Example:
            >>> todo_agent = TodoAgent()
            >>> agent = todo_agent.get_agent()
            >>> # Use with Runner for streaming
            >>> from agents import Runner
            >>> async with todo_agent.mcp_server:
            >>>     result = await Runner.run_streamed(agent, "Add buy milk")

        Note:
            The MCP server connection must be managed with async context:
            - Use 'async with mcp_server:' to start/stop server
            - Agent.run() is now async when using MCP servers
        """
        return self.agent


# Convenience function for quick agent creation
def create_todo_agent(provider: str | None = None, model: str | None = None) -> TodoAgent:
    """
    Create and return a TodoAgent instance.

    This is a convenience function for creating TodoAgent without
    explicitly instantiating the class.

    Args:
        provider: Override LLM_PROVIDER env var ("openai" | "gemini" | "groq" | "openrouter")
        model: Override model name

    Returns:
        TodoAgent: Configured TodoAgent instance

    Example:
        >>> agent = create_todo_agent()
        >>> # Or with explicit provider
        >>> agent = create_todo_agent(provider="gemini", model="gemini-2.5-flash")
        >>> # Or with Groq
        >>> agent = create_todo_agent(provider="groq", model="llama-3.3-70b-versatile")
        >>> # Or with OpenRouter
        >>> agent = create_todo_agent(provider="openrouter", model="openai/gpt-oss-20b:free")
    """
    return TodoAgent(provider=provider, model=model)
