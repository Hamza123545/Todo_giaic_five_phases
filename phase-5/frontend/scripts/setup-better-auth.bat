@echo off
REM Better Auth Setup Script for Windows
REM This script helps set up Better Auth for the first time

setlocal enabledelayedexpansion

echo ======================================
echo Better Auth Setup Script
echo ======================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo [WARNING] .env.local not found
    echo.
    echo Creating .env.local from .env.example...
    copy .env.example .env.local >nul
    echo [OK] Created .env.local
    echo.
    echo [IMPORTANT] Edit .env.local and set the following variables:
    echo   - DATABASE_URL (PostgreSQL connection string^)
    echo   - BETTER_AUTH_SECRET (min 32 characters^)
    echo.
    echo Generate a secure secret with PowerShell:
    echo   [Convert]::ToBase64String((1..32 ^| ForEach-Object { Get-Random -Maximum 256 }^)^)
    echo.
    pause
)

REM Check if node_modules exists
echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    if not exist node_modules\pg (
        echo Installing missing dependencies...
        call npm install
        if errorlevel 1 (
            echo [ERROR] Failed to install dependencies
            exit /b 1
        )
    )
    echo [OK] Dependencies already installed
)
echo.

REM Test database connection
echo Testing database connection...
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()').then(() => { console.log('[OK] Database connection successful'); pool.end(); }).catch(err => { console.error('[ERROR] Database connection failed:', err.message); pool.end(); process.exit(1); });"
if errorlevel 1 (
    echo.
    echo [ERROR] Database connection failed. Check your DATABASE_URL in .env.local
    exit /b 1
)
echo.

REM Ask to run migration
echo [WARNING] Ready to create Better Auth tables in the database?
echo This will create: user, session, account, verification tables
echo.
set /p CONFIRM="Run migration? (y/n): "

if /i "%CONFIRM%"=="y" (
    echo Running Better Auth migration...
    call npx @better-auth/cli migrate
    if errorlevel 1 (
        echo [WARNING] Migration failed or was skipped
    ) else (
        echo [OK] Migration complete
    )
) else (
    echo Skipped migration. Run manually with:
    echo   npx @better-auth/cli migrate
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo   1. Start the dev server:
echo      npm run dev
echo.
echo   2. Test signup at:
echo      http://localhost:3000/signup
echo.
echo   3. Verify JWKS endpoint:
echo      http://localhost:3000/.well-known/jwks.json
echo.
echo   4. Check database tables (if you have psql):
echo      psql %%DATABASE_URL%% -c "\dt"
echo.
echo For more information, see:
echo   - BETTER_AUTH_SETUP.md
echo   - ..\BETTER_AUTH_INTEGRATION.md
echo.
pause
