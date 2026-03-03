import { useColorScheme } from "@/hooks/use-color-scheme";
import { Skeleton } from "moti/skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

const AVATAR_SIZE = 50;
const DARK_COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;
const LIGHT_COLORS = ["#E8E5F5", "#D5D0EC", "#E8E5F5"] as const;
const ROW_COUNT = 8;

function Row() {
  const isDark = useColorScheme() === "dark";
  const colorMode = isDark ? "dark" : "light";
  const colors = isDark ? [...DARK_COLORS] : [...LIGHT_COLORS];

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: isDark ? "#1A1354" : "rgba(0,0,0,0.08)" },
      ]}
    >
      <Skeleton
        colorMode={colorMode}
        colors={colors}
        radius="round"
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
      />
      <View style={styles.lines}>
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={4}
          width="60%"
          height={14}
        />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={4}
          width="85%"
          height={12}
        />
      </View>
      <Skeleton
        colorMode={colorMode}
        colors={colors}
        radius={20}
        width={70}
        height={34}
      />
    </View>
  );
}

export default function ContactSkeleton({ count = ROW_COUNT }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  lines: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
    gap: 8,
  },
});
