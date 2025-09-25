type Vector3 = {
    x: number;
    y: number;
    z: number;
};
type Quaternion = {
    x: number;
    y: number;
    z: number;
    w: number;
};
type MovementMode = 'walking' | 'flying';
interface AuthMessage {
    type: 'C2S_AUTH';
    payload: {
        token: string;
    };
}
interface PlayerUpdateMessage {
    type: 'C2S_PLAYER_UPDATE';
    payload: {
        position: Vector3;
        rotation: Quaternion;
        mode: MovementMode;
        velocity?: Vector3;
    };
}
interface StartRaceMessage {
    type: 'C2S_START_RACE';
    payload: {
        routeId: string;
        partyId?: string;
    };
}
interface AuthResultMessage {
    type: 'S2C_AUTH_RESULT';
    payload: {
        success: boolean;
        error?: string;
        spawnPoint?: {
            position: Vector3;
            rotation: Quaternion;
        };
    };
}
interface WorldChunkMessage {
    type: 'S2C_WORLD_CHUNK';
    payload: {
        chunkId: string;
        bounds: {
            x: number;
            z: number;
            size: number;
        };
        dataUrl: string;
    };
}
type EntityKind = 'player' | 'npc' | 'object';
interface WorldStateUpdateMessage {
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
type RaceEventType = 'countdown' | 'checkpoint' | 'finish';
interface RaceEventMessage {
    type: 'S2C_RACE_EVENT';
    payload: {
        event: RaceEventType;
        routeId: string;
        data?: {
            countdown?: number;
            checkpointIndex?: number;
            finishOrder?: Array<{
                playerId: string;
                timeMs: number;
            }>;
        };
    };
}
type ClientToServerMessage = AuthMessage | PlayerUpdateMessage | StartRaceMessage;
type ServerToClientMessage = AuthResultMessage | WorldChunkMessage | WorldStateUpdateMessage | RaceEventMessage;

export type { AuthMessage, AuthResultMessage, ClientToServerMessage, EntityKind, MovementMode, PlayerUpdateMessage, Quaternion, RaceEventMessage, RaceEventType, ServerToClientMessage, StartRaceMessage, Vector3, WorldChunkMessage, WorldStateUpdateMessage };
