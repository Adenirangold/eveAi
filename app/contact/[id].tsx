import Background from "@/components/BackGround";
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

  return (
    <Background>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
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
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {getInitials(contact.name)}
                </Text>
              </View>
            )}
            <Text style={styles.name}>{contact.name}</Text>
            <Text style={styles.slug}>@{contact.slug}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Bio</Text>
            <Text style={styles.cardBio}>{contact.bio}</Text>
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
    color: "#fff",
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
    backgroundColor: "#1C1C2E",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#6C56FF",
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#6C56FF",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Outfit-Bold",
  },
  name: {
    color: "#fff",
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
    backgroundColor: "#1C1C2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  cardBio: {
    color: "#E8E8E8",
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
