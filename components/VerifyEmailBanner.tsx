import icons from "@/constants/icons";
import { useProfile } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function VerifyEmailBanner() {
  const { data: profile } = useProfile();

  if (!profile || profile.emailVerified) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Ionicons name="warning" size={18} color="#F59E0B" />
        <Text style={styles.text}>Your email is not verified</Text>
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
    backgroundColor: "#1D1B31",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2D2B45",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    color: "#F59E0B",
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
