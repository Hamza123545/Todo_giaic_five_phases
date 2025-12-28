"""
Test suite for chat endpoint error handling (Phase III - T040).

This module tests the retry logic, error handling, and user-friendly
error messages for the chat endpoint.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from openai import (
    RateLimitError,
    APIConnectionError,
    APITimeoutError,
    InternalServerError,
    APIError,
)

from routers.chat import run_agent_with_retry


@pytest.mark.asyncio
async def test_run_agent_with_retry_success():
    """Test successful agent run on first attempt."""
    # Mock agent and result
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]
    mock_result = AsyncMock()

    with patch("routers.chat.Runner.run_streamed", return_value=mock_result) as mock_run:
        result = await run_agent_with_retry(mock_agent, mock_messages)

        assert result == mock_result
        mock_run.assert_called_once_with(mock_agent, mock_messages)


@pytest.mark.asyncio
async def test_run_agent_with_retry_rate_limit_then_success():
    """Test retry on rate limit error, then success."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]
    mock_result = AsyncMock()

    # First call raises RateLimitError, second succeeds
    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = [
            RateLimitError(message="Rate limit exceeded", response=MagicMock(), body={}),
            mock_result,
        ]

        with patch("asyncio.sleep") as mock_sleep:
            result = await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            assert result == mock_result
            assert mock_run.call_count == 2
            mock_sleep.assert_called_once()  # Should sleep before retry


@pytest.mark.asyncio
async def test_run_agent_with_retry_rate_limit_exhausted():
    """Test rate limit error after all retries exhausted."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        # Always raise RateLimitError
        mock_run.side_effect = RateLimitError(
            message="Rate limit exceeded", response=MagicMock(), body={}
        )

        with patch("asyncio.sleep"):
            with pytest.raises(HTTPException) as exc_info:
                await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            # Verify user-friendly error
            assert exc_info.value.status_code == 503
            assert "RATE_LIMIT_EXCEEDED" in str(exc_info.value.detail)
            assert "high demand" in exc_info.value.detail["error"]["message"]


@pytest.mark.asyncio
async def test_run_agent_with_retry_network_error_then_success():
    """Test retry on network error, then success."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]
    mock_result = AsyncMock()

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = [
            APIConnectionError(message="Connection failed"),
            mock_result,
        ]

        with patch("asyncio.sleep") as mock_sleep:
            result = await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            assert result == mock_result
            assert mock_run.call_count == 2
            mock_sleep.assert_called_once()


@pytest.mark.asyncio
async def test_run_agent_with_retry_network_error_exhausted():
    """Test network error after all retries exhausted."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = APIConnectionError(message="Connection failed")

        with patch("asyncio.sleep"):
            with pytest.raises(HTTPException) as exc_info:
                await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            # Verify user-friendly error
            assert exc_info.value.status_code == 503
            assert "NETWORK_ERROR" in str(exc_info.value.detail)
            assert "internet connection" in exc_info.value.detail["error"]["message"]


@pytest.mark.asyncio
async def test_run_agent_with_retry_timeout_error():
    """Test timeout error handling."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = APITimeoutError(message="Request timeout")

        with patch("asyncio.sleep"):
            with pytest.raises(HTTPException) as exc_info:
                await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            # Verify user-friendly error
            assert exc_info.value.status_code == 503
            assert "NETWORK_ERROR" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_run_agent_with_retry_server_error():
    """Test API internal server error handling."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = InternalServerError(
            message="Internal server error", response=MagicMock(), body={}
        )

        with patch("asyncio.sleep"):
            with pytest.raises(HTTPException) as exc_info:
                await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            # Verify user-friendly error
            assert exc_info.value.status_code == 503
            assert "AI_SERVICE_UNAVAILABLE" in str(exc_info.value.detail)
            assert "temporarily unavailable" in exc_info.value.detail["error"]["message"]


@pytest.mark.asyncio
async def test_run_agent_with_retry_api_error():
    """Test generic API error (invalid key, etc.)."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = APIError(
            message="Invalid API key", request=MagicMock(), body={}
        )

        with pytest.raises(HTTPException) as exc_info:
            await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

        # Verify user-friendly error (no retry for API errors)
        assert exc_info.value.status_code == 500
        assert "AI_SERVICE_ERROR" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_run_agent_with_retry_value_error():
    """Test configuration error (missing API keys)."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = ValueError("OPENAI_API_KEY environment variable not set")

        with pytest.raises(HTTPException) as exc_info:
            await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

        # Verify user-friendly error
        assert exc_info.value.status_code == 500
        assert "CONFIGURATION_ERROR" in str(exc_info.value.detail)
        assert "not properly configured" in exc_info.value.detail["error"]["message"]


@pytest.mark.asyncio
async def test_run_agent_with_retry_unexpected_error():
    """Test unexpected error handling."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        mock_run.side_effect = RuntimeError("Unexpected error")

        with pytest.raises(HTTPException) as exc_info:
            await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

        # Verify user-friendly error
        assert exc_info.value.status_code == 500
        assert "INTERNAL_ERROR" in str(exc_info.value.detail)
        assert "unexpected error" in exc_info.value.detail["error"]["message"].lower()


@pytest.mark.asyncio
async def test_exponential_backoff():
    """Test exponential backoff retry delay calculation."""
    mock_agent = MagicMock()
    mock_messages = [{"role": "user", "content": "Test message"}]

    with patch("routers.chat.Runner.run_streamed") as mock_run:
        # Raise error 3 times
        mock_run.side_effect = [
            RateLimitError(message="Rate limit", response=MagicMock(), body={}),
            RateLimitError(message="Rate limit", response=MagicMock(), body={}),
            RateLimitError(message="Rate limit", response=MagicMock(), body={}),
        ]

        sleep_delays = []

        async def mock_sleep(delay):
            sleep_delays.append(delay)

        with patch("asyncio.sleep", side_effect=mock_sleep):
            with pytest.raises(HTTPException):
                await run_agent_with_retry(mock_agent, mock_messages, max_retries=3)

            # Verify exponential backoff: 1s, 2s (delays for first 2 retries)
            assert len(sleep_delays) == 2
            assert sleep_delays[0] == 1.0  # First retry: 1 * 2^0 = 1
            assert sleep_delays[1] == 2.0  # Second retry: 1 * 2^1 = 2
