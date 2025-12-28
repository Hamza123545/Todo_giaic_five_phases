"""
Test conversation memory with SQLiteSession.

This test verifies that the chatbot maintains conversation context
across multiple turns using OpenAI Agents SDK's SQLiteSession.
"""

import pytest
import asyncio
from agents import Agent, Runner, SQLiteSession


@pytest.mark.asyncio
async def test_conversation_memory_with_sqlite_session():
    """
    Test that SQLiteSession maintains conversation context across turns.

    Scenario:
    1. User: "delete the task with the name of shopping"
    2. Agent: (asks for clarification or lists tasks with 'shopping')
    3. User: "Delete both tasks"
    4. Agent: (should remember the previous context about 'shopping' tasks)

    Expected: Agent remembers the previous message and knows which tasks to delete
    """
    # Create a simple test agent
    agent = Agent(
        name="TestAgent",
        instructions="You are a helpful assistant. Remember context from previous messages.",
    )

    # Create session for conversation memory
    session = SQLiteSession("test_conversation_123", "test_sessions.db")

    # First turn: User mentions shopping tasks
    result1 = await Runner.run(
        agent,
        "I have two tasks named 'shopping'. Remember these for later.",
        session=session,
    )

    # Verify agent acknowledged the information
    assert result1.final_output is not None
    print(f"Turn 1 - Agent: {result1.final_output}")

    # Second turn: User asks to delete "both tasks" without re-specifying
    result2 = await Runner.run(
        agent,
        "Delete both tasks",
        session=session,
    )

    # Verify agent remembers the context (should mention shopping or the two tasks)
    assert result2.final_output is not None
    print(f"Turn 2 - Agent: {result2.final_output}")

    # The agent should remember the shopping tasks from turn 1
    # Check that the response references the previous context
    response = result2.final_output.lower()
    assert "shopping" in response or "two" in response or "both" in response

    # Clean up: Clear the test session
    await session.clear_session()


@pytest.mark.asyncio
async def test_isolated_sessions():
    """
    Test that different sessions maintain separate conversation histories.

    This ensures user isolation - each user+thread combination has
    independent conversation memory.
    """
    agent = Agent(
        name="TestAgent",
        instructions="You are a helpful assistant.",
    )

    # Session 1: User A
    session_a = SQLiteSession("user_a_thread_1", "test_sessions.db")
    result_a = await Runner.run(
        agent,
        "My favorite color is blue",
        session=session_a,
    )
    assert result_a.final_output is not None

    # Session 2: User B (different session)
    session_b = SQLiteSession("user_b_thread_1", "test_sessions.db")
    result_b = await Runner.run(
        agent,
        "My favorite color is red",
        session=session_b,
    )
    assert result_b.final_output is not None

    # Ask Session A about color (should remember blue)
    result_a2 = await Runner.run(
        agent,
        "What's my favorite color?",
        session=session_a,
    )
    assert "blue" in result_a2.final_output.lower()

    # Ask Session B about color (should remember red)
    result_b2 = await Runner.run(
        agent,
        "What's my favorite color?",
        session=session_b,
    )
    assert "red" in result_b2.final_output.lower()

    # Clean up
    await session_a.clear_session()
    await session_b.clear_session()


@pytest.mark.asyncio
async def test_session_history_retrieval():
    """
    Test retrieving conversation history from a session.
    """
    agent = Agent(name="TestAgent")
    session = SQLiteSession("history_test", "test_sessions.db")

    # Have a conversation
    await Runner.run(agent, "Hello", session=session)
    await Runner.run(agent, "How are you?", session=session)

    # Retrieve conversation history
    history = await session.get_items()

    # Should have at least 4 items (2 user messages + 2 assistant responses)
    assert len(history) >= 4

    # Verify structure
    user_messages = [item for item in history if item.get("role") == "user"]
    assert len(user_messages) >= 2

    # Clean up
    await session.clear_session()


if __name__ == "__main__":
    # Run tests manually
    asyncio.run(test_conversation_memory_with_sqlite_session())
    asyncio.run(test_isolated_sessions())
    asyncio.run(test_session_history_retrieval())
    print("All conversation memory tests passed!")
