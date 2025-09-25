'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

type AuthMode = 'sign_in' | 'sign_up';

export function AuthPanel() {
  const { session, loading } = useSupabaseSession();
  const [mode, setMode] = useState<AuthMode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (mode === 'sign_up') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setStatus('Check your email to confirm your account.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        setStatus('Signed in successfully.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error: googleError } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (googleError) {
      setError(googleError.message);
    }
  }

  async function handleGuest() {
    setError(null);
    setStatus(null);
    setIsSubmitting(true);
    try {
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      setStatus('Guest session started. Progress limited until you create an account.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setError(null);
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="rounded border border-slate-800 bg-slate-950/60 p-6">Loading session…</div>;
  }

  if (session) {
    return (
      <div className="space-y-3 rounded border border-slate-800 bg-slate-950/60 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Signed in</h3>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded bg-slate-800 px-3 py-1 text-sm font-medium text-slate-100 hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
        <dl className="space-y-1 text-sm text-slate-300">
          <div>
            <dt className="font-medium text-slate-200">User ID</dt>
            <dd className="font-mono">{session.user.id}</dd>
          </div>
          {session.user.email ? (
            <div>
              <dt className="font-medium text-slate-200">Email</dt>
              <dd>{session.user.email}</dd>
            </div>
          ) : null}
          {session.user.is_anonymous ? (
            <p className="text-amber-400">Guest account: progression limited until upgrade.</p>
          ) : null}
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border border-slate-800 bg-slate-950/60 p-6">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">
          {mode === 'sign_in' ? 'Sign in to continue' : 'Create an account'}
        </h3>
        <button
          type="button"
          onClick={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
          className="text-sm text-slate-400 hover:text-slate-200"
        >
          {mode === 'sign_in' ? 'Need an account?' : 'Have an account?'}
        </button>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-slate-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-slate-500 focus:outline-none"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-slate-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {isSubmitting ? 'Please wait…' : mode === 'sign_in' ? 'Sign in' : 'Sign up'}
        </button>
      </form>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          Continue with Google
        </button>
        <button
          type="button"
          onClick={handleGuest}
          className="w-full rounded border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800"
        >
          Play as Guest (tutorial only)
        </button>
      </div>

      {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}

