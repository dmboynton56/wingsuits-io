import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/eventBus';
import { useAuthStore } from './authStore';

export interface Profile {
  id: string;
  username: string;
  xp: number;
  level: number;
  highestUnlockedBiome: number;
  updatedAt: string;
}

export interface Wingsuit {
  id: number;
  name: string;
  speedStat: number;
  maneuverabilityStat: number;
  glideStat: number;
  unlockLevel: number;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  raceSeed: string;
  finishTimeMs: number;
  createdAt: string;
  profile: {
    username: string;
  };
}

export interface ProfileState {
  // State
  profile: Profile | null;
  wingsuits: Wingsuit[];
  leaderboards: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'username' | 'xp' | 'level' | 'highestUnlockedBiome'>>) => Promise<void>;
  fetchWingsuits: () => Promise<void>;
  fetchLeaderboards: (limit?: number) => Promise<void>;
  submitRaceTime: (raceSeed: string, finishTimeMs: number) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
    profile: null,
    wingsuits: [],
    leaderboards: [],
    loading: false,
    error: null,

    fetchProfile: async () => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // If profile doesn't exist, create it
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: user.email?.split('@')[0] ?? `user_${user.id.slice(0, 8)}`,
                xp: 0,
                level: 1,
                highest_unlocked_biome: 1,
              })
              .select()
              .single();

            if (createError) throw createError;
            set({ 
              profile: {
                id: newProfile.id,
                username: newProfile.username,
                xp: newProfile.xp,
                level: newProfile.level,
                highestUnlockedBiome: newProfile.highest_unlocked_biome,
                updatedAt: newProfile.updated_at,
              },
              loading: false 
            });
            return;
          }
          throw error;
        }

        set({ 
          profile: {
            id: data.id,
            username: data.username,
            xp: data.xp,
            level: data.level,
            highestUnlockedBiome: data.highest_unlocked_biome,
            updatedAt: data.updated_at,
          },
          loading: false 
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch profile',
          loading: false 
        });
      }
    },

    updateProfile: async (updates: Partial<Pick<Profile, 'username' | 'xp' | 'level' | 'highestUnlockedBiome'>>) => {
      const profile = get().profile;
      if (!profile) return;

      set({ loading: true, error: null });
      try {
        const updateData: Record<string, string | number> = {};
        if (updates.username) updateData.username = updates.username;
        if (updates.xp !== undefined) updateData.xp = updates.xp;
        if (updates.level !== undefined) updateData.level = updates.level;
        if (updates.highestUnlockedBiome !== undefined) {
          updateData.highest_unlocked_biome = updates.highestUnlockedBiome;
        }

        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;

        const updatedProfile = {
          id: data.id,
          username: data.username,
          xp: data.xp,
          level: data.level,
          highestUnlockedBiome: data.highest_unlocked_biome,
          updatedAt: data.updated_at,
        };

        set({ profile: updatedProfile, loading: false });
        
        // Emit event for UI updates
        eventBus.emit('profile:updated', {
          xp: updatedProfile.xp,
          level: updatedProfile.level,
          highestUnlockedBiome: updatedProfile.highestUnlockedBiome,
        });
      } catch (error) {
        console.error('Failed to update profile:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update profile',
          loading: false 
        });
      }
    },

    fetchWingsuits: async () => {
      try {
        const { data, error } = await supabase
          .from('wingsuits')
          .select('*')
          .order('unlock_level', { ascending: true });

        if (error) throw error;

        set({ 
          wingsuits: data.map((wingsuit: Record<string, string | number>) => ({
            id: wingsuit.id as number,
            name: wingsuit.name as string,
            speedStat: wingsuit.speed_stat as number,
            maneuverabilityStat: wingsuit.maneuverability_stat as number,
            glideStat: wingsuit.glide_stat as number,
            unlockLevel: wingsuit.unlock_level as number,
          }))
        });
      } catch (error) {
        console.error('Failed to fetch wingsuits:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch wingsuits'
        });
      }
    },

    fetchLeaderboards: async (limit = 50) => {
      try {
        const { data, error } = await supabase
          .from('leaderboards')
          .select(`
            id,
            user_id,
            race_seed,
            finish_time_ms,
            created_at,
            profiles (username)
          `)
          .order('finish_time_ms', { ascending: true })
          .limit(limit);

        if (error) throw error;

        set({ 
          leaderboards: data.map((entry: Record<string, unknown>) => ({
            id: entry.id as string,
            userId: entry.user_id as string,
            raceSeed: entry.race_seed as string,
            finishTimeMs: entry.finish_time_ms as number,
            createdAt: entry.created_at as string,
            profile: {
              username: (entry.profiles as Record<string, string> | null)?.username ?? 'Unknown',
            },
          }))
        });

        eventBus.emit('leaderboard:updated');
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch leaderboards'
        });
      }
    },

    submitRaceTime: async (raceSeed: string, finishTimeMs: number) => {
      const user = useAuthStore.getState().user;
      if (!user) return;

      try {
        const { error } = await supabase
          .from('leaderboards')
          .insert({
            user_id: user.id,
            race_seed: raceSeed,
            finish_time_ms: finishTimeMs,
          });

        if (error) throw error;

        // Refresh leaderboards after successful submission
        get().fetchLeaderboards();
      } catch (error) {
        console.error('Failed to submit race time:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to submit race time'
        });
      }
    },
  }));

// Subscribe to auth changes and fetch profile when user logs in
let prevUser: User | null = null;
useAuthStore.subscribe((state) => {
  const user = state.user;
  if (user && !prevUser) {
    useProfileStore.getState().fetchProfile();
    useProfileStore.getState().fetchWingsuits();
  } else if (!user && prevUser) {
    // Clear profile data when user logs out
    useProfileStore.setState({
      profile: null,
      wingsuits: [],
      leaderboards: [],
      error: null,
    });
  }
  prevUser = user;
});
