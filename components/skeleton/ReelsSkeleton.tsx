import { useColorScheme } from "@/hooks/use-color-scheme";
import { Skeleton } from "moti/skeleton";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const RING_SIZE = 62;
const ITEM_COUNT = 5;
const DARK_COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;
const LIGHT_COLORS = ["#E8E5F5", "#D5D0EC", "#E8E5F5"] as const;

export default function ReelsSkeleton() {
  const isDark = useColorScheme() === "dark";
  const colorMode = isDark ? "dark" : "light";
  const colors = isDark ? [...DARK_COLORS] : [...LIGHT_COLORS];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      contentContainerStyle={styles.row}
    >
      {Array.from({ length: ITEM_COUNT }).map((_, i) => (
        <View key={i} style={styles.item}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius="round"
            width={RING_SIZE}
            height={RING_SIZE}
          />
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={4}
            width={48}
            height={10}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  item: {
    alignItems: "center",
    width: 72,
    gap: 8,
  },
});
