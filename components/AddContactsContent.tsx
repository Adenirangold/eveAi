import {
  getLocalAvailableContacts,
  saveLocalAvailableContacts,
} from "@/lib/database";
import {
  AvailableContact,
  contactsService,
} from "@/services/contacts";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
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
import { SvgUri } from "react-native-svg";
import ContactSkeleton from "./skeleton/ContactSkeleton";

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
  return (
    <View style={styles.row}>
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <View style={styles.avatar}>
            <SvgUri uri={item.avatar} width={AVATAR_SIZE} height={AVATAR_SIZE} />
          </View>
        ) : (
          <View style={styles.initials}>
            <Text style={styles.initialsText}>{getInitials(item.name)}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.bio} numberOfLines={2}>
          {item.bio}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.addButton, added && styles.addedButton]}
        activeOpacity={0.7}
        onPress={() => onAdd(item.id)}
        disabled={adding || added}
      >
        {adding ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : added ? (
          <>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Added</Text>
          </>
        ) : (
          <>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function AddContactsContent({ onClose }: { onClose?: () => void }) {
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
        queryClient.invalidateQueries({ queryKey: ["stories"] });
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
        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Add Contacts</Text>
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
            <Text style={styles.emptyText}>No contacts available</Text>
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
    color: "#fff",
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
    borderBottomColor: "#1A1354",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    overflow: "hidden",
  },
  initials: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#fff",
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
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
    fontFamily: "Outfit-SemiBold",
  },
  bio: {
    color: "#888",
    fontSize: 13,
    fontFamily: "Outfit-Regular",
    lineHeight: 18,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6C56FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addedButton: {
    backgroundColor: "#2E2E4A",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
  },
});
