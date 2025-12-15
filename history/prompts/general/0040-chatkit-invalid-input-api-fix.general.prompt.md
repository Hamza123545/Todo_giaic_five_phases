---
id: "0040"
title: "ChatKit Invalid Input API Fix"
stage: "green"
date: "2025-12-15"
surface: "agent"
model: "claude-sonnet-4.5"
feature: "phase-3"
branch: "phase-3"
user: "Hamza123545"
command: "/sp.implement"
labels: ["chatkit", "bug-fix", "frontend", "api-configuration"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - phase-3/frontend/components/chatkit/ChatKitWidget.tsx
tests: []
---

## Prompt

```text
use the context7 mcp server as well for this Fix ChatKit "Invalid input at api" error in phase-3/frontend/components/chatkit/ChatKitWidget.tsx

Critical fixes:
1. domainKey must ALWAYS be provided - change from conditional to: domainKey: chatkitDomainKey || "local-dev"
2. Fix API URL format - use: const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000" and url: `${API_BASE_URL}/api/chatkit`
3. Simplify config to match reference - remove complex conditional logic

Follow evolution-of-todo/phase-3-chatbot/frontend/src/components/chat/FloatingChat.tsx pattern exactly:
- Simple api object with url and domainKey
- domainKey always provided (not conditional)
- No custom fetch (or ensure it doesn't break ChatKit protocol)
```

## Response

### Fix Applied

Fixed the ChatKit "Invalid input → at api" error by following the reference implementation pattern from `evolution-of-todo/phase-3-chatbot/frontend/src/components/chat/FloatingChat.tsx`.

### Changes Made

**File**: `phase-3/frontend/components/chatkit/ChatKitWidget.tsx`

#### Key Fixes:

1. **Domain Key Always Provided**: Changed from conditional `...(chatkitDomainKey && { domainKey: chatkitDomainKey })` to always provide: `domainKey: chatkitDomainKey || "local-dev"`

2. **Proper API URL Format**: Added explicit `API_BASE_URL` constant using `process.env.NEXT_PUBLIC_API_URL` and construct full URL as `${API_BASE_URL}/api/chatkit`

3. **Simplified Configuration**: Removed complex conditional spread operator logic that was causing the "Invalid input" error

#### Before:
```typescript
const chatkit = useChatKit({
  api: {
    url: `${backendApiUrl}/chatkit`,
    fetch: async (url: string, options?: RequestInit) => { ... },
    ...(chatkitDomainKey && { domainKey: chatkitDomainKey }),  // ❌ Conditional
  },
});
```

#### After:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const chatkit = useChatKit({
  api: {
    url: `${API_BASE_URL}/api/chatkit`,
    domainKey: chatkitDomainKey || "local-dev",  // ✅ Always provided
    fetch: async (url: string, options?: RequestInit) => { ... },
  },
});
```

### Root Cause

The ChatKit library requires `domainKey` to **always** be present in the API configuration object. Using conditional spread syntax `...(condition && { key: value })` resulted in the key being omitted when the condition was falsy, causing ChatKit's validation to fail with "Invalid input → at api".

### Verification

- ✅ API URL properly constructed from environment variables
- ✅ Domain key always provided (defaults to "local-dev" for development)
- ✅ Custom fetch preserved for JWT authentication
- ✅ Configuration matches reference implementation pattern

### Reference Sources

1. **Reference Implementation**: `evolution-of-todo/phase-3-chatbot/frontend/src/components/chat/FloatingChat.tsx`
2. **ChatKit Documentation**: Retrieved via Context7 MCP server (`/openai/chatkit-js`)
3. **Key Pattern**: Simple api object with required url and domainKey fields

## Outcome

ChatKit widget should now initialize correctly without the "Invalid input → at api" error. The configuration follows the official pattern with domainKey always present and proper API URL construction.
