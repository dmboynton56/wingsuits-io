# Wingsuit.io - Game Plan & Technical Architecture

This document outlines the vision, core features, and technical architecture for "Wingsuit.io," a web-based, multiplayer wingsuit racing game.

---

## 1. Game Concept

### Vision
Deliver the adrenaline rush of high-speed wingsuit proximity flying inside a single, persistent, stylized world. Every player spawns into the same shard, hangs out in a social lodge, and launches races from physical locations in-world. Flight should be easy to pick up, brutally deep to master, and visibly celebrate dedication as players unlock new biomes.

### Core Gameplay Loop
The loop now lives entirely inside the shared shard:

1.  **Spawn at the Lodge:** Players materialize in the social hub, see other pilots, and check leaderboards or shops.
2.  **Plan & Queue:** They interact with map terminals to pick a route, party up, or explore the open world freely.
3.  **Teleport to Start:** A short hop moves the squad to the race’s physical starting pad somewhere in the world.
4.  **Fly the Course:** They dive through checkpoints while sharing airspace with free-fliers and other races.
5.  **Return & Socialize:** Finishers glide back to the lodge (or fast-travel there) to debrief, show off gear, or queue another run.
6.  **Progress & Unlock:** Credited XP unlocks new wingsuits plus access to higher-tier biomes like oceanside cliffs, volcanoes, and frozen peaks.

---

## 2. Core Features

-   **Persistent Shared World:** Everyone connects to the same generated landscape; races are routes within it, not isolated instances.
-   **Social Lodge Hub:** A walkable ski-resort-style plaza with leaderboards, party tools, and map terminals for launching events.
-   **Biome Progression:** Level-based gating unlocks new regions (alpine → oceanside → volcanic → arctic), visibly signaling player status.
-   **Skill-Based Flight Physics:** Responsive diving, flaring, and proximity mechanics that reward mastery across every biome.
-   **Procedural Terrain Streaming:** Chunked world streaming keeps the shard lightweight while preserving infinite replayability.
-   **Progression & Customization:** XP unlocks stat-varied wingsuits; cosmetics remain purely visual flex.

---

## 3. Technical Architecture

We will use a **hybrid architecture** that combines a Backend-as-a-Service (BaaS) for standard web features with a dedicated, custom server for real-time gameplay. This gives us the rapid development speed of a managed service and the high performance required for a real-time game.

### Component Breakdown

| Component                   | Technology Stack               | Primary Responsibilities                                                                                             |
| --------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Client Application** | Next.js, React, Three.js       | - Renders all UI (menus, HUD)<br>- Renders the 3D game world & physics<br>- Captures user input<br>- Communicates with both Supabase and the Go server |
| **Backend-as-a-Service** | Supabase (Postgres)            | - User Authentication (login, signup)<br>- Persistent Database (profiles, leaderboards, unlocks)<br>- Row Level Security (RLS) to protect data |
| **Real-time Game Server** | Go, WebSockets                 | - Manages active game lobbies<br>- Handles WebSocket connections<br>- Validates player auth tokens<br>- Broadcasts real-time player position data |

### How They Interact: The Data Flow

The client talks to Supabase for persistent progression data and maintains a long-lived WebSocket session with the Go server for shard presence, chunk streaming, and race coordination.



#### **Flow 1: Authentication & Profile Load**

1.  **Client -> Supabase:** A new player opens the web page. The client prompts them to log in or sign up via Supabase Auth UI.
2.  **Supabase -> Client:** On success, Supabase returns a secure **JWT (JSON Web Token)**.
3.  **Client -> Supabase:** Using the session, the client queries the `profiles` table to fetch XP, unlocked wingsuits, and highest unlocked biome. RLS policies guarantee scoped access.

#### **Flow 2: Session Boot & World Entry**

1.  **Client -> Go Server:** The launcher opens a persistent WebSocket connection to the Go world server.
2.  **Client -> Go Server:** The initial `auth` message carries the Supabase JWT for offline validation.
3.  **Go Server (Internal):** The server verifies the token using the shared secret, fetches cached profile metadata (level, unlocked biome), and registers the player into the shard.
4.  **Go Server -> Client:** The server acknowledges, assigns a spawn point (e.g., lodge plaza), and emits initial chunk load instructions for that region.

#### **Flow 3: Ongoing World Presence**

