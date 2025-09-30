'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '../lib/eventBus';

interface PlayerState {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  mode: 'walking' | 'gliding';
  velocity: { x: number; y: number; z: number };
}

/**
 * Debug overlay showing real-time player state
 * Following CLIENT_DEVELOPMENT.md: Uses event bus for React ↔ Three.js communication
 */
export function DebugOverlay() {
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [fps, setFps] = useState(0);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    // Listen to player state updates from game engine
    const handlePlayerUpdate = (state: PlayerState) => {
      setPlayerState(state);
    };

    eventBus.on('player:stateUpdate', handlePlayerUpdate);

    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    const fpsInterval = setInterval(() => {
      const now = performance.now();
      const delta = now - lastTime;
      const currentFps = Math.round((frameCount * 1000) / delta);
      setFps(currentFps);
      frameCount = 0;
      lastTime = now;
    }, 1000);

    const countFrame = () => {
      frameCount++;
      requestAnimationFrame(countFrame);
    };
    requestAnimationFrame(countFrame);

    // Track keyboard input for debug display
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => {
        if (!prev.includes(key)) {
          return [...prev, key];
        }
        return prev;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => prev.filter((k) => k !== key));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      eventBus.off('player:stateUpdate', handlePlayerUpdate);
      clearInterval(fpsInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (!playerState) {
    return (
      <div className="fixed top-4 left-4 bg-black/70 text-white p-4 rounded-lg font-mono text-sm">
        <div>Waiting for player data...</div>
      </div>
    );
  }

  const velocityMagnitude = Math.sqrt(
    playerState.velocity.x ** 2 +
      playerState.velocity.y ** 2 +
      playerState.velocity.z ** 2
  );

  return (
    <div className="fixed top-4 left-4 bg-black/70 text-white p-4 rounded-lg font-mono text-xs space-y-2 pointer-events-none select-none">
      <div className="text-green-400 font-bold text-sm mb-2">DEBUG OVERLAY</div>

      {/* FPS */}
      <div className="border-b border-gray-600 pb-2">
        <div className="text-yellow-400">FPS: {fps}</div>
      </div>

      {/* Player Mode */}
      <div className="border-b border-gray-600 pb-2">
        <div className="text-cyan-400">
          Mode:{' '}
          <span
            className={
              playerState.mode === 'gliding' ? 'text-green-400 font-bold' : 'text-blue-400'
            }
          >
            {playerState.mode.toUpperCase()}
          </span>
          {playerState.mode === 'gliding' && (
            <span className="text-xs text-yellow-400 ml-2 animate-pulse">
              ✈️ GLIDING!
            </span>
          )}
        </div>
      </div>

      {/* Position */}
      <div className="border-b border-gray-600 pb-2">
        <div className="text-gray-400 mb-1">Position:</div>
        <div className="pl-2">
          <div>X: {playerState.position.x.toFixed(2)}</div>
          <div>Y: {playerState.position.y.toFixed(2)}</div>
          <div>Z: {playerState.position.z.toFixed(2)}</div>
        </div>
      </div>

      {/* Velocity */}
      <div className="border-b border-gray-600 pb-2">
        <div className="text-gray-400 mb-1">Velocity:</div>
        <div className="pl-2">
          <div>X: {playerState.velocity.x.toFixed(2)}</div>
          <div>Y: {playerState.velocity.y.toFixed(2)}</div>
          <div>Z: {playerState.velocity.z.toFixed(2)}</div>
          <div className="text-yellow-400 mt-1">
            Speed: {velocityMagnitude.toFixed(2)} m/s
          </div>
        </div>
      </div>

      {/* Rotation (Quaternion) */}
      <div className="border-b border-gray-600 pb-2">
        <div className="text-gray-400 mb-1">Rotation:</div>
        <div className="pl-2 text-xs">
          <div>X: {playerState.rotation.x.toFixed(3)}</div>
          <div>Y: {playerState.rotation.y.toFixed(3)}</div>
          <div>Z: {playerState.rotation.z.toFixed(3)}</div>
          <div>W: {playerState.rotation.w.toFixed(3)}</div>
        </div>
      </div>

      {/* Active Keys */}
      <div>
        <div className="text-gray-400 mb-1">Active Keys:</div>
        <div className="pl-2">
          {activeKeys.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {activeKeys.map((key) => (
                <span
                  key={key}
                  className="bg-green-600 px-2 py-0.5 rounded text-xs"
                >
                  {key === ' ' ? 'SPACE' : key.toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">None</div>
          )}
        </div>
      </div>

      {/* Controls Reference */}
      <div className="border-t border-gray-600 pt-2 mt-2 text-xs text-gray-400">
        <div className="font-bold mb-1">Controls:</div>
        <div className="space-y-0.5 text-xs">
          <div className="text-yellow-400 font-bold mb-1">Walking:</div>
          <div>W/S - Forward/Back</div>
          <div>A/D - Turn</div>
          <div>SHIFT - Sprint</div>
          <div>SPACE - Jump</div>
          <div className="text-green-400 font-bold mt-2 mb-1">Gliding:</div>
          <div>W - Dive (speed up)</div>
          <div>S - Flare (slow down)</div>
          <div>A/D - Bank/Turn</div>
          <div className="text-xs text-gray-500 mt-1">
            Jump off cliff to auto-glide!
          </div>
        </div>
      </div>
    </div>
  );
}
