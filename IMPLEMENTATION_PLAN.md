# Implementation Plan & Working Agreements

This plan sequences the first six months of development toward the persistent shard vision and defines testing checkpoints.

---

## Guiding Principles

- **Flight First:** The feel of movement takes priority over content throughput.
- **Shard Stability:** Every feature must respect interest management constraints and profiling budgets.
- **Incremental Releases:** Ship playable slices each phase to validate assumptions with friends & early testers.
- **Shared Vocabulary:** Maintain protocol definitions in `/shared/types` and keep docs current with changes.

---

## Phase Breakdown

### Phase 0 – Repo Foundations
- **Deliverables:**
  - [x] Turborepo config, root linting/formatting, CI scaffolding.
  - [x] `client/` bootstrapped (Next.js, Tailwind, Zustand skeleton).
  - [x] `game-server/` Go module initialized with basic WebSocket echo.
  - [x] `/shared/types` package exporting protocol enums & DTOs.
- **Testing Checkpoints:**
  - [x] CI runs ESLint, Prettier check, `tsc --noEmit`, `go test ./...` on PRs.
  - [x] Manual smoke: client dev server renders placeholder lodge scene.
- ### Phase 1 – Core Flight MVP
- **Deliverables:**
  - [x] Supabase auth flow; `profiles` migration with RLS + seed data (email/password, Google OAuth, shard handshake).
  - [x] Session state store and profile UI (Zustand, profile fetch, XP display) - DevPortal component created.
  - [x] Event bus bridging React UI and Three.js engine - GameLayout/GameWorld components established.
  - [x] Basic Three.js game engine structure - /game-engine module scaffolded with Player capsule.
  - [ ] Local-only flight model, checkpoint logic, race timer.
  - [ ] Instanced race WebSocket loop (temporary lobby server).
- **Testing Checkpoints:**
  - [ ] Playwright/Node script validating login + shard authed state.
  - [ ] Unit tests for Supabase helpers and session store.
  - [ ] Load test stub: 8 simulated clients complete race via puppeteer/bot.
- ### Phase 2 – Social Lodge & Parties
- **Deliverables:**
  - [ ] Three.js lodge scene with navmesh and avatar animations.
  - [ ] Map terminal UI tied to instanced race queue.
  - [ ] Party system (invite, accept, launch race together).
  - [ ] Leaderboard displays pulling from Supabase `leaderboards` table.
- **Testing Checkpoints:**
  - [ ] Regression suite ensures race flow still works post-lodge.
  - [ ] Snapshot tests for map terminal UI states.
  - [ ] UX playtest with 5 users to evaluate social readability.
- ### Phase 3 – Persistent Shard Transition
- **Deliverables:**
  - World server upgraded to maintain persistent shard (spatial grid + interest management).
  - Chunk streaming pipeline (server chunk metadata + client LOD/asset loader).
  - Races embedded in world coordinates; removal of instanced lobby code.
  - Redis-backed pub/sub for shard metrics & admin commands.
- **Testing Checkpoints:**
  - Profiling run: 100 simulated pilots via load harness, target <35ms tick.
  - Network soak test: 2-hour session to confirm no memory leaks.
  - Automated verification that chunk load/unload events align with movement (integration test kit).
- ### Phase 4 – Biomes & Progression
- **Deliverables:**
  - Biome unlock system (Supabase `highest_unlocked_biome`, server-level gates).
  - Content pipeline for race routes and POIs per biome.
  - Cosmetic economy foundation (shop terminals, Supabase storage for assets).
- **Testing Checkpoints:**
  - Balance simulations verifying XP curves unlock biomes as expected.
  - Snapshot diffs for biome chunk authoring to prevent regression.
  - End-to-end quest: new account reaches volcano unlock under 4 hours of play.
