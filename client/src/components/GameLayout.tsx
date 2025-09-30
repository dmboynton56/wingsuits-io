'use client';

import { GameWorld } from './GameWorld';
import { AuthPanel } from './AuthPanel';
import { ShardStatus } from './ShardStatus';
import { DebugOverlay } from './DebugOverlay';
import { useAuthStore, useProfileStore } from '@/store';

/**
 * Game layout with Three.js world and UI overlays
 * Follows our documented pattern of loose coupling via event bus
 */
export function GameLayout() {
  const { session } = useAuthStore();
  const { profile } = useProfileStore();

  // Show auth screen if not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full">
          <AuthPanel />
        </div>
      </div>
    );
  }

  // Show game world with UI overlay
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Three.js World (fullscreen) */}
      <GameWorld />
      
      {/* Debug Overlay (top left) */}
      <DebugOverlay />
      
      {/* UI Overlays (positioned absolutely) */}
      <div className="absolute top-4 right-4 space-y-4 z-10">
        <ShardStatus />
        {profile && (
          <div className="bg-black/50 rounded p-3 text-white text-sm">
            <p><strong>{profile.username}</strong></p>
            <p>Level {profile.level} • {profile.xp} XP</p>
            <p>Biome {profile.highestUnlockedBiome}</p>
          </div>
        )}
      </div>

      {/* Game Controls Help */}
      <div className="absolute bottom-4 left-4 bg-black/50 rounded p-3 text-white text-sm z-10 pointer-events-none">
        <p><strong>Controls:</strong></p>
        <p>Walk: W/S Forward/Back • A/D Turn • SHIFT Sprint • SPACE Jump</p>
        <p className="text-green-400">Glide: W Dive • S Flare • A/D Bank</p>
        <p className="text-cyan-400">Camera: Right Click + Drag to rotate view</p>
        <p className="text-purple-400">R - Reset to spawn point</p>
        <p className="text-xs text-yellow-400 mt-1">Sprint + Jump off cliff to glide!</p>
      </div>
    </div>
  );
}
