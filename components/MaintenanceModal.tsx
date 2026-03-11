import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Image } from "expo-image";
import { Modal, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
};

export default function MaintenanceModal({ visible }: Props) {
  const isDark = useColorScheme() === "dark";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        // Intentionally noop – modal can only close when visible becomes false.
      }}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.content,
            { backgroundColor: isDark ? "#0D0B1E" : "#FFFFFF" },
          ]}
        >
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoCircle,
                {
                  backgroundColor: isDark ? "#1C1A3A" : "#EEF2FF",
                  borderColor: isDark ? "#4C51BF" : "#A855F7",
                },
              ]}
            >
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
          </View>
          <Text
            style={[
              styles.title,
              { color: isDark ? "#FFFFFF" : "#111827" },
            ]}
          >
            We&apos;ll be right back
          </Text>
          <Text
            style={[
              styles.message,
              { color: isDark ? "#D1D5DB" : "#4B5563" },
            ]}
          >
            Eve is currently undergoing scheduled maintenance to keep your
            experience fast, secure, and reliable. You can safely leave the app
            and come back in a little while.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    width: "100%",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontFamily: "Outfit-SemiBold",
    marginBottom: 6,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});

