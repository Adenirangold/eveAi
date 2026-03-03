import Background from "@/components/BackGround";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getLocalContactById } from "@/lib/database";
import { contactsService, type AvailableContact } from "@/services/contacts";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";

const AVATAR_SIZE = 100;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ContactProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";

  const localContact = useMemo(
    () => (id ? getLocalContactById(id) : null),
    [id],
  );

  const { data: contact, isPending } = useQuery<AvailableContact>({
    queryKey: ["contact", id],
    queryFn: () => contactsService.getContact(id!),
    enabled: !!id,
    initialData: localContact ?? undefined,
  });

  const iconColor = isDark ? "#fff" : "#1A1A2E";

  return (
    <Background>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: iconColor }]}>
          Profile
        </Text>
        <View style={styles.backButton} />
      </View>

      {isPending ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C56FF" />
        </View>
      ) : contact ? (
        <View style={styles.content}>
          <View style={styles.avatarSection}>
            {contact.avatar ? (
              <ExpoImage
                source={contact.avatar}
                style={[
                  styles.avatar,
                  { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
                ]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.avatarFallback,
                  { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
                ]}
              >
                <Text
                  style={[
                    styles.avatarInitials,
                    { color: isDark ? "#fff" : "#6C56FF" },
                  ]}
                >
                  {getInitials(contact.name)}
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.name,
                { color: isDark ? "#fff" : "#1A1A2E" },
              ]}
            >
              {contact.name}
            </Text>
            <Text style={styles.slug}>@{contact.slug}</Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF" },
              !isDark && {
                borderWidth: 1,
                borderColor: "#E0DCF0",
              },
            ]}
          >
            <Text
              style={[
                styles.cardLabel,
                {
                  color: isDark
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(0,0,0,0.4)",
                },
              ]}
            >
              Bio
            </Text>
            <Text
              style={[
                styles.cardBio,
                { color: isDark ? "#E8E8E8" : "#374151" },
              ]}
            >
              {contact.bio}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.messageButton}
            activeOpacity={0.7}
            onPress={() => {
              router.back();
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Background>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#6C56FF",
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#6C56FF",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
    marginBottom: 4,
  },
  slug: {
    color: "#6C56FF",
    fontSize: 16,
    fontFamily: "Outfit-Regular",
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardBio: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 24,
  },
  messageButton: {
    backgroundColor: "#6C56FF",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
});
