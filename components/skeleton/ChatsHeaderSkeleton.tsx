import { Skeleton } from "moti/skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

const COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;

export default function ChatsHeaderSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton
        colorMode="dark"
        colors={[...COLORS]}
        radius={4}
        width={80}
        height={22}
      />
      <Skeleton
        colorMode="dark"
        colors={[...COLORS]}
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
