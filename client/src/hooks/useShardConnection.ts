import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  ClientToServerMessage,
  ServerToClientMessage,
} from '@wingsuits/shared';
import { supabase } from '@/lib/supabase';

type ConnectionState = 'idle' | 'connecting' | 'authed' | 'error';

type Options = {
  url?: string;
};

export function useShardConnection(options: Options = {}) {
  const url = options.url ?? process.env.NEXT_PUBLIC_WORLD_WS_URL ?? 'ws://localhost:8080/ws';
  const socketRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);

  const send = useCallback((message: ClientToServerMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      setState('connecting');
      setError(null);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) {
        setState('error');
        setError('No Supabase session');
        return;
      }

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) {
          socket.close();
          return;
        }
        const authMessage: ClientToServerMessage = {
          type: 'C2S_AUTH',
          payload: { token },
        };
        socket.send(JSON.stringify(authMessage));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data.toString()) as ServerToClientMessage;
          if (message.type === 'S2C_AUTH_RESULT') {
            setState(message.payload.success ? 'authed' : 'error');
            if (!message.payload.success) {
              setError(message.payload.error ?? 'Auth rejected');
            }
          }
          // Future: dispatch to Zustand/event bus for other message types.
        } catch (err) {
          console.error('Failed to parse server message', err);
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error', event);
        if (!cancelled) {
          setState('error');
          setError('WebSocket error');
        }
      };

      socket.onclose = () => {
        if (!cancelled) {
          setState((prev) => (prev === 'authed' ? 'idle' : prev));
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
  }, [url]);

  return { state, error, send };
}
