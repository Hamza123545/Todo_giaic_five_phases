# Frontend Scripts

This directory contains utility scripts for managing the frontend application.

## Better Auth Setup Script

Automated setup script for Better Auth integration.

### Usage

**Windows:**

```cmd
cd phase-2\frontend\scripts
setup-better-auth.bat
```

**Linux/Mac:**

```bash
cd phase-2/frontend/scripts
chmod +x setup-better-auth.sh
./setup-better-auth.sh
```

### What It Does

1. **Environment Check**
   - Creates `.env.local` from `.env.example` if not exists
   - Validates required environment variables
   - Checks `BETTER_AUTH_SECRET` is at least 32 characters

2. **Dependencies**
   - Checks if `node_modules` exists
   - Installs dependencies if needed
   - Verifies `pg` package is installed

3. **Database Connection**
   - Tests PostgreSQL connection
   - Validates `DATABASE_URL`

4. **Schema Migration**
   - Optionally runs Better Auth migrations
   - Creates `user`, `session`, `account`, `verification` tables

### Requirements

- Node.js 18+ installed
- PostgreSQL database (Neon or local)
- Environment variables configured in `.env.local`

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
BETTER_AUTH_SECRET=your-secret-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Troubleshooting

**"DATABASE_URL not set"**

- Edit `.env.local` and add your PostgreSQL connection string

**"BETTER_AUTH_SECRET must be at least 32 characters"**

- Generate a secure secret:

  ```bash
  # Linux/Mac
  openssl rand -base64 32

  # Windows PowerShell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  ```

**"Database connection failed"**

- Verify PostgreSQL is running
- Check DATABASE_URL format
- Test connection manually:
  ```bash
  psql $DATABASE_URL -c "SELECT NOW()"
  ```

**"Migration failed"**

- Ensure database user has CREATE TABLE permissions
- Check database is accessible
- Run migration manually:
  ```bash
  npx @better-auth/cli migrate
  ```

### Manual Setup

If the script doesn't work, follow these steps manually:

1. **Create .env.local**:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Test database connection**:

   ```bash
   psql $DATABASE_URL -c "SELECT NOW()"
   ```

4. **Run migration**:

   ```bash
   npx @better-auth/cli migrate
   ```

5. **Start dev server**:
   ```bash
   npm run dev
   ```

### Next Steps

After running the setup script:

1. **Start the development server**:

   ```bash
   cd phase-2/frontend
   npm run dev
   ```

2. **Test authentication**:
   - Navigate to http://localhost:3000/signup
   - Create a test account
   - Verify redirect to dashboard

3. **Check JWKS endpoint**:
   - Visit http://localhost:3000/.well-known/jwks.json
   - Should see JWT public keys

4. **Verify database tables**:

   ```sql
   -- Connect to database
   psql $DATABASE_URL

   -- List tables
   \dt

   -- Check user table
   SELECT * FROM "user";
   ```

### See Also

- [../BETTER_AUTH_SETUP.md](../BETTER_AUTH_SETUP.md) - Detailed setup guide
- [../../BETTER_AUTH_INTEGRATION.md](../../BETTER_AUTH_INTEGRATION.md) - Full-stack integration
- [../.env.example](../.env.example) - Environment variables template
