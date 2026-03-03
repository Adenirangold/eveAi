import { useColorScheme } from "@/hooks/use-color-scheme";
import { Skeleton } from "moti/skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

const DARK_COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;
const LIGHT_COLORS = ["#E8E5F5", "#D5D0EC", "#E8E5F5"] as const;

export default function ChatsHeaderSkeleton() {
  const isDark = useColorScheme() === "dark";
  const colorMode = isDark ? "dark" : "light";
  const colors = isDark ? [...DARK_COLORS] : [...LIGHT_COLORS];

  return (
    <View style={styles.container}>
      <Skeleton
        colorMode={colorMode}
        colors={colors}
        radius={4}
        width={80}
        height={22}
      />
      <Skeleton
        colorMode={colorMode}
        colors={colors}
        radius={15}
        width="100%"
        height={44}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginTop: 16,
    gap: 12,
  },
});
