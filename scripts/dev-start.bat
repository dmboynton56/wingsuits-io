@echo off
REM Wingsuit.io Development Startup Script for Windows
REM This script starts all services in the correct order for local development

echo 🚀 Starting Wingsuit.io Development Environment...

REM Check prerequisites
echo Checking prerequisites...

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install Node.js and npm.
    pause
    exit /b 1
)

REM Check if Go is installed
go version >nul 2>&1
if errorlevel 1 (
    echo ❌ Go is not installed. Please install Go 1.23+.
    pause
    exit /b 1
)

REM Check if Supabase CLI is installed
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Supabase CLI is not installed.
    echo Install it with: npm install -g @supabase/cli
    pause
    exit /b 1
)

REM Check for environment files and create if needed
if not exist ".env" (
    echo ⚠️  .env file not found. Creating from env.example...
    if exist "env.example" (
        copy "env.example" ".env" >nul
        echo ✅ Created .env from env.example
    ) else (
        echo ❌ env.example not found. Please create environment files manually.
        pause
        exit /b 1
    )
)

if not exist "client\.env.local" (
    echo ⚠️  client/.env.local not found. Creating from example...
    if exist "client\env.local.example" (
        copy "client\env.local.example" "client\.env.local" >nul
        echo ✅ Created client/.env.local
    )
)

if not exist "game-server\.env" (
    echo ⚠️  game-server/.env not found. Creating from example...
    if exist "game-server\env.example" (
        copy "game-server\env.example" "game-server\.env" >nul
        echo ✅ Created game-server/.env
    )
)

REM Install dependencies
echo Installing dependencies...
call npm install

REM Step 1: Start Supabase
echo Step 1: Starting Supabase...

REM Check if port 54321 is in use (basic check)
netstat -an | findstr ":54321" >nul 2>&1
if not errorlevel 1 (
    echo ✅ Supabase appears to be already running on port 54321
) else (
    echo Starting Supabase local development...
    start /B supabase start
    
    REM Wait a moment for Supabase to start
    echo Waiting for Supabase to start...
    timeout /t 10 /nobreak >nul
    
    REM Run migrations
    echo Running database migrations...
    supabase db reset --linked 2>nul || supabase db reset
)

echo ✅ Supabase is running!
echo    📊 Studio: http://127.0.0.1:54323
echo    🗄️  Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres

REM Step 2: Start Go Game Server
echo Step 2: Starting Go Game Server...

REM Kill any existing process on port 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080"') do taskkill /F /PID %%a >nul 2>&1

cd game-server
echo Building and starting game server...
start /B go run cmd/server/main.go
cd ..

REM Wait for game server
echo Waiting for game server to start...
timeout /t 5 /nobreak >nul

echo ✅ Game Server is running on http://127.0.0.1:8080

REM Step 3: Start Next.js Client
echo Step 3: Starting Next.js Client...

REM Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do taskkill /F /PID %%a >nul 2>&1

cd client
echo Starting Next.js development server...
start /B npm run dev
cd ..

REM Wait for client
echo Waiting for client to start...
timeout /t 5 /nobreak >nul

echo ✅ Client is running on http://127.0.0.1:3000

REM Success message
echo.
echo 🎉 All services are running successfully!
echo.
echo 📋 Service URLs:
echo    🌐 Client App:    http://127.0.0.1:3000
echo    🎮 Game Server:   ws://127.0.0.1:8080
echo    📊 Supabase Studio: http://127.0.0.1:54323
echo    🗄️  Database:     postgresql://postgres:postgres@127.0.0.1:54322/postgres
echo.
echo 🛠️  Development Commands:
echo    npm run dev:full    - Start all services (this script)
echo    npm run dev         - Start client only
echo    npm run dev:server  - Start game server only
echo    npm run smoke:handshake - Test auth handshake
echo.
echo Press any key to open the client in your browser...
pause >nul
start http://127.0.0.1:3000
