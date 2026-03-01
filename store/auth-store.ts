import { setDatabaseUser } from "@/lib/database";
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
    await SecureStore.setItemAsync("userId", user.id);
    if (refreshToken) {
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    }
    setDatabaseUser(user.id);
    set({
      user,
      accessToken,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
    });
  },

  setUser: (user) => {
    setDatabaseUser(user.id);
    set({ user });
  },

  logout: async () => {
    setDatabaseUser(null);
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("userId");
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, onboarding, userId] =
        await Promise.all([
          SecureStore.getItemAsync("accessToken"),
          SecureStore.getItemAsync("refreshToken"),
          SecureStore.getItemAsync("hasSeenOnboarding"),
          SecureStore.getItemAsync("userId"),
        ]);
      if (accessToken) {
        if (userId) setDatabaseUser(userId);
        set({ accessToken, refreshToken, isAuthenticated: true });
      }
      set({ hasSeenOnboarding: onboarding === "true" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
