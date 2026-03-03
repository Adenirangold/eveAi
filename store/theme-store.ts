import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

type ThemePreference = "system" | "light" | "dark";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",

  setPreference: async (pref) => {
    await SecureStore.setItemAsync("themePreference", pref);
    set({ preference: pref });
  },

  hydrate: async () => {
    const stored = await SecureStore.getItemAsync("themePreference");
    if (stored === "light" || stored === "dark" || stored === "system") {
      set({ preference: stored });
    }
  },
}));
