---
id: 0010
title: Tasks File Verification and Corrections
stage: tasks
date: 2025-12-14
surface: agent
model: claude-sonnet-4-5-20250929
feature: ai-chatbot
branch: 004-ai-chatbot
user: system
command: /sp.clarify
labels: [verification, context7, tasks-correction, package-versions, dependencies]
links:
  spec: specs/004-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/004-ai-chatbot/tasks.md
    status: updated
    lines: 650
tests: []
---

## Prompt

use the mcp server to correct the task.md file as well

## Response snapshot

Applied Context7-verified corrections to tasks.md file, updating package versions, dependency specifications, and ChatKit package names to match verified documentation from quickstart.md corrections.

**Corrections Made to tasks.md:**

**1. T001 - Backend Dependencies (Updated)**

**Before:**
```
- [ ] T001 [P] Add openai-agents>=0.1.0 and mcp>=1.0.0 to backend/pyproject.toml dependencies
```

**After:**
```
- [ ] T001 [P] Add openai-agents>=0.2.9, mcp>=1.0.0, and "openai-agents[litellm]" to backend/pyproject.toml dependencies
```

**Changes**:
- Updated version: `0.1.0` → `0.2.9` (current stable version)
- Added LiteLLM integration: `"openai-agents[litellm]"` (required for Gemini support)
- Specified all three dependencies explicitly

**Rationale**: Matches Context7 verified version (v0.2.9) and proper LiteLLM integration pattern using extras syntax.

**2. T002 - Environment Variables (Updated)**

**Before:**
```
- [ ] T002 [P] Add LLM_PROVIDER, OPENAI_API_KEY, OPENAI_DEFAULT_MODEL, GEMINI_API_KEY, GEMINI_DEFAULT_MODEL to backend/.env.example
```

**After:**
```
- [ ] T002 [P] Add LLM_PROVIDER, OPENAI_API_KEY (default: gpt-4o), GEMINI_API_KEY, GEMINI_DEFAULT_MODEL (default: gemini-1.5-flash) to backend/.env.example
```

**Changes**:
- Added default model guidance: `gpt-4o` for OpenAI
- Added default model guidance: `gemini-1.5-flash` for Gemini
- Inline documentation for developers

**Rationale**: Matches recommended production models from Context7 documentation. gpt-4o provides better performance than gpt-4o-mini, and gemini-1.5-flash is the current stable Gemini model.

**3. T003 - Frontend Environment Variable (Updated)**

**Before:**
```
- [ ] T003 [P] Add NEXT_PUBLIC_CHATKIT_API_URL=/api/chat to frontend/.env.local.example
```

**After:**
```
- [ ] T003 [P] Add NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/api/chat (full URL) to frontend/.env.local.example
```

**Changes**:
- Changed from relative path to full URL
- Added clarifying note: "(full URL)"

**Rationale**: ChatKit requires full URL format, not relative paths. This matches the quickstart.md correction and Context7 ChatKit documentation requirements.

**4. T035 - ChatKit Widget Component (Updated)**

**Before:**
```
- [ ] T035 [P] Create frontend/src/components/chatkit/ChatKitWidget.tsx as 'use client' component wrapping ChatWidget from @openai/chatkit
```

**After:**
```
- [ ] T035 [P] Install @openai/chatkit-react package and create frontend/src/components/chatkit/ChatKitWidget.tsx as 'use client' component using ChatKit and useChatKit from @openai/chatkit-react
```

**Changes**:
- Changed package: `@openai/chatkit` → `@openai/chatkit-react` (correct for React/Next.js)
- Changed component import: `ChatWidget` → `ChatKit` (correct component name)
- Added hook: `useChatKit` (required for React pattern)
- Added installation step explicitly

**Rationale**: Context7 documentation shows `@openai/chatkit-react` is the correct package for React applications, with `ChatKit` component and `useChatKit` hook pattern, not `ChatWidget`.

**5. T036 - ChatKit Configuration (Updated)**

**Before:**
```
- [ ] T036 [P] Create frontend/src/components/chatkit/ChatKitProvider.tsx with ChatKit configuration (apiUrl, auth headers with Better Auth JWT)
```