1.  **Client -> Go Server:** While walking or flying, the client streams state updates (position, rotation, movement mode) at a fixed tick rate.
2.  **Go Server (Internal):** Spatial partitioning (grid/quad-tree) keeps track of nearby entities and determines interest sets.
3.  **Go Server -> Client:** For each tick, the server sends differential world-state packets (nearby players, events) plus chunk stream directives (`load`, `unload`) as the pilot moves.
4.  **Client (Internal):** The Three.js engine updates or instantiates entities, streams terrain geometry, and dispatches UI events through the shared event bus.

#### **Flow 4: Race Lifecycle & Progression**

1.  **Client -> Go Server:** Interacting with a map terminal emits a `startRace` request; the server validates eligibility (level, cooldown) and locks in the squad.
2.  **Go Server (Internal):** The world server designates the race route within the shard and synchronizes countdown/timing events.
3.  **Client <-> Go Server:** During the race, updates flow as usual; checkpoints and finish triggers are validated server-side to prevent spoofing.
4.  **Client -> Supabase:** Post-race, clients call Supabase to persist XP, unlocked biomes, and leaderboard entries using secure mutations.
5.  **Supabase -> Client:** Updated profile data returns; UI reflects new levels or unlockable regions instantly.

---

## 4. Success Metrics & Acceptance Criteria (v1.0)

To consider the initial version "complete," the following criteria must be met:

-   **Complete Gameplay Loop:** A user can sign up, log in, join a multiplayer lobby, complete a full race from start to finish, and see their XP and level update correctly.
-   **Stable Performance:** The game must maintain a playable framerate (target 45+ FPS) on modern browsers and hardware.
-   **Server Scalability:** The Go server must support at least 5 concurrent 8-player lobbies without critical failures or unacceptable latency (>150ms).
-   **Core Authentication:** User profiles are persistent and securely managed through Supabase, with RLS policies preventing unauthorized data access.

---

## 5. Phased Development Roadmap

This roadmap outlines the key phases to get from project setup to a production-ready v1.

### Phase 1: Core Flight Racer MVP (Weeks 0-4)

-   [x] **Mono-repo & Tooling:** Initialize the workspace, configure shared types, linting, and CI checks.
-   [x] **Supabase Auth & Profiles:** Ship the baseline login flow plus XP/biome tracking (email/password + Google, shard handshake).
-   [ ] **Session State & Profile UI:** Persist auth session in Zustand, load Supabase profiles, display XP/unlocks.
-   [ ] **Instanced Races:** Build the original lobby-based race experience to perfect handling and checkpoint logic.

### Phase 2: Social Hub Integration (Weeks 4-8)

-   [ ] **Game Engine Prototype:** Stand up Three.js scene, basic wingsuit flight, and hook input loop to WebSocket updates.
-   [ ] **Lodge Environment:** Replace menu UI with a 3rd-person lodge scene, including avatar controller.
-   [ ] **Map Terminals:** Let players queue instanced races from physical kiosks; stub teleportation cutscenes.
-   [ ] **Social UX:** Add party formation, emotes, and live leaderboards in the hub.

### Phase 3: Seamless World Transition (Weeks 8-16)

-   [ ] **World Server Overhaul:** Transform the Go service into a persistent shard with spatial partitioning.
-   [ ] **Chunked Terrain Streaming:** Implement server-driven chunk loading/unloading and client-side LOD.
-   [ ] **Race-in-World:** Migrate races from instanced scenes to coordinates inside the shard; remove legacy lobbies.

### Phase 4: Progression & Biomes (Weeks 16-24)

-   [ ] **Biome Unlock System:** Gate access to oceanside, volcanic, and arctic regions by player level.
-   [ ] **Content Pipeline:** Create tooling to author race routes, POIs, and lodge upgrades per biome.
-   [ ] **Economy & Cosmetics:** Expand Supabase schema for cosmetics, vendors, and high-level rewards.

### Phase 5: Production Hardening (Ongoing)

-   [ ] **Load Testing & Interest Tuning:** Validate shard performance under simulated player counts.
-   [ ] **Deployment Pipelines:** Finalize Docker-based ops, observability, and rollback playbooks.
-   [ ] **Live Ops Toolkit:** Add admin dashboards for world events, biome rotations, and leaderboards.