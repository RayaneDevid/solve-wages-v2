import { create } from 'zustand';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  isAuthenticated: () => get().user !== null,
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
