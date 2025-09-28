export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
}

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

// Existing types (e.g., PlayerState) remain
