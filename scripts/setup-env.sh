#!/bin/bash

# Environment Setup Script
# Creates .env files from examples if they don't exist

echo "🔧 Setting up environment files..."

# Root .env
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ Created .env from env.example"
    else
        echo "❌ env.example not found"
    fi
else
    echo "✅ .env already exists"
fi

# Client .env.local
if [ ! -f "client/.env.local" ]; then
    if [ -f "client/env.local.example" ]; then
        cp client/env.local.example client/.env.local
        echo "✅ Created client/.env.local from env.local.example"
    else
        echo "❌ client/env.local.example not found"
    fi
else
    echo "✅ client/.env.local already exists"
fi

# Game server .env
if [ ! -f "game-server/.env" ]; then
    if [ -f "game-server/env.example" ]; then
        cp game-server/env.example game-server/.env
        echo "✅ Created game-server/.env from env.example"
    else
        echo "❌ game-server/env.example not found"
    fi
else
    echo "✅ game-server/.env already exists"
fi

echo "🎉 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run dev:full' to start all services"
echo "2. Visit http://127.0.0.1:3000 to see the client"
echo "3. Check http://127.0.0.1:54323 for Supabase Studio"
