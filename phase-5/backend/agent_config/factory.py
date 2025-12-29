"""
Model factory for AI agent provider abstraction.

This module provides the create_model() function for centralizing
AI provider configuration and supporting multiple LLM backends.

Supports:
- OpenAI (default)
- Gemini via OpenAI-compatible API
- Groq via OpenAI-compatible API
- OpenRouter via OpenAI-compatible API

Environment variables:
- LLM_PROVIDER: "openai", "gemini", "groq", or "openrouter" (default: "openai")
- OPENAI_API_KEY: OpenAI API key
- GEMINI_API_KEY: Gemini API key
- GROQ_API_KEY: Groq API key
- OPENROUTER_API_KEY: OpenRouter API key
- OPENAI_DEFAULT_MODEL: Model name for OpenAI (default: "gpt-4o-mini")
- GEMINI_DEFAULT_MODEL: Model name for Gemini (default: "gemini-2.5-flash")
- GROQ_DEFAULT_MODEL: Model name for Groq (default: "llama-3.3-70b-versatile")
- OPENROUTER_DEFAULT_MODEL: Model name for OpenRouter (default: "openai/gpt-4o-mini")
"""

import os
from pathlib import Path

from dotenv import load_dotenv
from agents import OpenAIChatCompletionsModel
from openai import AsyncOpenAI

# Disable OpenAI telemetry/tracing for faster responses
# This prevents the SDK from trying to send traces to api.openai.com
os.environ.setdefault("OTEL_SDK_DISABLED", "true")
os.environ.setdefault("OTEL_TRACES_EXPORTER", "none")
os.environ.setdefault("OTEL_METRICS_EXPORTER", "none")

# Load environment variables from .env file
# This ensures the .env file is loaded even if imported before main.py
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)  # override=True ensures .env takes precedence
else:
    # Fallback: try to load from current directory
    load_dotenv(override=True)


def create_model(provider: str | None = None, model: str | None = None) -> OpenAIChatCompletionsModel:
    """
    Create an LLM model instance based on environment configuration.

    Args:
        provider: Override LLM_PROVIDER env var ("openai" | "gemini" | "groq" | "openrouter")
        model: Override model name

    Returns:
        OpenAIChatCompletionsModel configured for the selected provider

    Raises:
        ValueError: If provider is unsupported or API key is missing

    Example:
        >>> # OpenAI usage
        >>> model = create_model()  # Uses LLM_PROVIDER from env
        >>> agent = Agent(name="MyAgent", model=model, tools=[...])

        >>> # Gemini usage
        >>> model = create_model(provider="gemini")
        >>> agent = Agent(name="MyAgent", model=model, tools=[...])

        >>> # Groq usage
        >>> model = create_model(provider="groq")
        >>> agent = Agent(name="MyAgent", model=model, tools=[...])

        >>> # OpenRouter usage
        >>> model = create_model(provider="openrouter")
        >>> agent = Agent(name="MyAgent", model=model, tools=[...])
    """
    provider = provider or os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "gemini":
        # Try loading from .env again to ensure we have the latest
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            load_dotenv(env_path, override=True)
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is required when LLM_PROVIDER=gemini"
            )
        
        # Debug: Verify API key is loaded (first 15 chars to verify it matches)
        if api_key:
            api_key_preview = api_key[:15] + "..." if len(api_key) > 15 else api_key
            print(f"[DEBUG] Gemini API key loaded: {api_key_preview} (length: {len(api_key)})")
            print(f"[DEBUG] Expected key should start with: AIzaSyBt41")

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )

        model_name = model or os.getenv("GEMINI_DEFAULT_MODEL", "gemini-2.5-flash")

        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    elif provider == "groq":
        # Try loading from .env again to ensure we have the latest
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            load_dotenv(env_path, override=True)

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY environment variable is required when LLM_PROVIDER=groq"
            )

        # Debug: Verify API key is loaded
        if api_key:
            api_key_preview = api_key[:15] + "..." if len(api_key) > 15 else api_key
            print(f"[DEBUG] Groq API key loaded: {api_key_preview} (length: {len(api_key)})")

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )

        model_name = model or os.getenv("GROQ_DEFAULT_MODEL", "llama-3.3-70b-versatile")

        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    elif provider == "openrouter":
        # Try loading from .env again to ensure we have the latest
        env_path = Path(__file__).parent.parent / ".env"
        if env_path.exists():
            load_dotenv(env_path, override=True)

        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is required when LLM_PROVIDER=openrouter"
            )

        # Debug: Verify API key is loaded
        if api_key:
            api_key_preview = api_key[:15] + "..." if len(api_key) > 15 else api_key
            print(f"[DEBUG] OpenRouter API key loaded: {api_key_preview} (length: {len(api_key)})")

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )

        model_name = model or os.getenv("OPENROUTER_DEFAULT_MODEL", "openai/gpt-4o-mini")

        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is required when LLM_PROVIDER=openai"
            )

        client = AsyncOpenAI(api_key=api_key)
        model_name = model or os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o-mini")

        return OpenAIChatCompletionsModel(model=model_name, openai_client=client)

    else:
        raise ValueError(
            f"Unsupported LLM provider: {provider}. "
            f"Supported providers: openai, gemini, groq, openrouter"
        )
