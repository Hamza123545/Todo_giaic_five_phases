# Better Auth Implementation Fix - Prompt for Claude

## Task
Fix Better Auth implementation to match requirements. Currently Better Auth client is configured but NOT actually being used. Need to properly integrate Better Auth server with JWT plugin and update frontend to use Better Auth for authentication.

---

## Current Issues

1. **Better Auth Server Missing:**
   - No `betterAuth()` server configuration
   - No JWT plugin enabled
   - No API route handler for Better Auth

2. **Frontend Not Using Better Auth:**
   - Signup/Signin pages use `api.signup()` / `api.signin()` (custom API calls)
   - Should use `authClient.signUp.email()` / `authClient.signIn.email()`

3. **JWT Token Retrieval Wrong:**
   - API client reads from `sessionStorage.getItem("auth_token")`
   - Should use `authClient.token()` to get JWT from Better Auth session

4. **Backend is Correct:**
   - Already verifies JWT with shared secret (`BETTER_AUTH_SECRET`)
   - No changes needed to backend

---

## Required Changes

### 1. Setup Better Auth Server

**File:** `phase-2/frontend/lib/auth-server.ts` (NEW FILE)

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
// Need database adapter - check existing database setup

export const auth = betterAuth({
  database: db, // Database adapter (need to check existing setup)
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    jwt(), // Enable JWT plugin - CRITICAL
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
```

**Action:** 
- Check existing database setup in `phase-2/frontend/`
- Use appropriate database adapter (Drizzle/Prisma/etc.)
- Create this file with proper database adapter

### 2. Create API Route Handler

**File:** `phase-2/frontend/app/api/auth/[...all]/route.ts` (NEW FILE)

```typescript
import { auth } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

**Action:** Create this file to handle Better Auth API routes

### 3. Update Frontend Auth Client

**File:** `phase-2/frontend/lib/auth.ts` (UPDATE)

**Current:** Already has `authClient` configured

**Action:** 
- Verify `baseURL` points to Better Auth API route (`/api/auth`)
- Ensure configuration is correct

### 4. Update Signup Page

**File:** `phase-2/frontend/app/signup/page.tsx` (UPDATE)

**Change:**
```typescript
// REMOVE:
const response = await api.signup({ email, password, name });

// REPLACE WITH:
import { signUp } from "@/lib/auth";
const response = await signUp(email, password, name);

// After successful signup, get JWT token:
const { data } = await authClient.token();
if (data?.token) {
  sessionStorage.setItem("auth_token", data.token);
}
```

**Action:** Replace custom API call with Better Auth signup

### 5. Update Signin Page

**File:** `phase-2/frontend/app/signin/page.tsx` (UPDATE)

**Change:**
```typescript
// REMOVE:
const response = await api.signin({ email, password });

// REPLACE WITH:
import { signIn } from "@/lib/auth";
const response = await signIn(email, password);

// After successful signin, get JWT token:
const { data } = await authClient.token();
if (data?.token) {
  sessionStorage.setItem("auth_token", data.token);
}
```

**Action:** Replace custom API call with Better Auth signin

### 6. Update API Client

**File:** `phase-2/frontend/lib/api.ts` (UPDATE)

**Change `getAuthToken()` function:**
```typescript
// REMOVE:
const getAuthToken = (): string | null => {
  const token = sessionStorage.getItem("auth_token");
  return token;
};

// REPLACE WITH:
import { authClient } from "@/lib/auth";

const getAuthToken = async (): Promise<string | null> => {
  try {
    // First try Better Auth session
    const { data } = await authClient.token();
    if (data?.token) {
      return data.token;
    }
    
    // Fallback to sessionStorage (for backward compatibility during migration)
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("auth_token");
    }
    
    return null;
  } catch (error) {
    // Fallback to sessionStorage if Better Auth fails
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("auth_token");
    }
    return null;
  }
};
```

**Action:** Update API client to get token from Better Auth first, fallback to sessionStorage

### 7. Update API Client Calls

**File:** `phase-2/frontend/lib/api.ts` (UPDATE)

**Change all `apiFetch` calls to use async `getAuthToken()`:**
```typescript
// UPDATE apiFetch function:
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<ApiResponse<T>> {
  const token = await getAuthToken(); // Now async
  
  // ... rest of function
}
```

**Action:** Make `getAuthToken()` async and update all API calls

---

## Skills to Use

- `better-auth-ts` - Better Auth TypeScript patterns
- `frontend-auth` - Frontend authentication patterns
- `frontend-api-client` - API client patterns
- `nextjs` - Next.js 16 App Router patterns

---

## Environment Variables Needed

Ensure these are set in `.env`:
```env
BETTER_AUTH_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=your-database-url
```

---

## Testing Checklist

After implementation:

- [ ] Better Auth server configured with JWT plugin
- [ ] API route handler created (`/api/auth/[...all]`)
- [ ] Signup uses Better Auth (`authClient.signUp.email()`)
- [ ] Signin uses Better Auth (`authClient.signIn.email()`)
- [ ] JWT token retrieved from Better Auth session (`authClient.token()`)
- [ ] API client gets token from Better Auth
- [ ] Tokens attached to API requests correctly
- [ ] Backend verifies tokens (already working)
- [ ] User can signup → get JWT → make API calls → backend verifies

---

## Implementation Order

1. **First:** Setup Better Auth server (`lib/auth-server.ts`)
2. **Second:** Create API route handler (`app/api/auth/[...all]/route.ts`)
3. **Third:** Update API client to get token from Better Auth
4. **Fourth:** Update signup page to use Better Auth
5. **Fifth:** Update signin page to use Better Auth
6. **Finally:** Test end-to-end flow

---

## Important Notes

- **Backend is correct** - no changes needed to backend
- **Database adapter** - need to check existing database setup and use appropriate adapter
- **JWT Plugin** - MUST be enabled for JWT token issuance
- **Shared Secret** - Both frontend and backend use same `BETTER_AUTH_SECRET`
- **Token Storage** - Better Auth handles session, but we store token in sessionStorage for API client compatibility

---

## Expected Result

After fixes:
- User signs up → Better Auth creates session → Issues JWT token
- Frontend gets JWT from Better Auth → Stores in sessionStorage
- API client attaches JWT to requests → Backend verifies → Returns user data
- Full Better Auth integration working as per requirements

