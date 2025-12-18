# OpenRouter Integration Guide

This document describes how OpenRouter has been integrated into the Phase 3 backend to provide access to multiple LLM models through a unified API.

## What is OpenRouter?

OpenRouter is a unified API platform that provides access to hundreds of AI models across multiple providers through a single endpoint. It simplifies LLM integration by offering:

- **Single API endpoint** for multiple models
- **Automatic fallbacks** and cost optimization
- **Standardized OpenAI-compatible interface**
- **Free tier models** available (like `openai/gpt-oss-20b:free`)

## Implementation Details

### Architecture

The OpenRouter integration uses the **OpenAI-compatible API** approach:

```python
# AsyncOpenAI client configured for OpenRouter
client = AsyncOpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",  # OpenRouter endpoint
)

# Works seamlessly with OpenAI Agents SDK
model = OpenAIChatCompletionsModel(
    model="openai/gpt-oss-20b:free",  # OpenRouter model name
    openai_client=client
)
```

### Files Modified

1. **`agent_config/factory.py`**
   - Added `openrouter` provider support
   - Configured AsyncOpenAI client with OpenRouter base URL
   - Added environment variable handling for `OPENROUTER_API_KEY`
   - Set default model to `openai/gpt-oss-20b:free`

2. **`agent_config/todo_agent.py`**
   - Updated docstrings to include OpenRouter examples
   - Added OpenRouter to supported provider list

3. **`.env`**
   - Set `LLM_PROVIDER=openrouter`
   - Added `OPENROUTER_API_KEY` (requires user's actual API key)
   - Set `OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free`

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# LLM Provider Selection
LLM_PROVIDER=openrouter

# OpenRouter Configuration
OPENROUTER_API_KEY=sk-or-v1-YOUR_API_KEY_HERE
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free
```

### Getting an OpenRouter API Key

1. Visit [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env` file

### Available Models

OpenRouter provides access to hundreds of models. Popular free options:

- `openai/gpt-oss-20b:free` - Free GPT-based model (20B parameters)
- `meta-llama/llama-3.2-3b-instruct:free` - Llama 3.2 3B
- `google/gemma-2-9b-it:free` - Google Gemma 2 9B
- `mistralai/mistral-7b-instruct:free` - Mistral 7B

For paid models, see: [https://openrouter.ai/models](https://openrouter.ai/models)

## Usage

### Using OpenRouter (Default)

The system is now configured to use OpenRouter by default:

```python
# Automatically uses OpenRouter with openai/gpt-oss-20b:free
agent = create_todo_agent()
```

### Switching Providers

You can switch between providers easily:

```python
# OpenRouter
agent = create_todo_agent(provider="openrouter", model="openai/gpt-oss-20b:free")

# Gemini
agent = create_todo_agent(provider="gemini", model="gemini-2.5-flash")

# Groq
agent = create_todo_agent(provider="groq", model="llama-3.3-70b-versatile")

# OpenAI
agent = create_todo_agent(provider="openai", model="gpt-4o")
```

### Changing Model via Environment

Update `.env` to switch models without code changes:

```env
# Use a different OpenRouter model
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

## Benefits

1. **Cost Optimization**
   - Access to free models like `openai/gpt-oss-20b:free`
   - No OpenAI API costs during development
   - Easy switching between paid/free tiers

2. **Unified Interface**
   - Single API for multiple model providers
   - OpenAI-compatible, works with existing code
   - Seamless integration with OpenAI Agents SDK

3. **Flexibility**
   - Switch models with single environment variable change
   - Test different models without code modifications
   - Automatic fallbacks if primary model unavailable

4. **Development Friendly**
   - Free tier for testing and development
   - No credit card required for basic usage
   - Rate limits suitable for development

## Troubleshooting

### API Key Issues

If you see `OPENROUTER_API_KEY environment variable is required`:

1. Check `.env` file exists in `phase-3/backend/`
2. Verify `OPENROUTER_API_KEY=sk-or-v1-...` is set
3. Ensure no extra spaces around the `=` sign
4. Restart the server after changing `.env`

### Model Not Found

If you see model not found errors:

1. Check model name matches OpenRouter's format (e.g., `openai/gpt-oss-20b:free`)
2. Visit [https://openrouter.ai/models](https://openrouter.ai/models) for valid names
3. Verify the model is available on your account tier

### Rate Limiting

Free tier has rate limits:

- If you hit rate limits, wait a few seconds
- Consider upgrading to paid tier for higher limits
- Implement exponential backoff (already in `chat.py`)

## Testing

Test the integration:

```bash
# Start the backend
cd phase-3/backend
uv run uvicorn main:app --reload

# Send a chat request
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": null, "message": "Add a task to test OpenRouter"}'
```

Check logs for:
```
[DEBUG] OpenRouter API key loaded: sk-or-v1-0e6... (length: 64)
```

## Migration Path

### From Gemini to OpenRouter

Already done! Just update your API key:

```env
# Before
LLM_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyBt41...

# After
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
OPENROUTER_DEFAULT_MODEL=openai/gpt-oss-20b:free
```

### From OpenAI to OpenRouter

```env
# Before
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...

# After
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o  # Still use GPT-4o via OpenRouter
```

## References

- **OpenRouter Docs**: [https://openrouter.ai/docs](https://openrouter.ai/docs)
- **OpenAI SDK Integration**: [https://openrouter.ai/docs/guides/community/openai-sdk](https://openrouter.ai/docs/guides/community/openai-sdk)
- **Model List**: [https://openrouter.ai/models](https://openrouter.ai/models)
- **API Reference**: [https://openrouter.ai/docs/api](https://openrouter.ai/docs/api)

## Summary

The OpenRouter integration is complete and configured to use the free `openai/gpt-oss-20b:free` model. The only remaining step is to **add your actual OpenRouter API key** to the `.env` file.

All existing functionality continues to work unchanged - the agent automatically uses OpenRouter's unified API to access the configured model.
