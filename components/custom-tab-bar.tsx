import { useColorScheme } from "@/hooks/use-color-scheme";
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

  return (
    <View
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, 16) },
        isDark ? styles.wrapperDark : styles.wrapperLight,
      ]}
    >
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

          const iconColor = isDark
            ? "#fff"
            : isFocused
              ? "#6C56FF"
              : "#6B7280";

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
              <Ionicons name={iconName} size={28} color={iconColor} />
              {isFocused && (
                <Text
                  style={[
                    styles.label,
                    { color: isDark ? "#fff" : "#6C56FF" },
                  ]}
                >
                  {meta.label}
                </Text>
              )}
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
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
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
