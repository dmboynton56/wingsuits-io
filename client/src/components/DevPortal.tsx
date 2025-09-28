'use client';

import { useState } from 'react';
import { AuthPanel } from './AuthPanel';
import { EventBusDemo } from './EventBusDemo';
import { ShardStatus } from './ShardStatus';
import { GameLayout } from './GameLayout';
import { useAuthStore, useProfileStore } from '@/store';

type DevView = 'portal' | 'auth' | 'eventbus' | 'shard' | 'game';

export function DevPortal() {
  const [currentView, setCurrentView] = useState<DevView>('portal');
  const { session } = useAuthStore();
  const { profile } = useProfileStore();

  // Navigation component
  const NavBar = () => (
    <nav className="bg-slate-800 border-b border-slate-700 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Wingsuits.io Dev Portal</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('portal')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentView === 'portal' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Portal
          </button>
          <button
            onClick={() => setCurrentView('auth')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentView === 'auth' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Auth Test
          </button>
          <button
            onClick={() => setCurrentView('eventbus')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentView === 'eventbus' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Event Bus
          </button>
          <button
            onClick={() => setCurrentView('shard')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentView === 'shard' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Shard Test
          </button>
          <button
            onClick={() => setCurrentView('game')}
            disabled={!session}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentView === 'game' 
                ? 'bg-green-600 text-white' 
                : session
                ? 'bg-green-700 text-white hover:bg-green-600' 
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            Enter Game
          </button>
        </div>
      </div>
    </nav>
  );

  // If in game view, show full game layout
  if (currentView === 'game') {
    return (
      <div className="h-screen flex flex-col">
        <NavBar />
        <div className="flex-1">
          <GameLayout />
        </div>
      </div>
    );
  }

  // Dev portal views
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <NavBar />
      
      <div className="p-6">
        {currentView === 'portal' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Development Portal</h2>
              <p className="text-slate-400">
                Test authentication, event systems, and game engine components
              </p>
            </div>

            {/* Quick Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Authentication</h3>
                {session ? (
                  <div className="space-y-1">
                    <p className="text-green-400 text-sm">✅ Signed In</p>
                    <p className="text-sm text-slate-300">{session.user.email}</p>
                  </div>
                ) : (
                  <p className="text-red-400 text-sm">❌ Not Signed In</p>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Profile</h3>
                {profile ? (
                  <div className="space-y-1">
                    <p className="text-green-400 text-sm">✅ Loaded</p>
                    <p className="text-sm text-slate-300">Level {profile.level} • {profile.xp} XP</p>
                  </div>
                ) : (
                  <p className="text-orange-400 text-sm">⚠️ No Profile</p>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Game Ready</h3>
                {session && profile ? (
                  <p className="text-green-400 text-sm">✅ Ready to Launch</p>
                ) : (
                  <p className="text-slate-400 text-sm">⏳ Complete auth first</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setCurrentView('auth')}
                  className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium"
                >
                  Test Authentication
                </button>
                <button
                  onClick={() => setCurrentView('eventbus')}
                  className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded text-sm font-medium"
                >
                  Test Event Bus
                </button>
                <button
                  onClick={() => setCurrentView('shard')}
                  className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded text-sm font-medium"
                >
                  Test WebSocket
                </button>
                <button
                  onClick={() => setCurrentView('game')}
                  disabled={!session}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    session 
                      ? 'bg-green-600 hover:bg-green-500' 
                      : 'bg-slate-600 cursor-not-allowed'
                  }`}
                >
                  Launch Game
                </button>
              </div>
            </div>

            {/* Development Notes */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Development Notes</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• <strong>Auth Test:</strong> Test login/logout, profile creation, session management</p>
                <p>• <strong>Event Bus:</strong> Test communication between React UI and Three.js engine</p>
                <p>• <strong>Shard Test:</strong> Test WebSocket connection to game server</p>
                <p>• <strong>Game Engine:</strong> Full Three.js world with flight physics and networking</p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'auth' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Authentication Testing</h2>
            <AuthPanel />
            {profile && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Profile Data</h3>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {currentView === 'eventbus' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">Event Bus Testing</h2>
            <EventBusDemo />
          </div>
        )}

        {currentView === 'shard' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">WebSocket Shard Testing</h2>
            <ShardStatus />
          </div>
        )}
      </div>
    </div>
  );
}





