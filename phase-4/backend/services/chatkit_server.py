"""
ChatKit server implementation with task management widgets.

This module provides a ChatKit server that integrates with the existing
Agent SDK and MCP tools to provide a widget-based chat interface.

Features:
- Conversation context management via SQLiteSession
- Automatic memory of previous messages within a thread
- User-specific conversation isolation
"""

import logging
from typing import Any, AsyncIterator

from agents import Agent, Runner, SQLiteSession
from chatkit.server import ChatKitServer, ThreadStreamEvent, ThreadMetadata, UserMessageItem, Store
from chatkit.agents import AgentContext, stream_agent_response, simple_to_agent_input

from agent_config.todo_agent import create_todo_agent
from mcp_server.tools import add_task, list_tasks, complete_task, delete_task, update_task

logger = logging.getLogger(__name__)


class TaskChatKitServer(ChatKitServer):
    """ChatKit server for task management with widget support."""

    def __init__(self, store: Store, session_db_path: str = "chat_sessions.db"):
        """
        Initialize the ChatKit server.

        Args:
            store: ChatKit store for persisting threads and messages
            session_db_path: Path to SQLite database for conversation sessions
        """
        super().__init__(store)

        # Create TodoAgent instance
        self.todo_agent_instance = create_todo_agent()
        self.agent: Agent = self.todo_agent_instance.get_agent()

        # Store session database path for creating user-specific sessions
        self.session_db_path = session_db_path

        logger.info(f"TaskChatKitServer initialized with session DB: {session_db_path}")

    async def respond(
        self,
        thread: ThreadMetadata,
        input: UserMessageItem | None,
        context: Any,
    ) -> AsyncIterator[ThreadStreamEvent]:
        """
        Process user messages and stream responses with conversation memory.

        This method:
        1. Creates a unique SQLiteSession for the user+thread combination
        2. Automatically retrieves conversation history from previous turns
        3. Processes the new message with full context
        4. Stores the conversation in the session for future turns

        Args:
            thread: Thread metadata
            input: User message
            context: Request context containing user_id

        Yields:
            ThreadStreamEvent: Chat events (text, widgets, etc.)
        """
        # Extract user_id from context
        user_id = context.get("user_id")
        if not user_id:
            logger.error("No user_id in context")
            # TODO: Yield error event
            return

        logger.info(
            f"Processing message for user {user_id}, thread {thread.id}"
        )

        # Create agent context with user info
        agent_context = AgentContext(
            thread=thread,
            store=self.store,
            request_context=context,
        )

        # Add user name to context for personalization
        user_name = context.get("user_name", "there")
        logger.info(f"User name for personalization: {user_name}")

        # Create SQLiteSession for this user+thread combination
        # This ensures each user's conversation with each thread is isolated
        session_id = f"user_{user_id}_thread_{thread.id}"
        session = SQLiteSession(session_id, self.session_db_path)
        logger.info(f"Created session: {session_id}")

        # Check if this is the first message in the session
        # If so, add a system message with user context
        history = await session.get_items()
        if not history:
            # First message - add system context to session
            # IMPORTANT: user_id is for internal tool calls only - NEVER mention it to the user
            system_message = {
                "role": "system",
                "content": f"The user's name is {user_name}. Address them by their name when appropriate, but NEVER mention their user ID in any response. The user ID ({user_id}) is ONLY for internal tool calls (like list_tasks, add_task, etc.) and must NEVER appear in your text responses, greetings, task listings, or any user-facing messages. If you see a user ID in your own responses, you are making an error - user IDs should never be visible to users."
            }
            await session.add_items([system_message])
            logger.info(f"Added system message to new session {session_id}")

        # Extract the user message as a string directly from ChatKit input
        # When using sessions, we must pass strings, not lists
        # The session automatically manages conversation history
        if input and input.content:
            # UserMessageItem.content is a list of content items
            # Extract text from the first content item
            content_item = input.content[0] if input.content else None
            if content_item and hasattr(content_item, 'text'):
                user_message = content_item.text
            elif content_item and isinstance(content_item, dict):
                user_message = content_item.get('text', '')
            else:
                # Fallback: convert to string
                user_message = str(content_item) if content_item else ""
        else:
            user_message = ""

        logger.info(f"User message extracted: {user_message}")

        # Run agent with streaming AND session within MCP server context
        # The MCP server must be connected before the agent can use tools
        async with self.todo_agent_instance.mcp_server:
            # IMPORTANT: Pass string input (not list) when using sessions!
            # The session automatically:
            # 1. Retrieves conversation history from previous turns (including system message)
            # 2. Appends the new user message to the context
            # 3. Stores the conversation for future turns
            result = Runner.run_streamed(
                self.agent,
                user_message,  # String input (required when using session)
                context=agent_context,
                session=session,  # Enable conversation memory
            )

            # Stream agent response (widgets are streamed directly by tools)
            async for event in stream_agent_response(agent_context, result):
                yield event

        logger.info(f"Completed response for thread {thread.id} with conversation memory")
