import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_BG = "#111114";
const ACTIVE_COLOR = "#6C56FF";
const INACTIVE_COLOR = "#F2F2F2";
const PLUS_BTN_SIZE = 58;

function getTabMeta(routeName: string) {
  switch (routeName) {
    case "index":
      return { icon: "chatbubbles" as const, label: "Chat" };
    case "profile":
      return { icon: "person" as const, label: "Profile" };
    default:
      return { icon: "ellipse" as const, label: routeName };
  }
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  onPlusPress,
}: BottomTabBarProps & { onPlusPress?: () => void }) {
  const insets = useSafeAreaInsets();

  const handlePlusPress = () => {
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPlusPress?.();
  };

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
    const { icon, label } = getTabMeta(route.name);

    const onPress = () => {
      if (Platform.OS === "ios") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
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
        style={styles.tab}
      >
        <Ionicons name={icon} size={30} color={color} />
        <Text style={[styles.label, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const leftTabs = state.routes.slice(0, 1);
  const rightTabs = state.routes.slice(1);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {leftTabs.map((route, i) => renderTab(route, i))}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePlusPress}
          style={styles.plusButton}
        >
          <View style={styles.plusCircle}>
            <Ionicons name="add" size={32} color="#000" />
          </View>
        </TouchableOpacity>

        {rightTabs.map((route, i) => renderTab(route, leftTabs.length + i))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TAB_BAR_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "visible",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: 65,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
  plusButton: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
  },
  plusCircle: {
    width: PLUS_BTN_SIZE,
    height: PLUS_BTN_SIZE,
    borderRadius: PLUS_BTN_SIZE / 2,
    backgroundColor: "#6C56FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6C56FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
