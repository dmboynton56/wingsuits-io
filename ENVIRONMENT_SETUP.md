# Environment Setup Guide

This guide helps you set up the development environment for Wingsuit.io.

## Quick Start

1. **Create environment files from examples:**
   ```bash
   # Copy root environment
   cp env.example .env
   
   # Copy client environment
   cp client/env.local.example client/.env.local
   
   # Copy server environment  
   cp game-server/env.example game-server/.env
   ```

2. **Start all services:**
   ```bash
   npm run dev:full
   ```

   This will start Supabase, Go server, and Next.js client in the correct order.

## Environment Files

### Root `.env`
Contains shared configuration for the entire project:
- Supabase connection details
- Service URLs and ports
- Google OAuth credentials (optional)

### `client/.env.local`
Next.js environment variables (browser-safe with `NEXT_PUBLIC_` prefix):
- Supabase client configuration
- Game server WebSocket URL

### `game-server/.env`
Go server configuration (server-side only):
- JWT validation secret
- CORS origins
- World settings

## Default Development Ports

| Service | Port | URL |
|---------|------|-----|
| Next.js Client | 3000 | http://127.0.0.1:3000 |
| Go Game Server | 8080 | ws://127.0.0.1:8080 |
| Supabase API | 54321 | http://127.0.0.1:54321 |
| Supabase DB | 54322 | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Supabase Studio | 54323 | http://127.0.0.1:54323 |
| Redis | 6379 | redis://127.0.0.1:6379 |

## Available NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:full` | Start all services (recommended) |
| `npm run dev` | Start Next.js client only |
| `npm run dev:server` | Start Go game server only |
| `npm run dev:supabase` | Start Supabase only |
| `npm run docker:up` | Start via Docker Compose |
| `npm run smoke:handshake` | Test auth handshake |
| `npm run stop:all` | Stop all services |

## Startup Order & Dependencies

The startup script ensures services start in the correct order:

1. **Supabase** (foundational - auth + database)
2. **Go Server** (needs Supabase for JWT validation)
3. **Next.js Client** (needs both services)

## Troubleshooting

### Port Already in Use
The startup script will automatically kill existing processes on required ports.

### Supabase Won't Start
```bash
# Reset Supabase
supabase stop
supabase start
```

### Go Server Build Errors
```bash
# Update Go modules
cd game-server
go mod tidy
go mod download
```

### Environment Variable Issues
- Ensure all `.env` files exist (copy from `.example` files)
- Check that values match between files (especially JWT secrets)
- Restart services after changing environment variables

## Production Notes

- Never commit actual `.env` files to git
- Use different secrets/keys in production
- Configure proper CORS origins for production domains
- Set up proper SSL certificates for WebSocket connections
