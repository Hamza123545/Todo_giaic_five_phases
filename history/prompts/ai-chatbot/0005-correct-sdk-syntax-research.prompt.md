---
id: 0005
title: Correct SDK Syntax Research Update
stage: misc
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: ai-chatbot
branch: 004-ai-chatbot
user: system
command: /sp.clarify
labels: [research-correction, sdk-syntax, openai-agents, mcp, chatkit, context7]
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

```python
from openai_agents import Agent, Runner, function_tool
from openai import OpenAI the open ai agent sdk syntax is wrong use context7 mcp server and use the correct syntax for the all the work like open ai agent sdk mcp sdk and chatkit
```

## Response snapshot

Corrected SDK syntax in research.md using official documentation from Context7 MCP server. Updated all three technology implementations with accurate syntax:

**Corrections Made:**

**1. OpenAI Agents SDK (Section 1)**
- **Wrong**: `from openai_agents import Agent, Runner, function_tool`
- **Correct**: `from agents import Agent, Runner, function_tool`
- **Wrong**: Creating separate OpenAI client and passing to Runner
- **Correct**: Agent configured directly with model string, Runner.run() is a class method
- **Wrong**: `Runner.run_streamed()` method documented
- **Correct**: Runner.run() returns full result, no native streaming chunks - added note about implementing custom streaming

**2. Streaming Architecture (Section 3)**
- **Updated**: Changed import from `openai_agents` to `agents`
- **Updated**: Removed client initialization, Runner.run() called directly
- **Added**: Note that Runner.run() doesn't provide native token-by-token streaming
- **Added**: SQLModel AsyncSession import for type clarity

**3. ChatKit Frontend Integration (Section 6)**
- **Wrong**: Using `<ChatKitProvider>` and `<ChatKit>` React components with JSX props
- **Correct**: Creating `<openai-chatkit>` custom element programmatically
- **Wrong**: Passing props via JSX (`customFetch`, `theme`, etc.)
- **Correct**: Using `chatkit.setOptions()` method to configure
- **Added**: `domainKey` requirement for custom backend mode
- **Added**: Proper useEffect pattern for React integration
- **Added**: Element creation and ref management

**Context7 Documentation Sources Used:**
1. `/openai/openai-agents-python` - For Agent, Runner, function_tool syntax
2. `/modelcontextprotocol/python-sdk` - For MCP server implementation patterns
3. `/websites/openai_github_io_chatkit-js` - For ChatKit custom element API

**Key Findings:**
- OpenAI Agents SDK uses `agents` package, not `openai_agents`
- Runner.run() is class method, no separate client instantiation needed
- ChatKit uses Web Components API, not React components
- setOptions() is the correct configuration method for ChatKit
- domainKey is required when using custom backend mode

**Status**: Research document now contains accurate, implementation-ready code examples verified against official documentation.

## Outcome

- ✅ Impact: Corrected all SDK syntax errors in research document using Context7 MCP server to fetch official documentation. Implementation patterns now match current SDK APIs.
- 🧪 Tests: No automated tests (documentation update). Syntax verified against official Context7 documentation sources.
- 📁 Files: 1 file updated (research.md: 550 lines with corrected syntax in 3 sections)
- 🔁 Next prompts: Begin implementation using corrected syntax patterns from research.md
- 🧠 Reflection: Context7 MCP server proved essential for getting accurate, up-to-date SDK syntax. Initial research contained multiple errors from outdated or incorrect assumptions. Key corrections: package name (agents not openai_agents), Runner.run() class method pattern, ChatKit Web Components API, and lack of native streaming in Agents SDK.

## Evaluation notes (flywheel)

- Failure modes observed: Initial research document contained incorrect syntax from internal knowledge/assumptions rather than verified documentation
- Graders run and results (PASS/FAIL): Context7 verification - PASS (all 3 SDKs verified against official docs)
- Prompt variant (if applicable): User-initiated syntax correction via /sp.clarify
- Next experiment (smallest change to try): Always use Context7 MCP server FIRST before writing implementation patterns to avoid syntax errors

