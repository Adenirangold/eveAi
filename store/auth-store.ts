import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;

  setAuth: (params: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  }) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,

  setAuth: async ({ user, accessToken, refreshToken }) => {
    await SecureStore.setItemAsync("accessToken", accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    }
    set({
      user,
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
    });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, onboarding] = await Promise.all([
        SecureStore.getItemAsync("accessToken"),
        SecureStore.getItemAsync("refreshToken"),
        SecureStore.getItemAsync("hasSeenOnboarding"),
      ]);
      if (accessToken) {
        set({ accessToken, refreshToken, isAuthenticated: true });
      }
      set({ hasSeenOnboarding: onboarding === "true" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
