# Better Auth Fix - Short Prompt for Claude

```
Fix Better Auth implementation. Currently Better Auth client is configured but NOT used. 

ISSUES:
1. Better Auth server missing (no betterAuth() setup, no JWT plugin)
2. Signup/Signin use api.signup()/api.signin() instead of Better Auth
3. API client reads token from sessionStorage instead of Better Auth session

REQUIRED FIXES:

1. Create phase-2/frontend/lib/auth-server.ts:
   - Setup betterAuth() with JWT plugin
   - Use PostgreSQL adapter (backend uses Neon PostgreSQL)
   - Connect to same DATABASE_URL as backend
   - Configure with BETTER_AUTH_SECRET
   - Enable emailAndPassword authentication

2. Create phase-2/frontend/app/api/auth/[...all]/route.ts:
   - Export GET/POST handlers using toNextJsHandler(auth.handler)

3. Update phase-2/frontend/lib/api.ts:
   - Change getAuthToken() to async
   - Get token from authClient.token() first
   - Fallback to sessionStorage

4. Update phase-2/frontend/app/signup/page.tsx:
   - Replace api.signup() with authClient.signUp.email()
   - Get JWT token after signup: authClient.token()

5. Update phase-2/frontend/app/signin/page.tsx:
   - Replace api.signin() with authClient.signIn.email()
   - Get JWT token after signin: authClient.token()

SKILLS: Use better-auth-ts, frontend-auth, frontend-api-client, nextjs skills.

BACKEND: No changes needed - already correct.

RESULT: Better Auth handles signup/signin, issues JWT tokens, frontend gets tokens from Better Auth session, API client attaches tokens to requests, backend verifies (already working).
```

