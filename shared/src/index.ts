export type Vector3 = { x: number; y: number; z: number };
export type Quaternion = { x: number; y: number; z: number; w: number };

export type MovementMode = 'walking' | 'flying';

export interface AuthMessage {
  type: 'C2S_AUTH';
  payload: { token: string };
}

export interface PlayerUpdateMessage {
  type: 'C2S_PLAYER_UPDATE';
  payload: {
    position: Vector3;
    rotation: Quaternion;
    mode: MovementMode;
    velocity?: Vector3;
  };
}

export interface StartRaceMessage {
  type: 'C2S_START_RACE';
  payload: { routeId: string; partyId?: string };
}

export interface AuthResultMessage {
  type: 'S2C_AUTH_RESULT';
  payload: {
    success: boolean;
    error?: string;
    spawnPoint?: { position: Vector3; rotation: Quaternion };
  };
}

export interface WorldChunkMessage {
  type: 'S2C_WORLD_CHUNK';
  payload: {
    chunkId: string;
    bounds: { x: number; z: number; size: number };
    dataUrl: string;
  };
}

export type EntityKind = 'player' | 'npc' | 'object';

export interface WorldStateUpdateMessage {
  type: 'S2C_WORLD_STATE_UPDATE';
  payload: {
    entities: Array<{
      id: string;
      kind: EntityKind;
      position: Vector3;
      rotation: Quaternion;
      mode?: MovementMode;
      velocity?: Vector3;
      displayName?: string;
    }>;
    timestamp: number;
  };
}

export type RaceEventType = 'countdown' | 'checkpoint' | 'finish';

export interface RaceEventMessage {
  type: 'S2C_RACE_EVENT';
  payload: {
    event: RaceEventType;
    routeId: string;
    data?: {
      countdown?: number;
      checkpointIndex?: number;
      finishOrder?: Array<{ playerId: string; timeMs: number }>;
    };
  };
}

export type ClientToServerMessage =
  | AuthMessage
  | PlayerUpdateMessage
  | StartRaceMessage;

export type ServerToClientMessage =
  | AuthResultMessage
  | WorldChunkMessage
  | WorldStateUpdateMessage
  | RaceEventMessage;
