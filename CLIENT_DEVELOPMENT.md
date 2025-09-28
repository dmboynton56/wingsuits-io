# Frontend Development Guide (Client)

This document outlines the architecture, standards, and best practices for the `wingsuit-io` client application.

### 1. Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **3D Rendering**: [Three.js](https://threejs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for general-purpose styling and layout.
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/). We will use these unstyled, accessible components for building our UI (buttons, dialogs, forms) to accelerate development. They are fully customizable with Tailwind CSS.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for simple, global state.

### 2. Architecture Overview

- **`/pages`**: Handles routing, marketing content, and initial data hydration.
- **`/components`**: Reusable UI elements. Components from `shadcn/ui` live here alongside lodge widgets.
- **`/game-engine`**: Houses all Three.js logic: flight physics, world chunk streaming, LOD, and the 3rd-person lodge controller. Keep it decoupled from React; expose lifecycle hooks to mount/unmount on a `<canvas>`.
- **`/store`**: Zustand stores for auth session, profile progression (XP, unlocked biomes), shard connection status, and party membership.
- **`/lib/supabase.ts`**: **The single source of truth for Supabase interactions.** Initializes the client and exports typed operations (`signIn()`, `getUserProfile()`, `updateUnlockedBiome()`, `listLeaderboards()`). No other file should instantiate Supabase directly.

### 3. Key Development Habits

- **Simplicity First**: Components should be simple and focused. Avoid creating monolithic components.
- **Props over State**: Favor passing props down over creating complex local state. Use the global Zustand store only for truly global data.
- **Environment Variables**: All sensitive keys (especially the Supabase URL and anon key) **must** be stored in `.env.local` and accessed via `process.env`.
- **Game Engine Separation**: The React UI should only tell the game engine *what* to do (e.g., "start game," "player is in lobby"). The game engine handles the *how* (rendering the world, updating physics).

### 4. Developer Experience (DX) & Tooling

To ensure code quality and consistency, we will use the following tools:
-   **Linting**: [ESLint](https://eslint.org/) with a strict configuration (e.g., `eslint-config-airbnb-typescript`).
-   **Formatting**: [Prettier](https://prettier.io/) for automatic code formatting.
-   **Pre-commit Hooks**: [Husky](https://typicode.github.io/husky/) will be used to run linting and formatting checks before any code is committed, preventing errors from entering the codebase.

### 5. React <-> Three.js Communication

The React UI (menus, HUD, social widgets) and the Three.js engine (flight, chunk streaming) stay loosely coupled via an **event bus**.

- **Pattern:**
    1.  Instantiate a lightweight emitter (`tiny-emitter`, `mitt`) shared between layers.
    2.  **React → Engine:** UI components emit commands such as `eventBus.emit('race:start', { routeId })`, `eventBus.emit('player:teleport', { position })`, or `eventBus.emit('world:requestChunk', { chunkId })`.
    3.  **Engine → React:** The engine broadcasts updates like `eventBus.emit('world:chunkLoaded', { chunkId })`, `eventBus.emit('player:state', { mode: 'flying' })`, `eventBus.emit('race:checkpoint', { index })` to keep HUD and social UI synchronized.

Leaning on events prevents prop drilling and keeps transient game data out of React state.

## World Generation & Rendering (Three.js)

### Goal
Provide a deterministic, chunked, high-performance world that streams around the player and supports multiple camera modes, with room to evolve into biomes, rivers/ravines, and special features (e.g., volcano stamps).

### Tech
- **Three.js** for rendering (scene/camera/lights/materials).
- **Web Workers** for off-main-thread terrain generation (typed arrays).

### Core Concepts
- **Chunks**: Square tiles in world space (e.g., 256m×256m). Load tiles near the player; unload distant ones.
- **LOD** (Level of Detail): Near = high-res mesh; far = low-res. Skirts or stitching hide seams.
- **Determinism**: Seed + integer tile coords + LOD produce identical geometry (client/server parity).

### Module Layout (/game-engine)
```
/game-engine/
  world/
    index.ts              // bootstrap (Scene, Renderer, loop, Fog, Lights)
    CameraRig.ts          // chase / FPV / cinematic
    ChunkManager.ts       // loads/unloads tiles; LOD & hysteresis
    TerrainGenerator.ts   // noise stack, domain warp, ridged noise hooks
    Materials.ts          // shared PBR materials, tri-planar/splat shaders later
    SkyDome.ts            // sky model & sun light bindings
    Player.ts             // placeholder capsule; later glTF wingsuit
  workers/
    terrain.worker.ts     // CPU heightfield + geometry indices/normals
```

### Bootstrap (High Level)
1. Create `<canvas>`; init `Scene`, `PerspectiveCamera`, `WebGLRenderer` (sRGB + ACES tone mapping).
2. Add lighting: Hemisphere + Directional (sun). Set fog + clear color.
3. Instantiate `Player`, `CameraRig`, `ChunkManager`.
4. In loop: Update player + camera; `ChunkManager.update(player.position)`; render.
Emit updates via event bus (e.g., `world:chunkLoaded` for UI sync).

### Terrain Generation (v1 → v2)
- **v1**: fBm noise + mild domain warp. Output positions/normals/indices.
- **v2**: Ridged noise for mountains, tri-planar/splat materials, worker-side river carving.

### Camera Modes
- **CHASE** (default): Damped spring behind player; FOV ~75.
- **FPV**: At player's "helmet"; subtle roll.
- **CINEMATIC**: Pulled back, FOV ~60 for replays.

### Performance Switches (Dev)
- `WORLD_CHUNK_SIZE=256`, `WORLD_RADIUS=3`, `WORLD_LOD_NEAR=257|MID=129|FAR=65`.
- `WORLD_WORKERS=2..4` (pool size).
- Debug: Chunk bounds, LOD rings (tie to event bus for overlay).