# Database Schema Specification

**Status**: Implemented
**Version**: 1.0
**Last Updated**: 2025-12-13

## Overview

Phase II uses **Neon Serverless PostgreSQL** as the shared database for both frontend (Better Auth) and backend (FastAPI). The database contains two categories of tables:

1. **Better Auth Tables**: Managed by Better Auth via Drizzle ORM (frontend)
2. **Application Tables**: Managed by SQLModel/Alembic (backend)

Both systems coexist in the same database without conflicts.

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Better Auth Tables](#better-auth-tables)
3. [Application Tables](#application-tables)
4. [Indexes](#indexes)
5. [Relationships](#relationships)
6. [Migration Strategy](#migration-strategy)
7. [Related Specifications](#related-specifications)

---

## Database Architecture

### Shared Database Configuration

**Database**: Neon Serverless PostgreSQL
**Connection String**: `postgresql://user:password@host:5432/dbname`

**Managed by Two Systems**:
- **Better Auth (Frontend)**: Uses Drizzle ORM to manage authentication tables
- **FastAPI (Backend)**: Uses SQLModel/Alembic to manage application tables

### Why Shared Database?

1. **Single Source of Truth**: User data stored once, accessed by both systems
2. **Data Consistency**: No need to sync users between databases
3. **Cost Efficiency**: Single database instance reduces costs
4. **Simplified Deployment**: One database connection to manage

### Table Name Prefixes

- **Better Auth Tables**: No prefix (e.g., `user`, `session`)
- **Application Tables**: No prefix (e.g., `tasks`)

**Note**: Better Auth tables do NOT use `better_auth_*` prefix in this implementation.

---

## Better Auth Tables

Better Auth manages authentication tables via Drizzle ORM. These tables are automatically created and maintained by Better Auth.

**Schema File**: `D:\Todo_giaic_five_phases\phase-2\frontend\drizzle\schema.ts`

### 1. `user` Table

Stores user account information.

**Columns**:

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | text | PRIMARY KEY | - | User ID (UUID string) |
| `name` | text | NOT NULL | - | User's display name |
| `email` | text | NOT NULL, UNIQUE | - | User's email address |
| `emailVerified` | boolean | NOT NULL | false | Email verification status |
| `image` | text | NULL | null | User's profile image URL |
| `createdAt` | timestamp | NOT NULL | NOW() | Account creation timestamp |
| `updatedAt` | timestamp | NOT NULL | NOW() | Last update timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- UNIQUE: `email`

**TypeScript Type**:
```typescript
export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

---

### 2. `session` Table

Stores active user sessions.

**Columns**:

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | text | PRIMARY KEY | - | Session ID |
| `expiresAt` | timestamp | NOT NULL | - | Session expiration time |
| `token` | text | NOT NULL, UNIQUE | - | Session token (JWT) |
| `createdAt` | timestamp | NOT NULL | NOW() | Session creation time |
| `updatedAt` | timestamp | NOT NULL | NOW() | Last update time |
| `ipAddress` | text | NULL | null | IP address of session |
| `userAgent` | text | NULL | null | User agent string |
| `userId` | text | NOT NULL, FOREIGN KEY | - | References `user.id` |

**Indexes**:
- PRIMARY KEY: `id`
- UNIQUE: `token`
- INDEX: `userId`

**Foreign Keys**:
- `userId` REFERENCES `user(id)` ON DELETE CASCADE

**TypeScript Type**:
```typescript
export type Session = {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
};
```

**Cascade Behavior**: When a user is deleted, all their sessions are automatically deleted.

---

### 3. `account` Table

Stores OAuth provider connections (Google, GitHub, etc.) and email/password credentials.

**Columns**:

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | text | PRIMARY KEY | - | Account ID |
| `accountId` | text | NOT NULL | - | Provider account ID |
| `providerId` | text | NOT NULL | - | Provider identifier (e.g., "google") |
| `userId` | text | NOT NULL, FOREIGN KEY | - | References `user.id` |
| `accessToken` | text | NULL | null | OAuth access token |
| `refreshToken` | text | NULL | null | OAuth refresh token |
| `idToken` | text | NULL | null | OAuth ID token |
| `accessTokenExpiresAt` | timestamp | NULL | null | Access token expiration |
| `refreshTokenExpiresAt` | timestamp | NULL | null | Refresh token expiration |
| `scope` | text | NULL | null | OAuth scope |
| `password` | text | NULL | null | Hashed password (for email/password auth) |
| `createdAt` | timestamp | NOT NULL | NOW() | Account creation time |
| `updatedAt` | timestamp | NOT NULL | NOW() | Last update time |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `userId`

**Foreign Keys**:
- `userId` REFERENCES `user(id)` ON DELETE CASCADE

**TypeScript Type**:
```typescript
export type Account = {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

**Note**: For email/password authentication, `providerId` is "credential" and `password` contains the hashed password.

---

### 4. `verification` Table

Stores email verification tokens and other verification codes.

**Columns**:

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | text | PRIMARY KEY | - | Verification ID |
| `identifier` | text | NOT NULL | - | Email address or identifier |
| `value` | text | NOT NULL | - | Verification token/code |
| `expiresAt` | timestamp | NOT NULL | - | Token expiration time |
| `createdAt` | timestamp | NOT NULL | NOW() | Token creation time |
| `updatedAt` | timestamp | NOT NULL | NOW() | Last update time |

**Indexes**:
- PRIMARY KEY: `id`

**TypeScript Type**:
```typescript
export type Verification = {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

**Usage**: Email verification, password reset tokens, 2FA codes, etc.

---

### 5. `jwks` Table

Stores JWT signing keys (required for JWT plugin with RS256 algorithm).

**Columns**:

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | text | PRIMARY KEY | - | Key ID |
| `publicKey` | text | NOT NULL | - | RSA public key (PEM format) |
| `privateKey` | text | NOT NULL | - | RSA private key (PEM format) |
| `createdAt` | timestamp | NOT NULL | NOW() | Key creation time |

**Indexes**:
- PRIMARY KEY: `id`

**TypeScript Type**:
```typescript
export type Jwks = {
  id: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
};
```

**Key Generation**:
- Better Auth automatically generates RSA key pairs on first initialization
- Keys are tied to `BETTER_AUTH_SECRET`
- If secret changes, delete old keys to force regeneration

**Security**:
- Private key is used to sign JWT tokens (frontend)
- Public key is used to verify JWT tokens (backend)
- Keys are stored securely in database (not in code or environment variables)

---

## Application Tables

Application tables are managed by SQLModel/Alembic in the backend.

**Models File**: `D:\Todo_giaic_five_phases\phase-2\backend\models.py`

### 1. `tasks` Table

Stores user tasks.

**Columns**:

| Column Name | Type | Constraints | Default | Description |
|------------|------|-------------|---------|-------------|
| `id` | integer | PRIMARY KEY, AUTO INCREMENT | - | Task ID |
| `user_id` | text | NOT NULL, INDEX | - | Owner user ID (references `user.id`) |
| `title` | text | NOT NULL | - | Task title (max 200 characters) |
| `description` | text | NULL | null | Task description (max 1000 characters) |
| `priority` | text | NOT NULL, INDEX | "medium" | Priority level: "low", "medium", "high" |
| `due_date` | timestamp | NULL, INDEX | null | Task due date |
| `tags` | jsonb | NULL | null | Array of tags (JSON) |
| `completed` | boolean | NOT NULL, INDEX | false | Completion status |
| `created_at` | timestamp | NOT NULL | NOW() | Task creation time |
| `updated_at` | timestamp | NOT NULL | NOW() | Last update time |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `user_id` (for user isolation queries)
- INDEX: `completed` (for filtering by completion status)
- INDEX: `priority` (for filtering by priority)
- INDEX: `due_date` (for sorting and filtering by due date)

**Foreign Key** (Logical, not enforced):
- `user_id` logically references `user.id`
- No database-level foreign key constraint (Better Auth manages `user` table)

**Python Type**:
```python
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: str = Field(default="medium", nullable=False, index=True)
    due_date: Optional[datetime] = Field(default=None, index=True)
    tags: Optional[list[str]] = Field(default=None, sa_column=Column(JSON))
    completed: bool = Field(default=False, nullable=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )
```

**Field Constraints**:
- `title`: Required, max 200 characters
- `description`: Optional, max 1000 characters
- `priority`: Required, must be "low", "medium", or "high"
- `due_date`: Optional, ISO 8601 timestamp
- `tags`: Optional, array of lowercase strings (stored as JSON)
- `completed`: Required, boolean (default false)

**Validation** (Application-level):
- Title length: 1-200 characters
- Description length: 0-1000 characters
- Priority values: "low", "medium", "high"
- Due date: Cannot be in the past (on creation)
- Tags: Lowercase, unique, trimmed

---

## Indexes

### Better Auth Tables

**`user` table**:
- PRIMARY KEY: `id`
- UNIQUE INDEX: `email`

**`session` table**:
- PRIMARY KEY: `id`
- UNIQUE INDEX: `token`
- INDEX: `userId`

**`account` table**:
- PRIMARY KEY: `id`
- INDEX: `userId`

**`verification` table**:
- PRIMARY KEY: `id`

**`jwks` table**:
- PRIMARY KEY: `id`

---

### Application Tables

**`tasks` table**:
- PRIMARY KEY: `id`
- INDEX: `user_id` (for user isolation queries)
- INDEX: `completed` (for filtering by status)
- INDEX: `priority` (for filtering and sorting)
- INDEX: `due_date` (for sorting and filtering)

**Index Usage**:
- `user_id`: Used in ALL queries to enforce user isolation
- `completed`: Used for filtering by status ("all", "pending", "completed")
- `priority`: Used for filtering by priority and sorting
- `due_date`: Used for sorting and filtering by due date range

**Composite Indexes** (Future Enhancement):
- `(user_id, completed)`: Optimize filtering by user and status
- `(user_id, priority)`: Optimize filtering by user and priority
- `(user_id, due_date)`: Optimize sorting by user and due date

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│      user       │
│─────────────────│
│ id (PK)         │──┐
│ name            │  │
│ email (UNIQUE)  │  │
│ emailVerified   │  │
│ image           │  │
│ createdAt       │  │
│ updatedAt       │  │
└─────────────────┘  │
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   session   │ │   account   │ │    tasks    │
│─────────────│ │─────────────│ │─────────────│
│ id (PK)     │ │ id (PK)     │ │ id (PK)     │
│ token       │ │ accountId   │ │ user_id (FK)│
│ expiresAt   │ │ providerId  │ │ title       │
│ userId (FK) │ │ userId (FK) │ │ description │
│ ...         │ │ password    │ │ priority    │
└─────────────┘ │ ...         │ │ due_date    │
                └─────────────┘ │ tags        │
                                │ completed   │
                                │ created_at  │
                                │ updated_at  │
                                └─────────────┘

┌──────────────────┐         ┌─────────────┐
│   verification   │         │    jwks     │
│──────────────────│         │─────────────│
│ id (PK)          │         │ id (PK)     │
│ identifier       │         │ publicKey   │
│ value            │         │ privateKey  │
│ expiresAt        │         │ createdAt   │
│ ...              │         └─────────────┘
└──────────────────┘
```

### Relationships

**`user` → `session`**: One-to-Many
- One user can have multiple active sessions
- Cascade DELETE: Deleting user deletes all sessions

**`user` → `account`**: One-to-Many
- One user can have multiple provider accounts (Google, GitHub, email/password)
- Cascade DELETE: Deleting user deletes all accounts

**`user` → `tasks`**: One-to-Many (Logical)
- One user can have multiple tasks
- NO CASCADE: Tasks are NOT automatically deleted when user is deleted (requires manual cleanup)
- User isolation enforced at query level, not database constraint

**`verification`**: Standalone
- No foreign key relationships
- Used for email verification, password reset, 2FA, etc.

**`jwks`**: Standalone
- No foreign key relationships
- Stores JWT signing keys

---

## Migration Strategy

### Better Auth Migrations

**Tool**: Drizzle Kit
**Managed By**: Frontend (`npm run db:generate`, `npm run db:push`)

**Process**:
1. Update `D:\Todo_giaic_five_phases\phase-2\frontend\drizzle\schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Apply migration: `npx drizzle-kit push`
4. Migrations are stored in `drizzle/migrations/`

**Note**: Better Auth automatically creates tables on first initialization if they don't exist.

---

### Application Migrations

**Tool**: Alembic
**Managed By**: Backend (`alembic revision`, `alembic upgrade`)

**Process**:
1. Update `D:\Todo_giaic_five_phases\phase-2\backend\models.py`
2. Generate migration: `cd backend && uv run alembic revision --autogenerate -m "Description"`
3. Review migration in `backend/alembic/versions/`
4. Apply migration: `uv run alembic upgrade head`
5. Rollback (if needed): `uv run alembic downgrade -1`

**Alembic Configuration**: `D:\Todo_giaic_five_phases\phase-2\backend\alembic.ini`

**Migration Files**: `D:\Todo_giaic_five_phases\phase-2\backend\alembic\versions\`

---

### Migration Coordination

**Challenge**: Two systems (Drizzle and Alembic) manage the same database

**Solution**: Coordinate migrations carefully:
1. Better Auth tables: Use Drizzle Kit (frontend)
2. Application tables: Use Alembic (backend)
3. Never modify the same table with both tools
4. Document which tool manages which tables

**Table Ownership**:
| Table | Managed By | Tool |
|-------|-----------|------|
| `user` | Better Auth | Drizzle Kit |
| `session` | Better Auth | Drizzle Kit |
| `account` | Better Auth | Drizzle Kit |
| `verification` | Better Auth | Drizzle Kit |
| `jwks` | Better Auth | Drizzle Kit |
| `tasks` | Backend | Alembic |

---

## Data Types

### PostgreSQL to TypeScript Mapping (Better Auth)

| PostgreSQL | TypeScript | Drizzle Type |
|-----------|-----------|-------------|
| `text` | `string` | `text()` |
| `boolean` | `boolean` | `boolean()` |
| `timestamp` | `Date` | `timestamp()` |

---

### PostgreSQL to Python Mapping (Application)

| PostgreSQL | Python | SQLModel Type |
|-----------|--------|--------------|
| `integer` | `int` | `int` |
| `text` | `str` | `str` |
| `boolean` | `bool` | `bool` |
| `timestamp` | `datetime` | `datetime` |
| `jsonb` | `list[str]` | `Column(JSON)` |

---

## Database Constraints

### Better Auth Tables

**Unique Constraints**:
- `user.email`: Prevents duplicate email addresses
- `session.token`: Ensures unique session tokens

**Foreign Key Constraints**:
- `session.userId` → `user.id` (CASCADE DELETE)
- `account.userId` → `user.id` (CASCADE DELETE)

**NOT NULL Constraints**:
- All fields except explicitly nullable ones

---

### Application Tables

**Unique Constraints**:
- `tasks.id`: Auto-increment primary key

**Foreign Key Constraints**:
- `tasks.user_id` → `user.id` (LOGICAL, not enforced at database level)

**NOT NULL Constraints**:
- `user_id`, `title`, `priority`, `completed`, `created_at`, `updated_at`

**Default Values**:
- `priority`: "medium"
- `completed`: false
- `created_at`: NOW()
- `updated_at`: NOW()

---

## Data Seeding

### Development Seed Data

**Not implemented in Phase II**

Future enhancement: Add seed data for development
- Sample users
- Sample tasks
- Test data for different scenarios

**Recommended Approach**:
1. Create seed script: `backend/scripts/seed.py`
2. Use SQLModel to insert data
3. Run: `uv run python scripts/seed.py`

---

## Database Backups

**Production Recommendation**:
1. Enable Neon's automated backups (daily snapshots)
2. Set retention policy (e.g., 7 days)
3. Test restore process regularly
4. Export critical data periodically

**Backup Strategy**:
- Daily automated backups (Neon feature)
- Weekly manual exports (CSV/JSON)
- Pre-deployment backups
- Pre-migration backups

---

## Database Performance

### Query Optimization

**User Isolation Queries**:
```sql
-- All task queries filter by user_id
SELECT * FROM tasks WHERE user_id = 'uuid-string';
```

**Index Usage**:
- `user_id` index: Used in ALL task queries
- `completed` index: Used for status filtering
- `priority` index: Used for priority filtering
- `due_date` index: Used for date sorting

**Performance Metrics**:
- Average query time: < 50ms
- P95 query time: < 200ms
- Concurrent queries: 100+

---

### Connection Pooling

**Neon Serverless**: Built-in connection pooling
**FastAPI**: SQLModel session management
**Better Auth**: Drizzle connection pooling

**Configuration**:
- Max connections: 10 (per instance)
- Connection timeout: 30 seconds
- Idle timeout: 5 minutes

---

## Related Specifications

- **@specs/features/authentication.md** - Better Auth tables and user management
- **@specs/api/rest-endpoints.md** - API endpoints that query these tables
- **@specs/architecture.md** - Database architecture and shared database pattern
- **@specs/overview.md** - Tech stack and database choice

---

## Conclusion

The database schema supports multi-user authentication (Better Auth) and task management (application). Better Auth tables are managed by Drizzle ORM, while application tables are managed by SQLModel/Alembic. Both systems coexist in the same Neon PostgreSQL database without conflicts. User isolation is enforced at the query level with indexed `user_id` columns.

**Key Design Decisions**:
1. Shared database between frontend and backend
2. Better Auth manages authentication tables
3. No foreign key constraint between `tasks.user_id` and `user.id`
4. Comprehensive indexes for query performance
5. JSON column for flexible tag storage