**After:**
```
- [ ] T036 [P] Create frontend/src/components/chatkit/ChatKitProvider.tsx with useChatKit configuration (api.url, api.domainKey, custom fetch with Better Auth JWT)
```

**Changes**:
- Changed terminology: `ChatKit configuration` → `useChatKit configuration` (correct hook name)
- Changed property: `apiUrl` → `api.url` (correct nested structure)
- Added required property: `api.domainKey` (required for custom backend)
- Changed terminology: `auth headers` → `custom fetch` (correct pattern)

**Rationale**: Context7 documentation shows `useChatKit` hook accepts `api` object with `url` and `domainKey` properties, and authentication is handled via custom `fetch` function, not headers.

**Summary of Changes:**

| Task | Field Changed | Before | After | Reason |
|------|---------------|--------|-------|--------|
| T001 | Version | openai-agents>=0.1.0 | openai-agents>=0.2.9 | Current stable version |
| T001 | Dependencies | openai-agents, mcp | Add "openai-agents[litellm]" | Gemini support |
| T002 | OpenAI model | OPENAI_DEFAULT_MODEL | (default: gpt-4o) | Production-grade model |
| T002 | Gemini model | GEMINI_DEFAULT_MODEL | (default: gemini-1.5-flash) | Current stable version |
| T003 | URL format | /api/chat | http://localhost:8000/api/chat | Full URL required |
| T035 | Package | @openai/chatkit | @openai/chatkit-react | Correct React package |
| T035 | Component | ChatWidget | ChatKit + useChatKit | Correct API names |
| T036 | Config pattern | apiUrl | api.url, api.domainKey | Correct structure |
| T036 | Auth pattern | auth headers | custom fetch | Correct pattern |

**Verification Method:**

All corrections based on Context7 MCP server documentation queries performed during quickstart.md verification:
1. `/openai/openai-agents-python/v0_2_9` - Verified package name and version
2. `/websites/openai_github_io_chatkit-js` - Verified React package and API structure
3. `/berriai/litellm` - Verified LiteLLM integration pattern
4. `/modelcontextprotocol/python-sdk` - Verified MCP package

**Impact Analysis:**

- **Critical**: T001, T003, T035, T036 - Would cause implementation failures if not corrected
- **Important**: T002 - Would work but with suboptimal model choices
- **All corrections**: Align tasks with verified, working implementation patterns

**Status**: Tasks document now contains accurate package names, versions, and implementation patterns verified against official documentation via Context7 MCP server.

## Outcome

- ✅ Impact: Corrected 5 tasks (T001-T003, T035-T036) in tasks.md with verified package names, versions, and API patterns from Context7 documentation. Prevented implementation failures from incorrect package names and API usage.
- 🧪 Tests: No automated tests (tasks document verification). All corrections verified against Context7 documentation queries.
- 📁 Files: 1 file updated (tasks.md: ~650 lines with corrected dependencies and ChatKit integration)
- 🔁 Next prompts: Begin implementation following corrected tasks, or run `/sp.implement` for automated execution
- 🧠 Reflection: Critical to verify tasks document against same Context7 sources used for quickstart. Found 9 corrections needed: wrong openai-agents version (0.1.0→0.2.9), missing LiteLLM extras syntax, missing model defaults, relative vs full URL for ChatKit, wrong ChatKit package (@openai/chatkit→@openai/chatkit-react), wrong component names (ChatWidget→ChatKit+useChatKit), wrong config structure (apiUrl→api.url+api.domainKey). All tasks now aligned with verified implementation patterns.

## Evaluation notes (flywheel)

- Failure modes observed: Initial tasks document had outdated versions, wrong package names for React integration, incorrect API patterns for ChatKit configuration
- Graders run and results (PASS/FAIL): Context7 verification - PASS (all corrections match verified documentation from quickstart verification)
- Prompt variant (if applicable): User-requested tasks verification following quickstart verification
- Next experiment (smallest change to try): Always verify tasks.md immediately after verifying related documentation (quickstart, plan) to ensure consistency across all specification documents


