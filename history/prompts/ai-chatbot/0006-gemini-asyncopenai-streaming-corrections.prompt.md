---
id: 0006
title: Gemini AsyncOpenAI Streaming Corrections
stage: misc
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: ai-chatbot
branch: 004-ai-chatbot
user: system
command: /sp.clarify
labels: [research-correction, gemini, asyncopenai, streaming, litellm, context7]
links:
  spec: specs/004-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/004-ai-chatbot/research.md
    status: updated
    lines: 550
tests: []
---

## Prompt

we will use the gemini model with open ai agent sdk use the context7 mcp server and check how to use it from the documentation probably we have  to add asyncopenai check the complete file read every syntax and use the correct syntax for all the work about mcp chatkit openai agent sdk or any other things if using

## Response snapshot

Updated research.md with correct Gemini integration, AsyncOpenAI usage, and streaming patterns verified from Context7 documentation. Fixed Model Factory Pattern and Streaming Architecture sections.

**Corrections Made:**

**1. Model Factory Pattern (Section 5) - Gemini Integration**

**Key Changes:**
- **Added AsyncOpenAI**: Required for async/await patterns in FastAPI
- **Added LiteLLM Integration**: Official way to use Gemini with OpenAI Agents SDK
- **Corrected Gemini syntax**: Use `LitellmModel` with "gemini/" prefix
- **Added client configuration**: Use `set_default_openai_client()` for OpenAI models
- **Separated provider logic**: Different patterns for OpenAI vs Gemini

**New Implementation:**
```python
from openai import AsyncOpenAI
from agents import set_default_openai_client
from agents.extensions.models.litellm_model import LitellmModel

# OpenAI: Configure AsyncOpenAI client
client = AsyncOpenAI(api_key=api_key)
set_default_openai_client(client, use_for_tracing=True)
model = "gpt-4o-2024-11-20"  # Return model string

# Gemini: Use LiteLLM wrapper
model = LitellmModel(
    model="gemini/gemini-2.0-flash",
    api_key=gemini_api_key
)

# Agent accepts either
agent = Agent(model=model, ...)  # Works with both patterns
```

**Why AsyncOpenAI is required:**
- FastAPI endpoints are async
- Agents SDK uses async/await internally
- `Runner.run()` and `Runner.run_streamed()` are async methods
- Database operations (SQLModel) are async
- Proper async client prevents blocking issues

**2. Streaming Architecture (Section 3) - Token-by-Token Streaming**

**Key Changes:**
- **Corrected streaming method**: Use `Runner.run_streamed()` (not `Runner.run()`)
- **Added event filtering**: Filter for `ResponseTextDeltaEvent` to get text chunks
- **Proper imports**: Import `ResponseTextDeltaEvent` from `openai.types.responses`
- **Event iteration pattern**: Use `result.stream_events()` async iterator

**New Implementation:**
```python
from openai.types.responses import ResponseTextDeltaEvent

# Use run_streamed() for token-by-token streaming
result = Runner.run_streamed(todo_agent, input=request.message)

assistant_message = ""
async for event in result.stream_events():
    # Filter for text delta events (token-by-token)
    if event.type == "raw_response_event":
        if isinstance(event.data, ResponseTextDeltaEvent):
            delta = event.data.delta or ""
            assistant_message += delta
            yield f"data: {json.dumps({'content': delta})}\n\n"
```

**Why this pattern is correct:**
- `Runner.run_streamed()` returns streaming result object
- `stream_events()` yields various event types during execution
- `raw_response_event` contains LLM response chunks
- `ResponseTextDeltaEvent` specifically contains text deltas
- Must accumulate chunks for database persistence (stateless requirement)

**3. Context7 Documentation Sources**

**Verified Against:**
1. `/openai/openai-agents-python` - Agent SDK patterns
   - LiteLLM integration example
   - AsyncOpenAI configuration
   - `set_default_openai_client()` usage
   - Streaming with `Runner.run_streamed()`
   - Event filtering for `ResponseTextDeltaEvent`

**Key Findings from Documentation:**

**AsyncOpenAI Configuration:**
- Required for async agent execution
- Configure with `set_default_openai_client(client, use_for_tracing=True)`
- `use_for_tracing=True` enables built-in debugging

**Gemini via LiteLLM:**
- Official integration pattern for non-OpenAI models
- Prefix model name with "gemini/" (e.g., "gemini/gemini-2.0-flash")
- Pass API key directly to `LitellmModel`
- Agent accepts `LitellmModel` instance as model parameter

**Streaming Pattern:**
- `Runner.run_streamed()` returns `StreamedResult`
- Call `stream_events()` to get async iterator
- Event types: `raw_response_event`, `run_item_stream_event`, `agent_updated_stream_event`
- For text: filter `raw_response_event` + `isinstance(event.data, ResponseTextDeltaEvent)`
- Delta available at `event.data.delta`

**Environment Variables Updated:**
```bash
LLM_PROVIDER=gemini  # or "openai"

# OpenAI (if LLM_PROVIDER=openai)
OPENAI_API_KEY=sk-...
OPENAI_DEFAULT_MODEL=gpt-4o-2024-11-20

# Gemini (if LLM_PROVIDER=gemini)
GEMINI_API_KEY=...
GEMINI_DEFAULT_MODEL=gemini-2.0-flash
```

**Implementation Impact:**
- Factory returns model string (OpenAI) or LitellmModel instance (Gemini)
- AsyncOpenAI client must be configured before creating agents
- Streaming now uses correct `run_streamed()` method with event filtering
- Token-by-token streaming properly accumulates for database persistence

**Status**: Research document now contains production-ready code patterns for both OpenAI and Gemini models with correct async and streaming implementations.

## Outcome

- ✅ Impact: Corrected Gemini integration pattern using LiteLLM, added AsyncOpenAI configuration, and fixed streaming implementation with proper event filtering. All patterns verified against official Context7 documentation.
- 🧪 Tests: No automated tests (documentation update). All syntax verified against `/openai/openai-agents-python` documentation via Context7.
- 📁 Files: 1 file updated (research.md: sections 3 and 5 corrected with proper async patterns)
- 🔁 Next prompts: Begin implementation using corrected patterns for Gemini, AsyncOpenAI, and streaming
- 🧠 Reflection: Critical corrections made - AsyncOpenAI is required for FastAPI async endpoints, LiteLLM is the official way to use Gemini with Agents SDK, and Runner.run_streamed() with event filtering is the correct streaming pattern. Previous version would have caused blocking issues and incorrect streaming behavior.

## Evaluation notes (flywheel)

- Failure modes observed: Initial research lacked AsyncOpenAI (would cause blocking), incorrect Gemini integration (missing LiteLLM), and wrong streaming pattern (used run() instead of run_streamed())
- Graders run and results (PASS/FAIL): Context7 verification - PASS (AsyncOpenAI, LiteLLM, streaming patterns all verified)
- Prompt variant (if applicable): User-requested Gemini integration verification
- Next experiment (smallest change to try): Always verify async patterns when working with FastAPI + async libraries

