# Authentication Feature Specification

**Status**: Implemented
**Version**: 1.0
**Last Updated**: 2025-12-13

## Overview

Phase II implements multi-user authentication using Better Auth with JWT tokens. Users can sign up, sign in, and sign out. All API requests are authenticated via JWT tokens, and user isolation is enforced at the database query level.

## Table of Contents

1. [User Stories](#user-stories)
2. [Better Auth Configuration](#better-auth-configuration)
3. [JWT Token Flow](#jwt-token-flow)
4. [Frontend Authentication](#frontend-authentication)
5. [Backend JWT Verification](#backend-jwt-verification)
6. [Security Requirements](#security-requirements)
7. [Related Specifications](#related-specifications)

---

## User Stories

### US-1: User Sign Up

**As a** new user
**I want to** create an account with email and password
**So that** I can access the task management application

**Acceptance Criteria**:
- User can navigate to `/signup` page
- Sign up form collects: name, email, password
- Email must be unique (no duplicates)
- Password must meet minimum requirements (8+ characters)
- Successful signup creates user account in database
- User is automatically signed in after successful signup
- User is redirected to `/dashboard` after signup
- Validation errors are displayed inline

**Implementation**:
- Frontend: `D:\Todo_giaic_five_phases\phase-2\frontend\app\signup\page.tsx`
- Backend: Better Auth handles user creation via Drizzle ORM
- Database: `user` and `account` tables (Better Auth schema)

---

### US-2: User Sign In

**As a** registered user
**I want to** sign in with my email and password
**So that** I can access my tasks

**Acceptance Criteria**:
- User can navigate to `/signin` page
- Sign in form collects: email, password
- Valid credentials authenticate user and create session
- JWT token is generated with 7-day expiration
- JWT token is stored in HTTP-only cookie
- User is redirected to `/dashboard` after signin
- Invalid credentials display error message
- "Remember me" option extends session duration

**Implementation**:
- Frontend: `D:\Todo_giaic_five_phases\phase-2\frontend\app\signin\page.tsx`
- Backend: Better Auth handles authentication and JWT generation
- Token Storage: HTTP-only cookie (managed by Better Auth)

---

### US-3: User Sign Out

**As a** signed-in user
**I want to** sign out of my account
**So that** my session is terminated and data is secure

**Acceptance Criteria**:
- User can click "Sign Out" button in dashboard header
- Sign out invalidates current session
- JWT token is removed from cookies
- User is redirected to landing page (`/`)
- Attempting to access protected routes after signout redirects to `/signin`

**Implementation**:
- Frontend: Sign out button in `DashboardHeader.tsx`
- Backend: Better Auth session invalidation
- Route Protection: `ProtectedRoute.tsx` component

---

### US-4: Protected Route Access

**As a** unauthenticated user
**I want to** be redirected to signin when accessing protected routes
**So that** only authenticated users can access the dashboard

**Acceptance Criteria**:
- `/dashboard` route requires authentication
- Unauthenticated users are redirected to `/signin`
- After successful signin, user is redirected to originally requested route
- Session validation happens on every protected route access
- Expired tokens trigger automatic signout and redirect

**Implementation**:
- Frontend: `ProtectedRoute.tsx` wrapper component
- Session Check: `getCurrentUser()` from `@/lib/auth`

---

## Better Auth Configuration

Better Auth is configured with:

### Features
- **Email/Password Authentication**: Primary authentication method
- **JWT Plugin**: Generates JWT tokens for API authentication
- **Next.js Cookies Plugin**: Manages session cookies
- **Drizzle ORM Adapter**: Type-safe database operations
- **Neon PostgreSQL**: Serverless database (shared with FastAPI backend)

### Configuration File

**Location**: `D:\Todo_giaic_five_phases\phase-2\frontend\lib\auth-server.ts`

```typescript
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  secret: process.env.BETTER_AUTH_SECRET,

  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },

  plugins: [
    jwt(),           // JWT token generation (RS256 algorithm)
    nextCookies(),   // Next.js cookie management (MUST be last)
  ],
});
```

### Environment Variables

**Required Variables** (must be identical in frontend and backend):

```env
# Shared secret for JWT signing/verification
BETTER_AUTH_SECRET=your-secret-key-here

# Database connection (shared between Better Auth and FastAPI)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Frontend URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Critical**: Both frontend and backend MUST use the **same** `BETTER_AUTH_SECRET` for JWT token signing and verification to work correctly.

---

## JWT Token Flow

### JWKS (JSON Web Key Set) Flow

Better Auth uses **RS256 algorithm** with public/private key pairs stored in the `jwks` table.

#### 1. Key Generation

When Better Auth initializes, it:
- Checks for existing keys in `jwks` table
- If no keys exist, generates RSA key pair (RS256)
- Stores public and private keys in database
- Keys are tied to `BETTER_AUTH_SECRET`

**Important**: If `BETTER_AUTH_SECRET` changes, delete old keys from `jwks` table to force regeneration.

#### 2. Token Generation (Frontend)

When user signs in:
1. Better Auth validates credentials
2. Creates session in `session` table
3. Retrieves private key from `jwks` table
4. Signs JWT token with RS256 algorithm
5. Token includes:
   ```json
   {
     "user_id": "uuid-string",
     "email": "user@example.com",
     "iat": 1234567890,
     "exp": 1234971490  // 7 days later
   }
   ```
6. Stores token in HTTP-only cookie
7. Returns token to client (also in response body)

#### 3. Token Verification (Backend)

When API receives request:
1. Extract token from `Authorization: Bearer {token}` header
2. Fetch public key from backend's JWKS endpoint (`/api/auth/jwks`)
3. Verify token signature using public key
4. Validate expiration time (`exp` claim)
5. Extract user information (`user_id`, `email`)
6. Return user info to endpoint handler

**Backend JWKS Endpoint**: `http://localhost:8000/api/auth/jwks`

This endpoint:
- Fetches public keys from Better Auth's JWKS endpoint
- Caches keys for performance
- Returns keys in JWKS format

### Token Lifecycle

- **Creation**: User signin
- **Expiration**: 7 days (configurable via `session.expiresIn`)
- **Refresh**: Automatic via session update mechanism
- **Invalidation**: User signout or session deletion

---

## Frontend Authentication

### Authentication Pages

#### 1. Sign Up Page

**Route**: `/signup`
**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\signup\page.tsx`

**Form Fields**:
- Name (required, max 100 characters)
- Email (required, unique, valid email format)
- Password (required, min 8 characters)

**Actions**:
- Submit form → Better Auth creates user → Auto signin → Redirect to `/dashboard`
- "Already have an account?" → Redirect to `/signin`

**Validation**:
- Client-side: React form validation
- Server-side: Better Auth validates email uniqueness

---

#### 2. Sign In Page

**Route**: `/signin`
**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\app\signin\page.tsx`

**Form Fields**:
- Email (required)
- Password (required)

**Actions**:
- Submit form → Better Auth validates credentials → Generate JWT → Redirect to `/dashboard`
- "Don't have an account?" → Redirect to `/signup`

**Error Handling**:
- Invalid credentials: Display error message
- Account not found: Display error message
- Server error: Display generic error message

---

### Protected Routes

**Component**: `ProtectedRoute.tsx`
**Location**: `D:\Todo_giaic_five_phases\phase-2\frontend\components\ProtectedRoute.tsx`

**How It Works**:
1. Wraps protected pages (e.g., `/dashboard`)
2. On mount, checks for active session via `getCurrentUser()`
3. If no session, redirects to `/signin`
4. If session exists, renders children components
5. Shows loading spinner during session check

**Usage**:
```typescript
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

---

### Authentication Utilities

**File**: `D:\Todo_giaic_five_phases\phase-2\frontend\lib\auth.ts`

**Exported Functions**:

```typescript
// Get current authenticated user
export async function getCurrentUser(): Promise<User | null>

// Sign out current user
export async function signOut(): Promise<void>
```

**Better Auth Client**:
- Imported from Better Auth SDK
- Handles cookie management
- Manages session state
- Provides authentication methods

---

## Backend JWT Verification

### JWT Middleware

**File**: `D:\Todo_giaic_five_phases\phase-2\backend\middleware\jwt.py`

**Purpose**: Verify JWT tokens on every protected API request

**How It Works**:

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, str]:
    """
    Extract and verify JWT token from Authorization header.

    Returns:
        dict: {"user_id": str, "email": str}

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing
    """
    token = credentials.credentials

    # Verify token using JWKS public key
    user_info = verify_token(token)  # From utils.auth

    return user_info
```

**Error Handling**:
- `TOKEN_EXPIRED`: Token expiration time passed
- `INVALID_TOKEN`: Token signature invalid
- `TOKEN_ERROR`: Token malformed or missing claims
- `TOKEN_VERIFICATION_FAILED`: Generic verification error

---

### JWKS Verification Utility

**File**: `D:\Todo_giaic_five_phases\phase-2\backend\utils\auth.py`

**Key Function**: `verify_jwt_token(token: str) -> Dict[str, str]`

**Process**:
1. Fetch JWKS from Better Auth's JWKS endpoint
2. Parse JWT header to get key ID (`kid`)
3. Find matching public key in JWKS
4. Verify token signature using public key
5. Validate expiration (`exp` claim)
6. Extract and return user information

**JWKS Endpoint**: `{BETTER_AUTH_URL}/.well-known/jwks.json`

**Caching**: JWKS keys are cached to reduce API calls

---

### User Isolation Enforcement

**Location**: All API route handlers in `D:\Todo_giaic_five_phases\phase-2\backend\routes\tasks.py`

**Pattern**:
```python
@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: Dict[str, str] = Depends(verify_jwt_token),
    db: Session = Depends(get_session),
):
    # 1. Verify user_id matches JWT token
    if current_user["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    # 2. Filter database query by user_id
    statement = select(Task).where(Task.user_id == user_id)
    tasks = db.exec(statement).all()

    return {"success": True, "data": tasks}
```

**Two-Layer Security**:
1. **Path Parameter Check**: Verify `user_id` in URL matches JWT token
2. **Database Filter**: Always filter queries by `user_id`

This ensures users can NEVER access other users' data, even if they try to manipulate the URL.

---

## Security Requirements

### 1. Shared Secret Security

**Requirement**: `BETTER_AUTH_SECRET` MUST be:
- Strong and random (min 32 characters)
- Identical in frontend and backend
- Never committed to version control
- Rotated periodically in production

**Impact of Mismatch**:
- Backend cannot verify frontend-issued tokens
- All API requests fail with 401 Unauthorized
- Users cannot access their data

---

### 2. User Isolation

**Requirement**: All database queries MUST filter by authenticated user's ID

**Implementation**:
- Extract `user_id` from JWT token
- Verify `user_id` in URL path matches token
- Filter all database queries by `user_id`
- Never trust client-provided user IDs

**Example Violation** (NEVER DO THIS):
```python
# BAD: No user_id filter
tasks = db.exec(select(Task)).all()  # Returns ALL users' tasks!

# GOOD: Filter by user_id
tasks = db.exec(select(Task).where(Task.user_id == user_id)).all()
```

---

### 3. Token Expiration

**Configuration**:
- Default: 7 days (`session.expiresIn: 60 * 60 * 24 * 7`)
- Automatic refresh: Every 24 hours (`session.updateAge: 60 * 60 * 24`)
- Cookie cache: 5 minutes (`cookieCache.maxAge: 60 * 5`)

**Behavior**:
- Expired tokens are rejected with 401 error
- User must sign in again to get new token
- Frontend detects expiration and redirects to `/signin`

---

### 4. HTTP-Only Cookies

**Requirement**: Session tokens MUST be stored in HTTP-only cookies

**Benefits**:
- Prevents XSS attacks (JavaScript cannot access cookie)
- Automatic inclusion in requests
- Managed by Better Auth's `nextCookies()` plugin

**Cookie Attributes**:
- `HttpOnly`: true
- `Secure`: true (HTTPS only in production)
- `SameSite`: Lax or Strict
- `Path`: /
- `Max-Age`: 7 days

---

### 5. CORS Configuration

**Requirement**: Backend MUST allow frontend origin

**Backend CORS** (`D:\Todo_giaic_five_phases\phase-2\backend\middleware\cors.py`):
```python
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production**: Set `CORS_ORIGINS` to production frontend URL

---

## Related Specifications

- **@specs/api/rest-endpoints.md** - API authentication requirements
- **@specs/database/schema.md** - Better Auth database tables
- **@specs/ui/pages.md** - Authentication pages (signin, signup)
- **@specs/architecture.md** - Authentication flow diagram
- **@specs/overview.md** - Project tech stack and authentication overview

---

## API Endpoints

Authentication endpoints are handled by Better Auth:

- `POST /api/auth/sign-up` - Create new user account
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out and invalidate session
- `GET /api/auth/session` - Get current session
- `GET /api/auth/jwks` - Get JWKS public keys (for backend verification)

All endpoints are prefixed with `/api/auth/` and managed by Better Auth.

---

## Testing

### Frontend Testing

**Sign Up Flow**:
1. Navigate to `/signup`
2. Fill form: name, email, password
3. Submit → Verify redirect to `/dashboard`
4. Verify user is authenticated

**Sign In Flow**:
1. Navigate to `/signin`
2. Fill form: email, password
3. Submit → Verify redirect to `/dashboard`
4. Verify JWT token in cookies

**Sign Out Flow**:
1. Click "Sign Out" in dashboard
2. Verify redirect to `/`
3. Verify session cleared
4. Attempt to access `/dashboard` → Verify redirect to `/signin`

### Backend Testing

**JWT Verification**:
1. Make API request without token → Verify 401 error
2. Make API request with invalid token → Verify 401 error
3. Make API request with expired token → Verify 401 error
4. Make API request with valid token → Verify success

**User Isolation**:
1. User A signs in → Get token A
2. User B signs in → Get token B
3. User A tries to access User B's tasks → Verify 403 error

---

## Known Issues and Limitations

1. **Email Verification**: Currently disabled (`requireEmailVerification: false`)
   - Enable in production with email service integration

2. **Password Reset**: Not implemented in Phase II
   - Better Auth supports password reset via email

3. **OAuth Providers**: Not configured in Phase II
   - Better Auth supports Google, GitHub, Facebook, etc.

4. **Two-Factor Authentication**: Not implemented in Phase II
   - Better Auth supports 2FA via TOTP

---

## Future Enhancements

1. **Email Verification**:
   - Enable `requireEmailVerification: true`
   - Configure email service (SendGrid, Postmark, etc.)

2. **Password Reset**:
   - Implement "Forgot Password" flow
   - Send reset link via email

3. **OAuth Providers**:
   - Add Google OAuth
   - Add GitHub OAuth

4. **Two-Factor Authentication**:
   - Add TOTP-based 2FA
   - Optional for users

5. **Session Management**:
   - View active sessions
   - Revoke sessions remotely

---

## Conclusion

The authentication system uses Better Auth with JWT tokens to provide secure, multi-user authentication. User isolation is enforced at both the API and database levels, ensuring data security. The JWKS flow with RS256 algorithm provides cryptographic security for token verification.

**Key Takeaways**:
- Better Auth handles user management and JWT generation
- Backend verifies tokens using JWKS public keys
- User isolation is enforced at database query level
- Shared `BETTER_AUTH_SECRET` is critical for token verification
- All protected routes require valid JWT token
