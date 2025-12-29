# ChatKit Integration

This directory contains the OpenAI ChatKit integration for Phase 3 AI chatbot functionality.

## Overview

The ChatKit integration provides a conversational interface for task management using natural language. It connects to a custom backend (not OpenAI hosted workflow) and uses Better Auth JWT tokens for authentication.

## Architecture

```
┌─────────────────┐
│  ChatKitWidget  │ (React Component)
└────────┬────────┘
         │
         │ JWT Token + User ID
         │
         ▼
┌─────────────────┐
│  Backend API    │ (/api/{user_id}/chat)
└────────┬────────┘
         │
         │ MCP Tools
         │
         ▼
┌─────────────────┐
│  MCP Server     │ (5 tools: add, list, complete, delete, update)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │ (Tasks, Conversations, Messages)
└─────────────────┘
```

## Components

### ChatKitWidget.tsx

Main component that renders the ChatKit interface.

**Features:**
- ✅ Better Auth session management
- ✅ JWT token authentication
- ✅ User-specific chat endpoint configuration
- ✅ Loading/error/auth state handling
- ✅ Custom fetch function with Authorization header
- ✅ Domain key support for production

**Props:**
```typescript
interface ChatKitWidgetProps {
  apiUrl?: string;      // Custom API URL (defaults to NEXT_PUBLIC_CHATKIT_API_URL)
  domainKey?: string;   // Domain key for production (defaults to NEXT_PUBLIC_OPENAI_DOMAIN_KEY)
  className?: string;   // CSS class name for styling
}
```

**Usage:**
```tsx
import { ChatKitWidget } from "@/components/chatkit";

export default function ChatPage() {
  return <ChatKitWidget className="h-[600px]" />;
}
```

## Environment Variables

### Required

```env
# Backend API base URL (chat endpoint will be appended with /{user_id}/chat)
NEXT_PUBLIC_CHATKIT_API_URL=http://localhost:8000/api/chat
```

### Optional (Production)

```env
# Domain key for production deployment (obtain from OpenAI ChatKit dashboard)
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
```

## CDN Script

**CRITICAL:** The ChatKit CDN script MUST be loaded in `app/layout.tsx`:

```tsx
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
```

**Why this is critical:**
- Without the CDN script, ChatKit widgets will render without proper styling
- This is the #1 cause of "blank widget" issues
- The script must be loaded before ChatKit components render

## Authentication Flow

1. **Component Mount:**
   - ChatKitWidget checks Better Auth session
   - If not authenticated → show "Please sign in" message
   - If authenticated → proceed to step 2

2. **Get JWT Token:**
   - Call `authClient.getToken()` to get JWT token
   - Token is used for backend API authentication
   - If token retrieval fails → show error message

3. **Configure ChatKit:**
   - Set `api.url` to `${NEXT_PUBLIC_CHATKIT_API_URL}/${user_id}/chat`
   - Add custom `fetch` function with JWT Authorization header
   - ChatKit is now ready for user interaction

4. **API Requests:**
   - User sends message through ChatKit UI
   - ChatKit calls custom `fetch` function
   - Request includes `Authorization: Bearer ${jwt_token}` header
   - Backend verifies JWT and processes request

## Backend API Contract

ChatKit expects the backend to implement the following endpoints:

### POST `/api/chat/{user_id}/chat`

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "Add task: Buy groceries",
  "conversation_id": "conv_123" // optional, for continuing conversations
}
```

**Response (Server-Sent Events):**
```
event: message
data: {"type": "text", "content": "I'll add that task for you."}

event: message
data: {"type": "tool_call", "tool": "add_task", "args": {"title": "Buy groceries"}}

event: message
data: {"type": "text", "content": "Task added successfully!"}

event: done
data: {"conversation_id": "conv_123"}
```

## Testing

### Local Development

1. **Start Backend:**
   ```bash
   cd phase-3/backend
   uv run uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd phase-3/frontend
   pnpm dev
   ```

3. **Visit Chat Page:**
   ```
   http://localhost:3000/chat
   ```

4. **Test Authentication:**
   - Visit `/login` and sign in
   - Navigate back to `/chat`
   - ChatKit widget should render
   - Try sending a message

### Debugging

**Widget not rendering:**
- ✅ Check CDN script is loaded in layout.tsx
- ✅ Check browser console for JavaScript errors
- ✅ Verify `@openai/chatkit-react` package is installed

**Authentication errors:**
- ✅ Check Better Auth session exists (try `/dashboard`)
- ✅ Verify JWT token is being generated (`authClient.getToken()`)
- ✅ Check `BETTER_AUTH_SECRET` matches between frontend and backend

**API connection errors:**
- ✅ Verify `NEXT_PUBLIC_CHATKIT_API_URL` is set correctly
- ✅ Check backend is running at the configured URL
- ✅ Check Network tab for API request/response details
- ✅ Verify CORS headers allow frontend domain

**Blank widget:**
- ✅ FIRST CHECK: Is CDN script loaded? (Most common issue)
- ✅ Check browser console for errors
- ✅ Verify container element has non-zero dimensions
- ✅ Check CSS conflicts (z-index, positioning)

## Production Deployment

### Required Steps

1. **Obtain Domain Key:**
   - Visit OpenAI ChatKit dashboard
   - Register your production domain
   - Get domain key for verification

2. **Set Environment Variables:**
   ```env
   NEXT_PUBLIC_CHATKIT_API_URL=https://api.yourdomain.com/api/chat
   NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your-domain-key-here
   ```

3. **Configure CORS:**
   - Backend must allow frontend domain
   - Include `Access-Control-Allow-Origin` header
   - Allow `Authorization` header in requests

4. **SSL/TLS:**
   - Both frontend and backend MUST use HTTPS
   - Mixed content (HTTP/HTTPS) will be blocked

## Known Issues and Solutions

### Issue: Widget appears blank or unstyled
**Solution:** Ensure CDN script is loaded in layout.tsx (see CDN Script section above)

### Issue: "Failed to get authentication token"
**Solution:**
- Check Better Auth is configured correctly
- Verify JWT plugin is enabled in Better Auth
- Check `BETTER_AUTH_SECRET` matches between frontend and backend

### Issue: API requests fail with 401 Unauthorized
**Solution:**
- Verify JWT token is being sent in Authorization header
- Check backend JWT verification middleware
- Ensure token is not expired

### Issue: CORS errors in browser console
**Solution:**
- Backend must include CORS middleware
- Allow frontend domain in `Access-Control-Allow-Origin`
- Allow `Authorization` header in `Access-Control-Allow-Headers`

## File Structure

```
components/chatkit/
├── ChatKitWidget.tsx    # Main ChatKit component
├── index.ts             # Barrel export
└── README.md            # This file

app/
├── layout.tsx           # CDN script loaded here
└── chat/
    └── page.tsx         # Demo chat page
```

## Dependencies

- `@openai/chatkit-react` - ChatKit React components
- `better-auth/react` - Better Auth client
- `next/script` - Next.js Script component for CDN loading

## Related Documentation

- **Better Auth:** `/lib/auth.ts`, `/lib/auth-server.ts`
- **Backend API:** `phase-3/backend/routes/chatkit.py`
- **MCP Server:** `phase-3/mcp-server/src/index.ts`
- **Environment Variables:** `.env.local.example`

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Review authentication flow (Better Auth → JWT → Backend)
4. Check backend logs for API errors
