'use client';

import { useAuthStore } from '@/store';

/**
 * Hook that provides Supabase session state via Zustand store
 * @deprecated Use useAuthStore directly for better performance
 */
export function useSupabaseSession() {
  const { session, loading } = useAuthStore();
  return { session, loading };
}