- ### Phase 5 – Production Hardening
- **Deliverables:**
  - Observability dashboards, canary bots, maintenance tooling.
  - Live ops handbook (incident response, shard rotation playbook).
  - Closed alpha release with invite system and telemetry capture.
- **Testing Checkpoints:**
  - Chaos drills: terminate shard pod, confirm auto-recovery.
  - Security audit of Supabase policies & WebSocket auth handling.
  - Client benchmark across target hardware matrix (desktop + Steam Deck).
---

## Milestones: World Gen & Streaming

**W1 — Render Loop & Scaffolding**
- Scene/Camera/Renderer, fog, sun, sky in /game-engine/world.
- Placeholder Player (capsule), CameraRig (CHASE mode).
- ✅ Acceptance: 60 fps on flat ground; resize works; event bus emits basic updates.

**W2 — Chunking (No LOD)**
- ChunkManager loads/unloads 256m tiles (radius=3) via synchronous TerrainGenerator.
- ✅ Acceptance: Player movement streams tiles without stutter (local test).

**W3 — Workers & Determinism**
- Move TerrainGenerator to terrain.worker.ts (Transferables).
- Seeded noise; same tile → same heights.
- ✅ Acceptance: No hitching on chunk boundaries; determinism verified (regenerate tile).

**W4 — LOD + Seams**
- Near/Mid/Far per tile; skirts/stitching; hysteresis.
- ✅ Acceptance: Smooth LOD transitions; no cracks on fly-in/out.

**W5 — Materials & Biomes**
- Basic PBR + height/slope tints (grass/rock); instanced props.
- ✅ Acceptance: Coherent blends; <1k draw calls.

**W6 — Features (Rivers/Ravines/Volcano Stamps)**
- Worker-side carving/ridged noise; parametric stamps.
- ✅ Acceptance: One river/volcano per seed; ties to biome unlocks.

**W7 — Hooks for Server (Future)**
- Stubs for world/seed, chunk_request/meta (via WS/event bus).
- Local fallback if no server.
- ✅ Acceptance: Toggle local vs. seeded modes without breaking play.

(Integrate: W1-2 in Phase 1, W3-4 in Phase 2, W5-7 in Phases 3-4.)

---

## Cross-Cutting Workstreams

- **Tooling & Automation:**
  - Husky pre-commit hooks (lint, format, unit tests).
  - Turborepo pipelines to build shared types once, consume in client/server.
  - Supabase migration scripts run in CI against ephemeral databases.

- **Art & UX Collaboration:**
  - Maintain Miro board with biome references and race route sketches.
  - Sync each sprint with art for asset readiness vs. engine needs.

- **Player Feedback Loop:**
  - Notion page tracking tester feedback, categorized by severity.
  - Monthly playtest sessions; record and summarize actionable insights.

---

## Testing Strategy Overview

- **Unit:** Physics math, Supabase data mappers, protocol serializers/deserializers.
- **Integration:** WebSocket handshake, chunk streaming lifecycle, race event propagation.
- **End-to-End:** Automated pilots performing spawn → lodge → race → return loops.
- **Performance:** Continuous profiling harness run nightly against staging shard.
- **UX Validation:** Quarterly accessibility review and camera comfort testing for motion sickness.

---

## Definition of Done (Per Feature)

1. Feature toggled or configurable without redeploy.
2. Unit/integration tests passing in CI; manual QA notes logged.
3. Documentation updated (protocols, Supabase schema, ops playbooks).
4. Telemetry/checks integrated (logs, metrics, Sentry breadcrumbs).
5. Demo clip recorded and shared in sprint demo.

---

## Risk Register (Initial)

- **Performance Drift:** Mitigated via profiling gates and nightly load tests.
- **Content Bottleneck:** Addressed with reusable biome authoring tools and placeholder art policy.
- **Auth Dependencies:** Prepare Supabase outage fallback (cached JWT validation + limited offline mode).
- **Team Timezones:** Lean on async updates, record key meetings, and document decisions promptly.


