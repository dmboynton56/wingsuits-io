# Operations & Deployment Guide

This document covers the process for running the application locally and deploying it to production.

### 1. Local Development Environment

We standardize local setup through **Docker Compose**, but individual services can also run directly for faster iteration.

-   **`docker-compose.yml`** (root): Defines the minimum stack for a shard-capable dev environment.
-   **Services:**
    1.  `world-server`: Builds and runs the Go shard server, exposing the WebSocket port (`:8080`). Mounts the code directory for live reload via `air`.
    2.  `client`: Installs deps and runs `npm run dev` for the Next.js + Three.js front end on `:3000`.
    3.  `supabase`: Uses Supabase CLI containers (auth, postgres, storage) for local auth/DB parity.
    4.  `redis` (optional): Provides pub/sub for future cross-shard coordination and analytics buffering.
-   **Bootstrap Steps:**
    1.  `npm install` at repo root (sets up Turborepo scripts once added).
    2.  `npm install` inside `client/` if running outside Compose.
    3.  `docker compose up --build` (or `docker compose up client world-server supabase`) to boot the full stack.
    4.  Supabase migrations apply via `supabase db reset --linked` before first run.
-   **Environment Files:**
    -   Root `.env` for shared settings (e.g., Supabase project ref, WebSocket URLs).
    -   `client/.env.local` for browser-safe vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_WORLD_WS_URL`).
    -   `game-server/.env` for server-side secrets (`SUPABASE_JWT_SECRET`, chunk seed overrides).

### 2. Runtime Environments

-   **Development:** Single persistent shard, hot reload, open metrics. Can run with fake auth tokens using Supabase service key.
-   **Staging:** Mirrors production infra with reduced player caps. Used for load-testing chunk streaming and race orchestration.
-   **Production:** Auto-scaling shards behind a global TCP/WS load balancer. Sticky sessions ensure pilots remain on the same shard unless kicked.

### 3. Deployment

The client and world server deploy independently but share release cadence.

-   **Client (Next.js):**
    -   **Provider**: Vercel.
    -   **Process**: GitHub integration triggers preview deployments on PRs and production deploys on `main`. Uses pnpm in CI once Turborepo lands.
    -   **Config:** Promote `client/.env.production` vars into Vercel dashboard, including Supabase anon key and world WebSocket URL.

-   **World Server (Go):**
    -   **Provider**: Fly.io or Render (Fly favored for UDP/WebSocket performance and regional scaling).
    -   **Pipeline:**
        1.  `go test ./...` & static analysis (`golangci-lint`).
        2.  Build static binary (`CGO_ENABLED=0`) and multi-arch Docker image.
        3.  Push image to registry (`ghcr.io/wingsuits-io/world-server`).
        4.  Deploy with Fly release commands; enable blue/green to avoid disconnecting shards.
    -   **Secrets:** Supabase JWT secret, chunk seed, telemetry API keys managed via provider secrets.

-   **Supabase:**
    -   Migrations pushed via GitHub Actions using Supabase CLI.
    -   Post-deploy hooks run smoke tests (`supabase db reset --env staging` + integration suite).

### 4. Scaling & World Management

-   **Shard Strategy:** Begin with a single shard; introduce additional shards once concurrency >150 pilots. Use Redis pub/sub for global chat and cross-shard presence.
-   **Interest Radius Tuning:** Default to 2 chunk radius (~2km). Ops can change via runtime config; expose an admin API for emergency adjustments.
-   **Hotfixes:** Maintain `maintenance_mode` flag in Supabase to disable new logins. Clients display lodge maintenance messaging and retry automatically.
-   **Backups:** Daily Supabase backups retained 30 days. World server stateless; redeploy by replacing containers.

### 5. Monitoring & Alerting

-   **Logging:** Structured JSON logs from both services. Ship to provider log drains plus a central ELK/Sumo stack. Include `playerId`, `shardId`, `chunkId` tags.
-   **Metrics:**
    -   Client: WebVitals + custom telemetry (chunk load latency, frame rate) via Vercel Analytics or Segment.
    -   World server: Prometheus endpoints (tick duration, outbound bandwidth, active entities). Grafana dashboards visualize interest grid health.
-   **Error Tracking:** Sentry for client + server, correlated using shared trace IDs. Alert thresholds: >2% auth failures over 5 min, >5% chunk load errors, average tick >40ms.
-   **Synthetic Tests:** Scheduled canary bots connect hourly, fly scripted routes, and report success via PagerDuty.

## World Gen: Dev Toggles & Perf

Environment (client/.env.local):
```
WORLD_CHUNK_SIZE=256
WORLD_RADIUS=3
WORLD_LOD_NEAR=257
WORLD_LOD_MID=129
WORLD_LOD_FAR=65
WORLD_WORKERS=3
WORLD_SEED=12345
WORLD_DEBUG_OVERLAY=true
```

Tips:
- Start radius=2; raise to 3-4 post-profiling.
- Shared MeshStandardMaterial; no per-tile clones.
- InstancedMesh for props; target <1k draw calls.
- Far travel: Enable floating origin (rebase scene around player pos).
- Test in full stack: Local chunks load sans WS; seeded via Go server.