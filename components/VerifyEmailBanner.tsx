import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProfile, useResendVerification } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function VerifyEmailBanner() {
  const { data: profile } = useProfile();
  const isDark = useColorScheme() === "dark";
  const resend = useResendVerification();

  const accentBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(108,86,255,0.1)";
  const accentText = isDark ? "#fff" : "#6C56FF";

  if (!profile || profile.emailVerified) return null;

  const handleVerify = () => {
    resend.mutate(profile.email, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "Verification Email Sent",
          text2: "Please check your inbox to verify your email.",
        });
      },
      onError: (err) => {
        Toast.show({
          type: "error",
          text1: "Failed to Send",
          text2: err.message || "Please try again later.",
        });
      },
    });
  };

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? "#1D1B31" : "#FFFFFF",
          borderColor: isDark ? "#2D2B45" : "#E0DCF0",
        },
      ]}
    >
      <View style={styles.topRow}>
        <Ionicons name="warning" size={18} color="#F59E0B" />
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1A1A2E" }]}>
          Email not verified
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.subtitle, { color: isDark ? "#888" : "#6B7280" }]}>
          Didn't get verification email?
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: accentBg }]}
          activeOpacity={0.7}
          onPress={handleVerify}
          disabled={resend.isPending}
        >
          {resend.isPending ? (
            <ActivityIndicator size="small" color={accentText} />
          ) : (
            <Text style={[styles.buttonText, { color: accentText }]}>
              Resend
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
    flex: 1,
    marginRight: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
});
