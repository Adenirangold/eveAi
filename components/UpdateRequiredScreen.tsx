import CustomButton from "@/components/custom-button";
import images from "@/constants/images";
import { STORE_URLS } from "@/constants/stores";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Linking from "expo-linking";
import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const storeUrl = Platform.OS === "ios" ? STORE_URLS.ios : STORE_URLS.android;

export default function UpdateRequiredScreen() {
  const isDark = useColorScheme() === "dark";
  const bgColor = isDark ? "#0A0A0B" : "#F5F3FF";
  const textColor = isDark ? "#fff" : "#1A1A2E";
  const subtextColor = isDark ? "#888" : "#6B7280";

  const handleUpdate = () => {
    Linking.openURL(storeUrl);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.content}>
        <Image source={images.logo} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: textColor }]}>
          Update Required
        </Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          A new version of Eve is available. Please update to continue using the
          app.
        </Text>

        <CustomButton
          title={`Update from ${Platform.OS === "ios" ? "App Store" : "Play Store"}`}
          onPress={handleUpdate}
          variant="primary"
          rounded="full"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 24,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Outfit-Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 200,
  },
});
