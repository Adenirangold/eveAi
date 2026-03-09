import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getLocalAvailableContacts,
  saveLocalAvailableContacts,
} from "@/lib/database";
import { AvailableContact, contactsService } from "@/services/contacts";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { REELS_QUERY_KEY } from "@/hooks/useReels";
import { STORIES_QUERY_KEY } from "@/hooks/useStories";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import ContactSkeleton from "./skeleton/ContactSkeleton";
import VerifiedBadge from "./VerifiedBadge";

const AVATAR_SIZE = 50;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ContactRow({
  item,
  onAdd,
  adding,
  added,
}: {
  item: AvailableContact;
  onAdd: (id: string) => void;
  adding: boolean;
  added: boolean;
}) {
  const isDark = useColorScheme() === "dark";
  const accentBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(108,86,255,0.1)";
  const accentText = isDark ? "#fff" : "#6C56FF";

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: isDark ? "#1A1354" : "rgba(0,0,0,0.08)" },
      ]}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <ExpoImage
            source={item.avatar}
            style={[
              styles.avatar,
              { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
            ]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.initials,
              { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
            ]}
          >
            <Ionicons name="person" size={22} color={isDark ? "#fff" : "#6C56FF"} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[styles.name, { color: isDark ? "#fff" : "#1A1A2E" }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.isPremium && <VerifiedBadge size={15} />}
        </View>
        <Text
          style={[styles.bio, { color: isDark ? "#888" : "#6B7280" }]}
          numberOfLines={2}
        >
          {item.bio}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          { backgroundColor: accentBg },
          added && {
            backgroundColor: isDark ? "#2E2E4A" : "#D1D5DB",
          },
        ]}
        activeOpacity={0.7}
        onPress={() => onAdd(item.id)}
        disabled={adding || added}
      >
        {adding ? (
          <ActivityIndicator size="small" color={accentText} />
        ) : added ? (
          <>
            <Ionicons
              name="checkmark"
              size={16}
              color={isDark ? "#fff" : "#6B7280"}
            />
            <Text
              style={[
                styles.addButtonText,
                added && !isDark && { color: "#6B7280" },
              ]}
            >
              Added
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="person-add-outline" size={16} color={accentText} />
            <Text style={[styles.addButtonText, { color: accentText }]}>Add</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function AddContactsContent({
  onClose,
}: {
  onClose?: () => void;
}) {
  const isDark = useColorScheme() === "dark";
  const queryClient = useQueryClient();
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const { data: contacts = [], isPending: loading } = useQuery({
    queryKey: ["availableContacts"],
    queryFn: async () => {
      const remote = await contactsService.getAvailableContacts();
      saveLocalAvailableContacts(remote);
      return remote;
    },
    placeholderData: () => {
      try {
        const cached = getLocalAvailableContacts();
        return cached.length > 0 ? cached : undefined;
      } catch {
        return undefined;
      }
    },
  });

  const handleAdd = useCallback(
    async (contactId: string) => {
      setAddingIds((prev) => new Set(prev).add(contactId));
      try {
        await contactsService.addContact(contactId);
        setAddedIds((prev) => new Set(prev).add(contactId));
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["availableContacts"] });
        queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      } catch (err) {
        console.error("Failed to add contact:", err);
      } finally {
        setAddingIds((prev) => {
          const next = new Set(prev);
          next.delete(contactId);
          return next;
        });
      }
    },
    [queryClient],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-down"
            size={28}
            color={isDark ? "#fff" : "#1A1A2E"}
          />
        </TouchableOpacity>
        <Text
          style={[styles.title, { color: isDark ? "#fff" : "#1A1A2E" }]}
        >
          Add Characters
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ContactSkeleton />
      ) : (
        <BottomSheetFlatList
          data={contacts}
          keyExtractor={(item: AvailableContact) => item.id}
          renderItem={({ item }: { item: AvailableContact }) => (
            <ContactRow
              item={item}
              onAdd={handleAdd}
              adding={addingIds.has(item.id)}
              added={addedIds.has(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? "#888" : "#6B7280" },
              ]}
            >
              No characters available
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
    textAlign: "center",
  },
  headerSpacer: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  initials: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
  info: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
    fontFamily: "Outfit-SemiBold",
  },
  bio: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    lineHeight: 18,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
