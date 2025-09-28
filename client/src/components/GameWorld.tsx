'use client';

import { useEffect, useRef } from 'react';
import { WorldEngine } from '../game-engine/world';

/**
 * Minimal React wrapper that provides a canvas for the Three.js WorldEngine
 * Following CLIENT_DEVELOPMENT.md conventions:
 * - Keep Three.js decoupled from React
 * - Use lifecycle hooks to mount/unmount on a <canvas>
 * - Communication only via event bus
 */
export function GameWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Instantiate WorldEngine with raw canvas (no React coupling)
    engineRef.current = new WorldEngine(canvasRef.current);
    engineRef.current.start();

    // Cleanup on unmount
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-screen block"
      style={{ display: 'block' }}
    />
  );
}
