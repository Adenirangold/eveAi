import icons from "@/constants/icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProfile } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function VerifyEmailBanner() {
  const { data: profile } = useProfile();
  const isDark = useColorScheme() === "dark";

  if (!profile || profile.emailVerified) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? "#1D1B31" : "#FFFBEB",
          borderColor: isDark ? "#2D2B45" : "#FDE68A",
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="warning" size={18} color="#F59E0B" />
        <Text style={[styles.text, { color: isDark ? "#F59E0B" : "#B45309" }]}>
          Your email is not verified
        </Text>
      </View>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Verify</Text>
        <Image
          source={icons.chevronLeft}
          style={styles.chevron}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6C56FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  chevron: {
    width: 12,
    height: 12,
    tintColor: "#fff",
    transform: [{ rotate: "180deg" }],
  },
});
