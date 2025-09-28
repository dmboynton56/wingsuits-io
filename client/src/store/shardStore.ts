import { create } from 'zustand';
import type { 
  ClientToServerMessage, 
  ServerToClientMessage,
  Vector3,
  Quaternion,
  MovementMode
} from '@wingsuits/shared';
import type { Session } from '@supabase/supabase-js';
import { eventBus } from '@/lib/eventBus';
import { useAuthStore } from './authStore';

export type ConnectionState = 'idle' | 'connecting' | 'authed' | 'error';

export interface ShardState {
  // Connection state
  connectionState: ConnectionState;
  error: string | null;
  lastPingMs: number;
  
  // World state
  spawnPoint: { position: Vector3; rotation: Quaternion } | null;
  playerState: {
    position: Vector3;
    rotation: Quaternion;
    mode: MovementMode;
    velocity?: Vector3;
  } | null;
  
  // WebSocket reference (internal)
  ws: WebSocket | null;
  
  // Actions
  connect: (url?: string) => void;
  disconnect: () => void;
  send: (message: ClientToServerMessage) => void;
  updatePlayerState: (state: {
    position: Vector3;
    rotation: Quaternion;
    mode: MovementMode;
    velocity?: Vector3;
  }) => void;
}

export const useShardStore = create<ShardState>((set, get) => ({
    connectionState: 'idle',
    error: null,
    lastPingMs: 0,
    spawnPoint: null,
    playerState: null,
    ws: null,

    connect: (url = process.env.NEXT_PUBLIC_GAME_SERVER_WS_URL ?? 'ws://localhost:8080/ws') => {
      // Ensure URL has /ws path
      if (url && !url.endsWith('/ws')) {
        url = url.endsWith('/') ? url + 'ws' : url + '/ws';
      }
      const currentWs = get().ws;
      if (currentWs) {
        currentWs.close();
      }

      set({ connectionState: 'connecting', error: null });

      const session = useAuthStore.getState().session;
      if (!session?.access_token) {
        set({ 
          connectionState: 'error', 
          error: 'No authentication session available' 
        });
        return;
      }

      const ws = new WebSocket(url);
      set({ ws });

      ws.onopen = () => {
        console.log('WebSocket connected, sending auth...');
        const authMessage: ClientToServerMessage = {
          type: 'C2S_AUTH',
          payload: { token: session.access_token },
        };
        ws.send(JSON.stringify(authMessage));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerToClientMessage;
          handleServerMessage(message);
        } catch (error) {
          console.error('Failed to parse server message:', error);
        }
      };

      ws.onerror = (event) => {
        const errorMsg = event.type || 'WebSocket connection error';
        console.error('WebSocket error:', errorMsg, event);
        set({ 
          connectionState: 'error', 
          error: errorMsg 
        });
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        set({ 
          connectionState: 'idle', 
          ws: null 
        });
        eventBus.emit('ws:disconnected');
      };
    },

    disconnect: () => {
      const ws = get().ws;
      if (ws) {
        ws.close();
        set({ ws: null, connectionState: 'idle' });
      }
    },

    send: (message: ClientToServerMessage) => {
      const ws = get().ws;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },

    updatePlayerState: (state: {
      position: Vector3;
      rotation: Quaternion;
      mode: MovementMode;
      velocity?: Vector3;
    }) => {
      set({ playerState: state });
      
      // Send update to server if connected
      const { send, connectionState } = get();
      if (connectionState === 'authed') {
        send({
          type: 'C2S_PLAYER_UPDATE',
          payload: state,
        });
      }
    },
  }));

// Handle incoming server messages
function handleServerMessage(message: ServerToClientMessage) {
  switch (message.type) {
    case 'S2C_AUTH_RESULT':
      if (message.payload.success) {
        useShardStore.setState({ 
          connectionState: 'authed',
          spawnPoint: message.payload.spawnPoint || null,
        });
        eventBus.emit('ws:authSuccess', { 
          spawnPoint: message.payload.spawnPoint 
        });
      } else {
        useShardStore.setState({ 
          connectionState: 'error',
          error: message.payload.error || 'Authentication failed',
        });
        eventBus.emit('ws:authFailed', { 
          error: message.payload.error || 'Authentication failed' 
        });
      }
      break;

    case 'S2C_WORLD_CHUNK':
      eventBus.emit('world:chunkLoaded', {
        chunkId: message.payload.chunkId,
        bounds: message.payload.bounds,
      });
      break;

    case 'S2C_WORLD_STATE_UPDATE':
      // Emit to game engine for rendering other players
      eventBus.emit('ws:message', { message });
      break;

    case 'S2C_RACE_EVENT':
      // Handle race events
      const { event, data } = message.payload;
      if (event === 'checkpoint' && data?.checkpointIndex !== undefined) {
        eventBus.emit('race:checkpoint', {
          index: data.checkpointIndex,
          routeId: message.payload.routeId,
        });
      } else if (event === 'finish' && data?.finishOrder) {
        const playerFinish = data.finishOrder[0]; // Assuming first is current player
        if (playerFinish) {
          eventBus.emit('race:finished', {
            timeMs: playerFinish.timeMs,
            routeId: message.payload.routeId,
          });
        }
      }
      break;
  }
}

// Auto-connect when auth session is available
let prevAuthSession: Session | null = null;
useAuthStore.subscribe((state) => {
  const session = state.session;
  if (session && !prevAuthSession) {
    // Auto-connect when user is authenticated
    const { connectionState } = useShardStore.getState();
    if (connectionState === 'idle') {
      useShardStore.getState().connect();
    }
  } else if (!session && prevAuthSession) {
    // Disconnect when user logs out
    useShardStore.getState().disconnect();
  }
  prevAuthSession = session;
});

// Listen to game engine events
eventBus.on('race:start', (data: { routeId: string; partyId?: string }) => {
  useShardStore.getState().send({
    type: 'C2S_START_RACE',
    payload: data,
  });
});

eventBus.on('player:stateUpdate', (state: {
  position: Vector3;
  rotation: Quaternion;
  mode: MovementMode;
  velocity?: Vector3;
}) => {
  useShardStore.getState().updatePlayerState(state);
});
