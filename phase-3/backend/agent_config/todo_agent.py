"""
TodoAgent - AI assistant for task management (Phase III).

This module defines the TodoAgent class using OpenAI Agents SDK.
The agent orchestrates task operations via MCP tools and provides
conversational task management capabilities.
"""

from agents import Agent

from agent_config.factory import create_model
from mcp.tools import add_task, complete_task, delete_task, list_tasks, update_task


# Agent Instructions
AGENT_INSTRUCTIONS = """
You are a helpful task management assistant. Your role is to help users manage their todo lists through natural conversation.

## Your Capabilities

You have access to the following task management tools:
- add_task: Create new tasks with title and optional description
- list_tasks: Show tasks (all, pending, or completed)
- complete_task: Mark tasks as done
- delete_task: Remove tasks permanently
- update_task: Modify task title or description

## Behavior Guidelines

1. **Task Creation**
   - When user mentions adding, creating, or remembering something, use add_task
   - Extract clear, actionable titles from user messages
   - Capture additional context in description field
   - Confirm task creation with a friendly message

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
"""


class TodoAgent:
    """
    TodoAgent for conversational task management.

    This class wraps an OpenAI Agents SDK Agent with MCP tools
    for task operations. It provides streaming response capabilities
    and maintains conversation context.

    Attributes:
        agent: OpenAI Agents SDK Agent instance
        model: AI model configuration (from factory)
        tools: List of MCP tools registered with agent
    """

    def __init__(self, provider: str | None = None, model: str | None = None):
        """
        Initialize TodoAgent with AI model and MCP tools.

        Args:
            provider: Override LLM_PROVIDER env var ("openai" | "gemini")
            model: Override model name (e.g., "gpt-4o", "gemini-1.5-flash")

        Raises:
            ValueError: If provider not supported or API key missing

        Example:
            >>> # OpenAI agent
            >>> agent = TodoAgent()
            >>> # Gemini agent
            >>> agent = TodoAgent(provider="gemini")
        """
        # Create model configuration using factory
        self.model = create_model(provider=provider, model=model)

        # Register MCP tools
        self.tools = [
            add_task,
            list_tasks,
            complete_task,
            delete_task,
            update_task,
        ]

        # Create agent with tools and instructions
        self.agent = Agent(
            name="TodoAgent",
            model=self.model,
            instructions=AGENT_INSTRUCTIONS,
            tools=self.tools,
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
            >>> result = Runner.run_streamed(agent, [{"role": "user", "content": "Add buy milk"}])
        """
        return self.agent


# Convenience function for quick agent creation
def create_todo_agent(provider: str | None = None, model: str | None = None) -> TodoAgent:
    """
    Create and return a TodoAgent instance.

    This is a convenience function for creating TodoAgent without
    explicitly instantiating the class.

    Args:
        provider: Override LLM_PROVIDER env var ("openai" | "gemini")
        model: Override model name

    Returns:
        TodoAgent: Configured TodoAgent instance

    Example:
        >>> agent = create_todo_agent()
        >>> # Or with explicit provider
        >>> agent = create_todo_agent(provider="gemini", model="gemini-1.5-pro")
    """
    return TodoAgent(provider=provider, model=model)
