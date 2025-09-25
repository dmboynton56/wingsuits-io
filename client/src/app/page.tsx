import { ShardStatus } from '@/components/ShardStatus';
import { AuthPanel } from '@/components/AuthPanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <header className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-10">
        <h1 className="text-3xl font-bold">Wingsuits.io Dev Portal</h1>
        <p className="text-slate-300">
          Early scaffolding for the shared shard. Auth, Supabase, and WebSocket layers plug in here.
        </p>
      </header>
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          <AuthPanel />
          <ShardStatus />
        </div>
        <section className="rounded border border-slate-800 bg-slate-950/60 p-6">
          <h2 className="mb-3 text-xl font-semibold">Next Steps</h2>
          <ul className="list-disc space-y-2 pl-6 text-slate-300">
            <li>Connect Supabase Auth to supply real JWTs for the shard handshake.</li>
            <li>Wire an event bus + Zustand store for world state updates.</li>
            <li>Prototype lodge scene and flight sandbox once networking stabilizes.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
