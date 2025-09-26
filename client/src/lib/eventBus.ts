import mitt from 'mitt';
import type { 
  Vector3, 
  Quaternion, 
  MovementMode,
  ServerToClientMessage
} from '@wingsuits/shared';

// Event types for React ↔ Three.js communication
export type GameEvents = Record<string, unknown> & {
  // React → Three.js Engine Commands
  'engine:start': undefined;
  'engine:stop': undefined;
  'race:start': { routeId: string; partyId?: string };
  'player:teleport': { position: Vector3; rotation?: Quaternion };
  'world:requestChunk': { chunkId: string };
  'flight:setMode': { mode: MovementMode };
  
  // Three.js Engine → React Updates
  'world:chunkLoaded': { chunkId: string; bounds: { x: number; z: number; size: number } };
  'player:stateUpdate': { 
    position: Vector3; 
    rotation: Quaternion; 
    mode: MovementMode;
    velocity?: Vector3;
  };
  'race:checkpoint': { index: number; routeId: string };
  'race:finished': { timeMs: number; routeId: string };
  
  // WebSocket → Store Events
  'ws:message': { message: ServerToClientMessage };
  'ws:connected': undefined;
  'ws:disconnected': undefined;
  'ws:authSuccess': { spawnPoint?: { position: Vector3; rotation: Quaternion } };
  'ws:authFailed': { error: string };
  
  // Store → UI Events
  'profile:updated': { xp: number; level: number; highestUnlockedBiome: number };
  'leaderboard:updated': undefined;
};

// Create and export the global event bus
export const eventBus = mitt<GameEvents>();

// Helper function for type-safe event emission
export function emit<K extends keyof GameEvents>(
  event: K,
  ...args: GameEvents[K] extends undefined ? [] : [GameEvents[K]]
): void {
  if (args.length > 0) {
    eventBus.emit(event, args[0] as GameEvents[K]);
  } else {
    eventBus.emit(event, undefined as GameEvents[K]);
  }
}

// Helper for type-safe event listening
export function on<K extends keyof GameEvents>(
  event: K,
  handler: (data: GameEvents[K]) => void
): void {
  eventBus.on(event, handler);
}

// Helper for type-safe event cleanup
export function off<K extends keyof GameEvents>(
  event: K,
  handler: (data: GameEvents[K]) => void
): void {
  eventBus.off(event, handler);
}
