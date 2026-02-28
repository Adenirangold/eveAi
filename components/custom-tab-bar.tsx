import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import React from "react";
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

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 16) }]}>
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
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              <Ionicons name={iconName} size={28} color="#fff" />
              {isFocused && <Text style={styles.label}>{meta.label}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 24,
    right: 24,
    backgroundColor: "rgba(18, 15, 35, 0.92)",
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
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
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  label: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
});
