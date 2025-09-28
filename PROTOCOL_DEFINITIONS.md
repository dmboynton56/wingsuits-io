# WebSocket Protocol Definitions

This document is the single source of truth for the WebSocket message schema used between the client and the Go game server.

***

## Base Message Structure

All messages, in both directions, will follow this basic structure:

    interface WebSocketMessage<T> {
      type: string;
      payload: T;
    }

***

## Client-to-Server (C2S) Messages

* **auth**: First message sent after connecting to authenticate the session.
    * **Type**: "C2S_AUTH"
    * **Payload**: `{ token: string; }
`
* **playerUpdate**: Streamed during flight or walking to update the player's state in the world.
    * **Type**: "C2S_PLAYER_UPDATE"
    * **Payload**: `{ position: { x, y, z }; rotation: { x, y, z, w }; mode: 'walking' | 'flying'; velocity?: { x, y, z }; }
`
* **startRace**: Emitted when a player activates a race terminal.
    * **Type**: "C2S_START_RACE"
    * **Payload**: `{ routeId: string; partyId?: string; }
`

***

## Server-to-Client (S2C) Messages

* **authResult**: Response to the client's auth message.
    * **Type**: "S2C_AUTH_RESULT"
    * **Payload**: `{ success: boolean; error?: string; spawnPoint?: { position: { x, y, z }; rotation: { x, y, z, w } }; }
`
* **worldChunk**: Instructs the client to load a specific terrain chunk.
    * **Type**: "S2C_WORLD_CHUNK"
    * **Payload**: `{ chunkId: string; bounds: { x: number; z: number; size: number }; dataUrl: string; }
`
* **worldStateUpdate**: Broadcast of nearby entities based on interest management.
    * **Type**: "S2C_WORLD_STATE_UPDATE"
    * **Payload**: `{ entities: { id: string; kind: 'player' | 'npc' | 'object'; position: { x, y, z }; rotation: { x, y, z, w }; mode?: 'walking' | 'flying'; velocity?: { x, y, z }; displayName?: string; }[]; timestamp: number; }
`
* **raceEvent**: Sends race-related state changes (countdown, checkpoints, completion) to participants.
    * **Type**: "S2C_RACE_EVENT"
    * **Payload**: `{ event: 'countdown' | 'checkpoint' | 'finish'; routeId: string; data?: { countdown?: number; checkpointIndex?: number; finishOrder?: { playerId: string; timeMs: number }[] }; }
`

## World/Chunk Streaming (Client ↔ Server)

**Purpose**: Enable deterministic streaming and interest management. Client gens geometry locally; server seeds/validates metadata. Active post-auth; local fallback for dev.

### Message Types

* **world/seed** (S2C, on auth):
  * Type: "S2C_WORLD_SEED"
  * Payload: `{ seed: number; chunkSize: number; lod: { near: number; mid: number; far: number } }`

* **world/chunk_request** (C2S):
  * Type: "C2S_WORLD_CHUNK_REQUEST"
  * Payload: `{ tiles: { x: number; z: number; lod: 'near' | 'mid' | 'far' }[] }`

* **world/chunk_meta** (S2C):
  * Type: "S2C_WORLD_CHUNK_META"
  * Payload: `{ tiles: { x: number; z: number; lod: string; hash: string; biomeHint?: string }[] }` (extends S2C_WORLD_CHUNK; no geometry)

* **world/chunk_unload** (C2S):
  * Type: "C2S_WORLD_CHUNK_UNLOAD"
  * Payload: `{ tiles: { x: number; z: number; lod: string }[] }`

* **player/pose** (C2S, extend C2S_PLAYER_UPDATE):
  * Add to payload: `{ ..., p: [number, number, number]; q: [number, number, number, number]; v?: [number, number, number] }` (for interest prefetch).

**Determinism Rule**: {seed, tileX, tileZ, lod} → identical geometry. Server samples vertices for hash validation (no meshes sent v1).

(Use /shared/types/world.ts for Tile/LOD interfaces.)