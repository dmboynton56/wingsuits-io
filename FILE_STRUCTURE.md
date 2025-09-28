/wingsuit-io
├── /client                     # Next.js frontend application
│   ├── /src                    # Source code organization (modern Next.js convention)
│   │   ├── /app                # Next.js App Router (13+) - pages and layouts
│   │   ├── /components         # Reusable React UI components (e.g., Button, Modal, LobbyCard)
│   │   ├── /hooks              # Custom React hooks for shared logic
│   │   ├── /lib                # Helper libraries and services
│   │   │   └── supabase.ts     # Supabase client setup & data access functions (auth, profiles)
│   │   └── /store              # Client-side state management (Zustand stores)
│   ├── /game-engine            # Core Three.js logic (rendering, physics, world gen, controls)
│   ├── /public                 # Static assets (3D models, textures, fonts)
│   ├── /e2e                    # End-to-end tests (Playwright)
│   ├── tsconfig.json
│   └── ... (other Next.js config files)
│
├── /game-server                # Dedicated Go WebSocket server for real-time gameplay
│   ├── /game                   # Core game logic: lobbies, rooms, player state
│   ├── /websocket              # WebSocket connection handling, message broadcasting
│   ├── go.mod
│   └── main.go                 # Server entry point
│
├── /shared                     # TypeScript code shared between client and game-server
│   ├── /types                  # Shared interfaces (e.g., PlayerState, Vector3, WebSocketMessage)
│   └── package.json            # Defines this directory as a shared local package
│
├── .gitignore
├── package.json                # Root package.json for monorepo tooling (e.g., Turborepo)
└── README.md                   # Project overview

## World/Client Additions

```
client/
  game-engine/
    world/
      index.ts
      CameraRig.ts
      ChunkManager.ts
      TerrainGenerator.ts
      Materials.ts
      SkyDome.ts
      Player.ts
    workers/
      terrain.worker.ts
  public/assets/
    wingsuit.glb          # placeholder player model (replace later)
    textures/             # optional: atlases, KTX2, normal maps
shared/
  types/
    world.ts              # interfaces for chunks, seeds, LOD (extend WebSocketMessage)
```

**Notes**
- Materials.ts exports shared instances to minimize draw calls.
- Workers bundled via Next.js (URL import in TS).
- Stub assets with primitives initially; use /shared/types for determinism (e.g., ChunkTile {x, z, lod}).