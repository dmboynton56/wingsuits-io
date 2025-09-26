import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/eventBus';

export interface AuthState {
  // State
  session: Session | null;
  user: User | null;
  loading: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    loading: true,

    signIn: async (email: string, password: string) => {
      set({ loading: true });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        set({ 
          session: data.session,
          user: data.user,
          loading: false 
        });
      } catch (error) {
        console.error('Sign in error:', error);
        set({ loading: false });
        throw error;
      }
    },

    signUp: async (email: string, password: string) => {
      set({ loading: true });
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        
        set({ 
          session: data.session,
          user: data.user,
          loading: false 
        });
      } catch (error) {
        console.error('Sign up error:', error);
        set({ loading: false });
        throw error;
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        set({ 
          session: null,
          user: null,
          loading: false 
        });
      } catch (error) {
        console.error('Sign out error:', error);
        set({ loading: false });
        throw error;
      }
    },

    refreshSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        set({ 
          session: data.session,
          user: data.session?.user ?? null,
          loading: false 
        });
      } catch (error) {
        console.error('Session refresh error:', error);
        set({ 
          session: null, 
          user: null, 
          loading: false 
        });
      }
    },
  }));

// Initialize auth state and set up auth listener
supabase.auth.getSession().then(() => {
  useAuthStore.getState().refreshSession();
});

supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
  useAuthStore.setState({
    session,
    user: session?.user ?? null,
    loading: false,
  });
});

// Subscribe to auth state changes and emit events for other parts of the app
let prevSession: Session | null = null;
useAuthStore.subscribe((state) => {
  const session = state.session;
  if (session && !prevSession) {
    // User just logged in
    eventBus.emit('ws:connected');
  } else if (!session && prevSession) {
    // User just logged out
    eventBus.emit('ws:disconnected');
  }
  prevSession = session;
});
