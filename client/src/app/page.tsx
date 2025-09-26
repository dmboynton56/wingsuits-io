import { ShardStatus } from '@/components/ShardStatus';
import { AuthPanel } from '@/components/AuthPanel';
import { EventBusDemo } from '@/components/EventBusDemo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <header className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-10">
        <h1 className="text-3xl font-bold">Wingsuits.io Dev Portal</h1>
        <p className="text-slate-300">
          Foundation architecture implemented: Zustand stores, event bus, and WebSocket routing ready for Three.js integration.
        </p>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          <AuthPanel />
          <ShardStatus />
        </div>
        
        <EventBusDemo />
        
        <section className="rounded border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="mb-3 text-xl font-semibold">Foundation Architecture ✅</h2>
          <ul className="list-disc space-y-2 pl-6 text-slate-300">
            <li>✅ Zustand stores for auth, profile, and shard state management</li>
            <li>✅ Event bus (mitt) for React ↔ Three.js communication</li>
            <li>✅ WebSocket routing with S2C message handling</li>
            <li>✅ Shared types integration for consistent interfaces</li>
          </ul>
          <h3 className="mt-4 mb-2 text-lg font-semibold">Next: Step 2 - Profile & Three.js Foundations</h3>
          <ul className="list-disc space-y-2 pl-6 text-slate-300">
            <li>Supabase profile helpers and auto-creation</li>
            <li>Basic Three.js scene with skybox and camera</li>
            <li>Profile UI displaying XP/level from Zustand</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
