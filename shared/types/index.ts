export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
}

// Basic types
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type MovementMode = 'walking' | 'gliding';

// World gen types
export interface ChunkTile {
  x: number;
  z: number;
  lod: 'near' | 'mid' | 'far';
  hash?: string;
  biomeHint?: string;
}

export interface WorldSeedPayload {
  seed: number;
  chunkSize: number;
  lod: { near: number; mid: number; far: number };
}

// WebSocket message payloads
export interface ClientToServerMessage extends WebSocketMessage {
  type: 'C2S_AUTH' | 'C2S_PLAYER_UPDATE' | 'C2S_START_RACE' | 'C2S_WORLD_CHUNK_REQUEST' | 'C2S_WORLD_CHUNK_UNLOAD';
}

export interface ServerToClientMessage extends WebSocketMessage {
  type: 'S2C_AUTH_RESULT' | 'S2C_WORLD_CHUNK' | 'S2C_WORLD_STATE_UPDATE' | 'S2C_RACE_EVENT' | 'S2C_WORLD_SEED' | 'S2C_WORLD_CHUNK_META';
}
