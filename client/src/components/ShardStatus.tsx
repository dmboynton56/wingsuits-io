'use client';

import { useShardStore, useProfileStore } from '@/store';

export function ShardStatus() {
  const { connectionState, error, lastPingMs } = useShardStore();
  const { profile } = useProfileStore();

  return (
    <div className="rounded border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-neutral-200">
      <p className="font-semibold">Shard Connection</p>
      <p>Status: {connectionState}</p>
      {lastPingMs > 0 && <p>Ping: {lastPingMs}ms</p>}
      {profile && (
        <div className="mt-2 space-y-1">
          <p className="font-medium">{profile.username}</p>
          <p>Level {profile.level} • {profile.xp} XP</p>
          <p>Biome {profile.highestUnlockedBiome}</p>
        </div>
      )}
      {error ? <p className="text-red-400">{error}</p> : null}
    </div>
  );
}
