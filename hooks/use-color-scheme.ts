import { useThemeStore } from "@/store/theme-store";
import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme() {
  const system = useRNColorScheme();
  const preference = useThemeStore((s) => s.preference);

  if (preference === "system") return system ?? "dark";
  return preference;
}
