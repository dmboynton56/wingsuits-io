import { useShardStore } from '@/store';
import type { ClientToServerMessage } from '@wingsuits/shared';

type Options = {
  url?: string;
};

/**
 * Hook that provides shard connection state via Zustand store
 * @deprecated Use useShardStore directly for better performance
 */
export function useShardConnection(options: Options = {}) {
  const { connectionState, error, send, connect } = useShardStore();
  
  // Auto-connect with custom URL if provided
  if (options.url && connectionState === 'idle') {
    connect(options.url);
  }

  return { 
    state: connectionState, 
    error, 
    send: (message: ClientToServerMessage) => send(message)
  };
}
