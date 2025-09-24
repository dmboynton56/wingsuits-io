# Real-time Development Guide (Game Server)

This document outlines the architecture and purpose of the Go-based real-time game server.

### 1. Technology Stack

-   **Language**: [Go](https://go.dev/)
-   **WebSockets**: [gorilla/websocket](https://github.com/gorilla/websocket) library.
-   **JWT Validation**: [golang-jwt/jwt](https://github.com/golang-jwt/jwt) for validating Supabase auth tokens.

### 2. Core Responsibilities (And What It DOES NOT Do)

This service now orchestrates a **persistent shared shard** instead of short-lived race lobbies.

-   **It DOES:**
    -   Handle WebSocket connections for the entire player session.
    -   Authenticate players via a Supabase JWT and maintain presence state.
    -   Manage a global world model: player entities, race routes, interactive kiosks.
    -   Partition the world spatially (grid/quad-tree) and run interest management so clients only receive nearby updates.
    -   Stream chunk metadata (terrain seeds, prop placements) to clients on demand.
    -   Coordinate race events inside the shard: countdowns, checkpoint validation, finish logic.
    -   Perform authoritative anti-cheat checks (speed caps, checkpoint order, no-clip detection).

-   **It DOES NOT:**
    -   Connect to the PostgreSQL database.
    -   Handle user login or registration flows.
    -   Persist long-term data (XP, unlocks) — that remains Supabase’s domain.
    -   Serve general HTTP traffic beyond the WebSocket upgrade endpoint.

### 3. Authentication Flow

1.  **Client**: User logs in via the Next.js app using Supabase Auth.
2.  **Client**: The client gets a JWT (JSON Web Token) from Supabase.
3.  **Client**: The client opens a WebSocket connection to this Go server.
4.  **Client**: The client sends a single `{"type": "auth", "payload": {"token": "..."}}` message with the JWT.
5.  **Server**: The Go server uses the Supabase JWT secret (stored as an environment variable) to validate the token.
6.  **Server**: If the token is valid, the player's connection is moved to a lobby. If invalid, the connection is terminated.

### 4. Communication Protocol

-   All communication is done via JSON messages.
-   Every message **must** conform to the `WebSocketMessage` interface defined in the `/shared/types` directory.
-   This ensures the client and server are always in sync on the data structures being sent back and forth.