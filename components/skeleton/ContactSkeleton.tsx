import { Skeleton } from "moti/skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

const AVATAR_SIZE = 50;
const COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;
const ROW_COUNT = 8;

function Row() {
  return (
    <View style={styles.row}>
      <Skeleton
        colorMode="dark"
        colors={[...COLORS]}
        radius="round"
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
      />
      <View style={styles.lines}>
        <Skeleton
          colorMode="dark"
          colors={[...COLORS]}
          radius={4}
          width="60%"
          height={14}
        />
        <Skeleton
          colorMode="dark"
          colors={[...COLORS]}
          radius={4}
          width="85%"
          height={12}
        />
      </View>
      <Skeleton
        colorMode="dark"
        colors={[...COLORS]}
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
    borderBottomColor: "#1A1354",
  },
  lines: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
    gap: 8,
  },
});
