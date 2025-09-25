'use client';

import { useShardConnection } from '@/hooks/useShardConnection';

export function ShardStatus() {
  const { state, error } = useShardConnection();

  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-200">
      <p className="font-semibold">Shard Connection</p>
      <p>Status: {state}</p>
      {error ? <p className="text-red-400">{error}</p> : null}
    </div>
  );
}
