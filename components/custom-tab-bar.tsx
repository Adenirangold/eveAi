import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useUnreadSummary } from "@/hooks/useUnreadSummary";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Notifications from "expo-notifications";

import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TAB_META: Record<
  string,
  { active: IoniconsName; inactive: IoniconsName; label: string }
> = {
  index: {
    active: "chatbubbles",
    inactive: "chatbubbles-outline",
    label: "Chats",
  },
  story: {
    active: "play-circle",
    inactive: "play-circle-outline",
    label: "Stories",
  },
  profile: {
    active: "person-circle",
    inactive: "person-circle-outline",
    label: "Profile",
  },
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isLargeFormFactor, contentMaxWidth } = useResponsiveLayout();
  const { data: unreadSummary } = useUnreadSummary();
  const totalUnread = unreadSummary?.totalUnread ?? 0;

  useEffect(() => {
    Notifications.setBadgeCountAsync(totalUnread).catch(() => {});
  }, [totalUnread]);

  const bottomOffset = Math.max(insets.bottom, 16) + 15;

  const barBody = (
    <View style={styles.container}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? {
            active: "ellipse",
            inactive: "ellipse-outline",
            label: route.name,
          };
          const iconName = isFocused ? meta.active : meta.inactive;
          const iconColor = isDark ? "#fff" : isFocused ? "#6C56FF" : "#6B7280";
          const showBadge = route.name === "index" && totalUnread > 0;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[
                styles.tab,
                isFocused &&
                  (isDark ? styles.tabActiveDark : styles.tabActiveLight),
              ]}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={iconName} size={28} color={iconColor} />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText} numberOfLines={1}>
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </Text>
                  </View>
                )}
              </View>
              {isFocused && (
                <Text
                  style={[styles.label, { color: isDark ? "#fff" : "#6C56FF" }]}
                >
                  {meta.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
    </View>
  );

  if (isLargeFormFactor && contentMaxWidth != null) {
    return (
      <View
        pointerEvents="box-none"
        style={[styles.dockOuter, { bottom: bottomOffset }]}
      >
        <View
          style={[
            styles.wrapper,
            styles.wrapperTablet,
            { maxWidth: contentMaxWidth },
            isDark ? styles.wrapperDark : styles.wrapperLight,
          ]}
        >
          {barBody}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.wrapper,
        styles.wrapperPhone,
        { bottom: bottomOffset },
        isDark ? styles.wrapperDark : styles.wrapperLight,
      ]}
    >
      {barBody}
    </View>
  );
}

const styles = StyleSheet.create({
  dockOuter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  wrapper: {
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
  wrapperPhone: {
    position: "absolute",
    left: 24,
    right: 24,
  },
  wrapperTablet: {
    position: "relative",
    width: "100%",
  },
  wrapperDark: {
    backgroundColor: "rgba(18, 15, 35, 0.92)",
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
  },
  wrapperLight: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#6C56FF",
    shadowOpacity: 0.12,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 60,
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    gap: 6,
  },
  iconWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#6C56FF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  tabActiveDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  tabActiveLight: {
    backgroundColor: "rgba(108,86,255,0.1)",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
});
