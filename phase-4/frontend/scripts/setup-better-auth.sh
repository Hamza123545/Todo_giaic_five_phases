#!/bin/bash

# Better Auth Setup Script
# This script helps set up Better Auth for the first time

set -e  # Exit on error

echo "======================================"
echo "Better Auth Setup Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Warning: .env.local not found${NC}"
    echo ""
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo -e "${GREEN}✓ Created .env.local${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Edit .env.local and set the following variables:${NC}"
    echo "  - DATABASE_URL (PostgreSQL connection string)"
    echo "  - BETTER_AUTH_SECRET (min 32 characters)"
    echo ""
    echo "Generate a secure secret:"
    echo "  openssl rand -base64 32"
    echo ""
    read -p "Press Enter after editing .env.local..."
fi

# Check required environment variables
echo "Checking environment variables..."

source .env.local 2>/dev/null || true

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}✗ DATABASE_URL not set in .env.local${NC}"
    exit 1
fi

if [ -z "$BETTER_AUTH_SECRET" ]; then
    echo -e "${RED}✗ BETTER_AUTH_SECRET not set in .env.local${NC}"
    exit 1
fi

if [ ${#BETTER_AUTH_SECRET} -lt 32 ]; then
    echo -e "${RED}✗ BETTER_AUTH_SECRET must be at least 32 characters${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables configured${NC}"
echo ""

# Check if dependencies are installed
echo "Checking dependencies..."

if [ ! -d "node_modules" ] || [ ! -d "node_modules/pg" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Test database connection
echo "Testing database connection..."

node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('SELECT NOW()')
  .then(() => {
    console.log('\x1b[32m✓ Database connection successful\x1b[0m');
    pool.end();
  })
  .catch(err => {
    console.error('\x1b[31m✗ Database connection failed:\x1b[0m', err.message);
    pool.end();
    process.exit(1);
  });
" || exit 1

echo ""

# Generate Better Auth schema
echo "Generating Better Auth schema..."

npx @better-auth/cli generate --output ./schema/auth-schema.sql 2>&1 || {
    echo -e "${YELLOW}Note: Schema generation is optional${NC}"
}

echo ""

# Ask to run migration
echo -e "${YELLOW}Ready to create Better Auth tables in the database?${NC}"
echo "This will create: user, session, account, verification tables"
echo ""
read -p "Run migration? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running Better Auth migration..."
    npx @better-auth/cli migrate
    echo -e "${GREEN}✓ Migration complete${NC}"
else
    echo -e "${YELLOW}Skipped migration. Run manually with:${NC}"
    echo "  npx @better-auth/cli migrate"
fi

echo ""
echo "======================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Start the dev server:"
echo "     npm run dev"
echo ""
echo "  2. Test signup at:"
echo "     http://localhost:3000/signup"
echo ""
echo "  3. Verify JWKS endpoint:"
echo "     http://localhost:3000/.well-known/jwks.json"
echo ""
echo "  4. Check database tables:"
echo "     psql \$DATABASE_URL -c \"\\dt\""
echo ""
echo "For more information, see:"
echo "  - BETTER_AUTH_SETUP.md"
echo "  - ../BETTER_AUTH_INTEGRATION.md"
echo ""
