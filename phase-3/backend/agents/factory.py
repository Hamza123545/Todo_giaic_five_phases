"""
Model factory for AI agent provider abstraction.

This module provides the create_model() function for centralizing
AI provider configuration and supporting multiple LLM backends.
"""

import os
from typing import Any

from openai import AsyncOpenAI
from agents import set_default_openai_client
from agents.extensions.models.litellm_model import LitellmModel


def configure_openai_client() -> AsyncOpenAI:
    """
    Configure AsyncOpenAI client for OpenAI models.

    Returns:
        AsyncOpenAI: Configured async OpenAI client

    Raises:
        ValueError: If OPENAI_API_KEY environment variable not set
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    # Set default client for the agents SDK
    client = AsyncOpenAI(api_key=api_key)
    set_default_openai_client(client, use_for_tracing=True)
    return client


def create_model(provider: str | None = None, model: str | None = None) -> Any:
    """
    Create agent model with configured provider based on environment.

    Args:
        provider: Override LLM_PROVIDER env var ("openai" | "gemini")
        model: Override model name

    Returns:
        Model configuration for Agent (string for OpenAI, LitellmModel for Gemini)

    Raises:
        ValueError: If provider not supported or API key missing

    Example:
        >>> # OpenAI usage
        >>> model = create_model()  # Uses LLM_PROVIDER from env
        >>> agent = Agent(name="MyAgent", model=model, tools=[...])

        >>> # Gemini usage
        >>> model = create_model(provider="gemini")
        >>> agent = Agent(name="MyAgent", model=model, tools=[...])
    """
    provider = provider or os.getenv("LLM_PROVIDER", "openai")

    if provider == "openai":
        # Configure default client
        configure_openai_client()
        # Return model string (uses default client)
        return model or os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o")

    elif provider == "gemini":
        # Use LiteLLM for Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")

        model_name = model or os.getenv("GEMINI_DEFAULT_MODEL", "gemini-1.5-flash")
        return LitellmModel(
            model=f"gemini/{model_name}",
            api_key=api_key
        )

    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
