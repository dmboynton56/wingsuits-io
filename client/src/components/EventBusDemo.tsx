'use client';

import { useState, useEffect } from 'react';
import { emit, on, off } from '@/lib/eventBus';

export function EventBusDemo() {
  const [lastEvent, setLastEvent] = useState<string>('None');
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Listen to various event bus events
    const handlePlayerUpdate = (data: {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
      mode: 'walking' | 'flying';
      velocity?: { x: number; y: number; z: number };
    }) => {
      setLastEvent(`Player Update: ${JSON.stringify(data.position)}`);
      setPlayerPosition(data.position);
    };

    const handleRaceEvent = (data: { routeId: string; partyId?: string }) => {
      setLastEvent(`Race Event: ${data.routeId}`);
    };

    const handleWSEvent = () => {
      setLastEvent('WebSocket Connected');
    };

    on('player:stateUpdate', handlePlayerUpdate);
    on('race:start', handleRaceEvent);
    on('ws:connected', handleWSEvent);

    return () => {
      off('player:stateUpdate', handlePlayerUpdate);
      off('race:start', handleRaceEvent);
      off('ws:connected', handleWSEvent);
    };
  }, []);

  const testEvents = () => {
    // Test different event types
    emit('player:stateUpdate', {
      position: { 
        x: Math.random() * 100, 
        y: Math.random() * 100, 
        z: Math.random() * 100 
      },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      mode: 'flying' as const,
    });
  };

  const testRaceStart = () => {
    emit('race:start', {
      routeId: `route_${Date.now()}`,
      partyId: 'demo_party'
    });
  };

  return (
    <div className="rounded border border-blue-700 bg-blue-950/60 p-4 space-y-3">
      <h3 className="text-lg font-semibold text-blue-100">Event Bus Demo</h3>
      
      <div className="space-y-2 text-sm">
        <p><span className="font-medium">Last Event:</span> {lastEvent}</p>
        <p><span className="font-medium">Player Position:</span> x:{playerPosition.x.toFixed(1)} y:{playerPosition.y.toFixed(1)} z:{playerPosition.z.toFixed(1)}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={testEvents}
          className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-500"
        >
          Simulate Player Update
        </button>
        <button
          onClick={testRaceStart}
          className="rounded bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-500"
        >
          Simulate Race Start
        </button>
      </div>

      <p className="text-xs text-blue-300">
        This demonstrates the event bus communication system between React UI and the future Three.js engine.
      </p>
    </div>
  );
}
