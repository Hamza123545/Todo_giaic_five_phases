"""
Tests for chat history and conversation persistence.

This module tests:
- Conversation creation and management
- Message persistence and retrieval
- User isolation for conversations and messages
- Cleanup functionality
"""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from models import Conversation, Message


class TestConversationManagement:
    """Test conversation management endpoints."""

    def test_get_user_conversations_empty(self, client: TestClient, auth_user_factory):
        """Test retrieving empty conversation list."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.get(
            f"/api/{user_id}/conversations",
            headers=auth_data["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "conversations" in data["data"]

    def test_get_conversations_with_pagination(self, client: TestClient, auth_user_factory):
        """Test conversation pagination."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.get(
            f"/api/{user_id}/conversations?limit=10&offset=0",
            headers=auth_data["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]["conversations"]) <= 10

    def test_user_isolation_conversations(self, client: TestClient, auth_user_factory):
        """Test that users cannot access other users' conversations."""
        auth_data1 = auth_user_factory()
        auth_data2 = auth_user_factory()
        user_id2 = str(auth_data2["user"].id)

        # User 1 tries to access User 2's conversations
        response = client.get(
            f"/api/{user_id2}/conversations",
            headers=auth_data1["headers"],
        )

        assert response.status_code == 403

    def test_missing_auth_header(self, client: TestClient, auth_user_factory):
        """Test that endpoints require authentication."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.get(f"/api/{user_id}/conversations")

        assert response.status_code == 401


class TestMessageRetrieval:
    """Test message retrieval from conversations."""

    def test_get_nonexistent_conversation_messages(
        self, client: TestClient, auth_user_factory
    ):
        """Test retrieving messages from a nonexistent conversation."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.get(
            f"/api/{user_id}/conversations/99999/messages",
            headers=auth_data["headers"],
        )

        assert response.status_code == 404

    def test_user_isolation_messages(
        self, client: TestClient, auth_user_factory, session: Session
    ):
        """Test that users cannot access other users' messages."""
        auth_data1 = auth_user_factory()
        auth_data2 = auth_user_factory()

        # Create a conversation for user 2
        conversation = Conversation(
            user_id=str(auth_data2["user"].id),
            title="User 2's Private Conversation",
            is_active=True,
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

        # User 1 tries to access User 2's conversation messages
        response = client.get(
            f"/api/{str(auth_data1['user'].id)}/conversations/{conversation.id}/messages",
            headers=auth_data1["headers"],
        )

        assert response.status_code == 403


class TestCleanupEndpoint:
    """Test message cleanup functionality."""

    def test_trigger_cleanup(self, client: TestClient):
        """Test cleanup endpoint is accessible."""
        response = client.post("/api/admin/cleanup/messages")

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "deleted_count" in data["data"]
        assert "timestamp" in data["data"]

    def test_cleanup_returns_statistics(self, client: TestClient):
        """Test cleanup endpoint returns proper statistics."""
        response = client.post("/api/admin/cleanup/messages")

        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"]["deleted_count"], int)
        assert data["data"]["deleted_count"] >= 0
        assert "timestamp" in data["data"]


class TestErrorHandling:
    """Test error handling in chat history operations."""

    def test_invalid_conversation_id(self, client: TestClient, auth_user_factory):
        """Test with invalid conversation ID format."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.get(
            f"/api/{user_id}/conversations/invalid/messages",
            headers=auth_data["headers"],
        )

        # Should return 422 (validation error) or 404
        assert response.status_code in [404, 422]

    def test_chat_without_message(self, client: TestClient, auth_user_factory):
        """Test chat endpoint with empty message."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.post(
            f"/api/{user_id}/chat",
            headers=auth_data["headers"],
            json={
                "conversation_id": None,
                "message": "",  # Empty message
            },
        )

        assert response.status_code == 400

    def test_chat_with_only_whitespace(self, client: TestClient, auth_user_factory):
        """Test chat endpoint with whitespace-only message."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.post(
            f"/api/{user_id}/chat",
            headers=auth_data["headers"],
            json={
                "conversation_id": None,
                "message": "   \n  \t  ",  # Whitespace only
            },
        )

        assert response.status_code == 400


class TestAPIResponseFormats:
    """Test API response formats and structures."""

    def test_conversations_response_structure(self, client: TestClient, auth_user_factory):
        """Test conversations response has correct structure."""
        auth_data = auth_user_factory()
        user_id = str(auth_data["user"].id)

        response = client.get(
            f"/api/{user_id}/conversations",
            headers=auth_data["headers"],
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "success" in data
        assert "data" in data
        assert isinstance(data["success"], bool)
        assert isinstance(data["data"], dict)
        assert "conversations" in data["data"]
        assert isinstance(data["data"]["conversations"], list)

    def test_cleanup_response_structure(self, client: TestClient):
        """Test cleanup response has correct structure."""
        response = client.post("/api/admin/cleanup/messages")

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "success" in data
        assert "data" in data
        assert isinstance(data["success"], bool)
        assert isinstance(data["data"], dict)
        assert "deleted_count" in data["data"]
        assert "timestamp" in data["data"]
