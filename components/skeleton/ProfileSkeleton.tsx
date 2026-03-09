import { useColorScheme } from "@/hooks/use-color-scheme";
import { Skeleton } from "moti/skeleton";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const AVATAR_SIZE = 96;
const DARK_COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;
const LIGHT_COLORS = ["#E8E5F5", "#D5D0EC", "#E8E5F5"] as const;

export default function ProfileSkeleton() {
  const isDark = useColorScheme() === "dark";
  const colorMode = isDark ? "dark" : "light";
  const colors = isDark ? [...DARK_COLORS] : [...LIGHT_COLORS];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      <View style={styles.header}>
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius="round"
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
        />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width={160}
          height={22}
        />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width={200}
          height={16}
        />
      </View>

      <View style={styles.card}>
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="40%"
          height={14}
        />
        <View style={styles.cardRow} />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="70%"
          height={14}
        />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="50%"
          height={14}
        />
      </View>

      <View style={styles.card}>
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="35%"
          height={14}
        />
        <View style={styles.cardRow} />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="80%"
          height={14}
        />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="65%"
          height={14}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 10,
  },
  cardRow: {
    height: 1,
  },
});

