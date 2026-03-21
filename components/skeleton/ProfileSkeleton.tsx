import { useColorScheme } from "@/hooks/use-color-scheme";
import { useScrollColumnStyle } from "@/hooks/use-responsive-layout";
import { Skeleton } from "moti/skeleton";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const AVATAR_SIZE = 96;
const DARK_COLORS = ["#1C1C2E", "#2A2A3D", "#1C1C2E"] as const;
const LIGHT_COLORS = ["#E8E5F5", "#D5D0EC", "#E8E5F5"] as const;

export default function ProfileSkeleton() {
  const columnStyle = useScrollColumnStyle();
  const isDark = useColorScheme() === "dark";
  const colorMode = isDark ? "dark" : "light";
  const colors = isDark ? [...DARK_COLORS] : [...LIGHT_COLORS];

  const cardBackground = isDark ? "#1F1D35" : "#FFFFFF";
  const cardBorderColor = isDark ? "#2D2B4A" : "#E0DCF0";

  return (
    <View style={columnStyle}>
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      {/* Theme toggle row */}
      <View style={styles.themeRow}>
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={999}
          width={56}
          height={28}
        />
      </View>

      {/* Avatar + name + email */}
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
          radius={8}
          width={180}
          height={22}
        />
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={8}
          width={220}
          height={16}
        />
      </View>

      {/* Account card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBackground,
            borderColor: cardBorderColor,
          },
        ]}
      >
        {/* Section label */}
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="32%"
          height={12}
        />

        {/* Username row */}
        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="45%"
              height={14}
            />
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="30%"
              height={12}
            />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.separator} />

        {/* Status + member since rows */}
        <View style={styles.rowCompact}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={6}
            width="55%"
            height={14}
          />
        </View>
        <View style={styles.rowCompact}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={6}
            width="48%"
            height={14}
          />
        </View>
      </View>

      {/* Settings card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBackground,
            borderColor: cardBorderColor,
          },
        ]}
      >
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="40%"
          height={12}
        />

        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="55%"
              height={14}
            />
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="26%"
              height={12}
            />
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="60%"
              height={14}
            />
          </View>
        </View>
      </View>

      {/* Terms card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBackground,
            borderColor: cardBorderColor,
          },
        ]}
      >
        <Skeleton
          colorMode={colorMode}
          colors={colors}
          radius={6}
          width="55%"
          height={12}
        />

        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="58%"
              height={14}
            />
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="52%"
              height={14}
            />
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="40%"
              height={14}
            />
          </View>
        </View>
      </View>

      {/* Danger card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBackground,
            borderColor: cardBorderColor,
          },
        ]}
      >
        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="70%"
              height={14}
            />
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Skeleton
            colorMode={colorMode}
            colors={colors}
            radius={999}
            width={36}
            height={36}
          />
          <View style={styles.rowText}>
            <Skeleton
              colorMode={colorMode}
              colors={colors}
              radius={6}
              width="40%"
              height={14}
            />
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  themeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
  },
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
    marginTop: 14,
  },
  rowText: {
    flex: 1,
    rowGap: 6,
  },
  rowCompact: {
    marginTop: 10,
  },
  separator: {
    height: 1,
    marginTop: 14,
  },
});

