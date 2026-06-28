import { create } from 'zustand'
import type { Profile, Streak } from '@/types'
import type { BadgeUnlockData } from '@/components/gamification/badge-unlock-modal'

interface AuthState {
  user: any | null;
  profile: Profile | null;
  streak: Streak | null;
  isLoading: boolean;
  badgeQueue: BadgeUnlockData[];
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  setStreak: (streak: Streak | null) => void;
  setLoading: (loading: boolean) => void;
  pushBadge: (badge: BadgeUnlockData) => void;
  popBadge: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  streak: null,
  isLoading: true,
  badgeQueue: [],
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setStreak: (streak) => set({ streak }),
  setLoading: (isLoading) => set({ isLoading }),
  pushBadge: (badge) => set((state) => ({ badgeQueue: [...state.badgeQueue, badge] })),
  popBadge: () => set((state) => ({ badgeQueue: state.badgeQueue.slice(1) })),
  reset: () => set({ user: null, profile: null, streak: null, isLoading: false, badgeQueue: [] }),
}))
