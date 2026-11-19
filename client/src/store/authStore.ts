import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

interface AuthStore {
  user: AuthUser | null;
  sessionToken: string | null;
  setUser: (user: AuthUser | null) => void;
  setSessionToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  sessionToken: null,
  setUser: (user) => set({ user }),
  setSessionToken: (token) => set({ sessionToken: token }),
  logout: () => set({ user: null, sessionToken: null }),
}));
