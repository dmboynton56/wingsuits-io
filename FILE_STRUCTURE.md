/wingsuit-io
├── /client                     # Next.js frontend application
│   ├── /components             # Reusable React UI components (e.g., Button, Modal, LobbyCard)
│   ├── /game-engine            # Core Three.js logic (rendering, physics, world gen, controls)
│   ├── /lib                    # Helper libraries and services
│   │   └── supabase.ts         # Supabase client setup & data access functions (auth, profiles)
│   ├── /pages                  # Next.js page routes (e.g., index.tsx, /lobby, /game/[gameId].tsx)
│   ├── /public                 # Static assets (3D models, textures, fonts)
│   ├── /store                  # Client-side state management (e.g., Zustand)
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