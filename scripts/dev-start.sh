#!/bin/bash

# Wingsuit.io Development Startup Script
# This script starts all services in the correct order for local development

set -e  # Exit on any error

echo "🚀 Starting Wingsuit.io Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go is not installed. Please install Go 1.23+.${NC}"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed.${NC}"
    echo -e "${YELLOW}Install it with: npm install -g @supabase/cli${NC}"
    exit 1
fi

# Check for environment files
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from env.example...${NC}"
    if [ -f "env.example" ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env from env.example${NC}"
    else
        echo -e "${RED}❌ env.example not found. Please create environment files manually.${NC}"
        exit 1
    fi
fi

if [ ! -f "client/.env.local" ]; then
    echo -e "${YELLOW}⚠️  client/.env.local not found. Creating from example...${NC}"
    if [ -f "client/env.local.example" ]; then
        cp client/env.local.example client/.env.local
        echo -e "${GREEN}✅ Created client/.env.local${NC}"
    fi
fi

if [ ! -f "game-server/.env" ]; then
    echo -e "${YELLOW}⚠️  game-server/.env not found. Creating from example...${NC}"
    if [ -f "game-server/env.example" ]; then
        cp game-server/env.example game-server/.env
        echo -e "${GREEN}✅ Created game-server/.env${NC}"
    fi
fi

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install

# Step 1: Start Supabase (foundational dependency)
echo -e "${BLUE}Step 1: Starting Supabase...${NC}"

# Check if Supabase is already running
if check_port 54321; then
    echo -e "${GREEN}✅ Supabase appears to be already running on port 54321${NC}"
else
    echo -e "${YELLOW}Starting Supabase local development...${NC}"
    supabase start &
    SUPABASE_PID=$!
    
    # Wait for Supabase to be ready
    wait_for_service "http://127.0.0.1:54321/rest/v1/" "Supabase"
    
    # Run migrations
    echo -e "${BLUE}Running database migrations...${NC}"
    supabase db reset --linked || supabase db reset
fi

echo -e "${GREEN}✅ Supabase is running!${NC}"
echo -e "${BLUE}   📊 Studio: http://127.0.0.1:54323${NC}"
echo -e "${BLUE}   🗄️  Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres${NC}"

# Step 2: Start Go Game Server (depends on Supabase)
echo -e "${BLUE}Step 2: Starting Go Game Server...${NC}"

if check_port 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 is already in use. Killing existing process...${NC}"
    # Kill any existing process on port 8080
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

cd game-server
echo -e "${YELLOW}Building and starting game server...${NC}"
go run cmd/server/main.go &
GAME_SERVER_PID=$!
cd ..

# Wait for game server to be ready
wait_for_service "http://127.0.0.1:8080" "Game Server"

echo -e "${GREEN}✅ Game Server is running on http://127.0.0.1:8080${NC}"

# Step 3: Start Next.js Client (depends on both services)
echo -e "${BLUE}Step 3: Starting Next.js Client...${NC}"

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Killing existing process...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

cd client
echo -e "${YELLOW}Starting Next.js development server...${NC}"
npm run dev &
CLIENT_PID=$!
cd ..

# Wait for client to be ready
wait_for_service "http://127.0.0.1:3000" "Next.js Client"

echo -e "${GREEN}✅ Client is running on http://127.0.0.1:3000${NC}"

# Success message
echo -e "\n${GREEN}🎉 All services are running successfully!${NC}"
echo -e "\n${BLUE}📋 Service URLs:${NC}"
echo -e "   🌐 Client App:    http://127.0.0.1:3000"
echo -e "   🎮 Game Server:   ws://127.0.0.1:8080"
echo -e "   📊 Supabase Studio: http://127.0.0.1:54323"
echo -e "   🗄️  Database:     postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "\n${BLUE}🛠️  Development Commands:${NC}"
echo -e "   npm run dev:full    - Start all services (this script)"
echo -e "   npm run dev         - Start client only"
echo -e "   npm run dev:server  - Start game server only"
echo -e "   npm run smoke:handshake - Test auth handshake"

echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$GAME_SERVER_PID" ]; then
        kill $GAME_SERVER_PID 2>/dev/null || true
    fi
    
    # Note: We don't automatically stop Supabase as it might be used by other projects
    echo -e "${BLUE}To stop Supabase: supabase stop${NC}"
    echo -e "${GREEN}✅ Development environment stopped${NC}"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait
