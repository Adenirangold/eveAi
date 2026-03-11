import { useAddContactsSheet } from "@/app/(tabs)/_layout";
import Background from "@/components/BackGround";
import CustomInput from "@/components/CustomInput";
import MaintenanceModal from "@/components/MaintenanceModal";
import VerifiedBadge from "@/components/VerifiedBadge";
import Reels from "@/components/reels";
import ChatRowSkeleton from "@/components/skeleton/ChatRowSkeleton";
import ChatsHeaderSkeleton from "@/components/skeleton/ChatsHeaderSkeleton";

import images from "@/constants/images";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useMaintenanceCheck } from "@/hooks/useMaintenanceCheck";
import { REELS_QUERY_KEY } from "@/hooks/useReels";
import { STORIES_QUERY_KEY } from "@/hooks/useStories";
import {
  deleteLocalContact,
  getLastMessageByContact,
  getLocalAvailableContacts,
  getLocalContacts,
  saveLocalAvailableContacts,
  saveLocalContacts,
  type LastMessageInfo,
  type UnreadInfo,
} from "@/lib/database";
import {
  Contact,
  contactsService,
  type AvailableContact,
} from "@/services/contacts";
import {
  invalidateUnreadSummary,
  useUnreadSummary,
} from "@/hooks/useUnreadSummary";
import { registerAndSyncPushToken } from "@/utils/notification";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_SIZE = 50;
const DELETE_WIDTH = 80;

let openSwipeable: SwipeableMethods | null = null;

function RightAction({
  dragX,
  onDelete,
}: {
  dragX: SharedValue<number>;
  onDelete: () => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(dragX.value, [-DELETE_WIDTH, 0], [1, 0.4], "clamp"),
      },
    ],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onDelete}
      style={styles.deleteAction}
    >
      <Animated.View style={[{ alignItems: "center" }, animStyle]}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.deleteText}>Remove</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function ChatRow({
  item,
  lastMessage,
  unreadCount,
  onDelete,
  onPress,
  isFirst,
}: {
  item: Contact;
  lastMessage?: LastMessageInfo;
  unreadCount: number;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
  isFirst: boolean;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isDark = useColorScheme() === "dark";
  const hasUnread = unreadCount > 0;

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  const onSwipeOpen = useCallback(() => {
    if (openSwipeable && openSwipeable !== swipeableRef.current) {
      openSwipeable.close();
    }
    openSwipeable = swipeableRef.current;
  }, []);

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={(_progress, dragX) => (
        <RightAction dragX={dragX} onDelete={handleDelete} />
      )}
      overshootRight={false}
      rightThreshold={40}
      onSwipeableOpen={onSwipeOpen}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.chatRow,
          {
            borderBottomColor: isDark ? "#1A1354" : "rgba(0,0,0,0.06)",
            borderBottomWidth: isDark ? 0.17 : 0.8,
          },
          isFirst && { borderBottomWidth: 0 },
        ]}
        onPress={handlePress}
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <ExpoImage
              source={item.avatar}
              style={[
                styles.chatAvatar,
                { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
              ]}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.chatInitials,
                { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
              ]}
            >
              <Ionicons
                name="person"
                size={22}
                color={isDark ? "#fff" : "#6C56FF"}
              />
            </View>
          )}
        </View>

        <View style={styles.chatMid}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={[styles.chatName, { color: isDark ? "#fff" : "#1A1A2E" }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.isPremium && <VerifiedBadge size={15} />}
          </View>
          <Text
            style={[
              styles.chatMessage,
              { color: isDark ? "#888" : "#6B7280" },
              hasUnread && {
                color: isDark ? "#ccc" : "#1A1A2E",
                fontFamily: "Outfit-Medium",
              },
            ]}
            numberOfLines={1}
          >
            {lastMessage?.content ?? item.bio}
          </Text>
        </View>

        <View style={styles.chatRight}>
          <Text
            style={[
              styles.chatTime,
              { color: isDark ? "#888" : "#9CA3AF" },
              hasUnread && { color: "#6C56FF" },
            ]}
          >
            {formatTime(lastMessage?.createdAt ?? item.addedAt)}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

function AvailableContactRow({
  item,
  onAdd,
  adding,
  added,
  isFirst,
}: {
  item: AvailableContact;
  onAdd: (id: string) => void;
  adding: boolean;
  added: boolean;
  isFirst: boolean;
}) {
  const isDark = useColorScheme() === "dark";

  return (
    <View
      style={[
        styles.chatRow,
        {
          borderBottomColor: isDark ? "#1A1354" : "rgba(0,0,0,0.06)",
          borderBottomWidth: isDark ? 0.17 : 0.8,
        },
        isFirst && { borderBottomWidth: 0 },
      ]}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <ExpoImage
            source={item.avatar}
            style={[
              styles.chatAvatar,
              { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
            ]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.chatInitials,
              { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
            ]}
          >
            <Ionicons
              name="person"
              size={22}
              color={isDark ? "#fff" : "#6C56FF"}
            />
          </View>
        )}
      </View>

      <View style={styles.chatMid}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[styles.chatName, { color: isDark ? "#fff" : "#1A1A2E" }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.isPremium && <VerifiedBadge size={15} />}
        </View>
      </View>

      <TouchableOpacity
        style={styles.availableAddButton}
        activeOpacity={0.7}
        onPress={() => onAdd(item.id)}
        disabled={adding || added}
      >
        {adding ? (
          <ActivityIndicator size="small" color={isDark ? "#fff" : "#6C56FF"} />
        ) : added ? (
          <Ionicons
            name="checkmark"
            size={18}
            color={isDark ? "#fff" : "#6B7280"}
          />
        ) : (
          <Ionicons
            name="person-add-outline"
            size={18}
            color={isDark ? "#fff" : "#6C56FF"}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

function ChatsHeader({ onAddPress }: { onAddPress: () => void }) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={styles.chatsHeader}>
      <View style={styles.chatsTitleRow}>
        <View style={styles.chatsHeaderLeft}>
          <ExpoImage
            source={isDark ? images.eveLogoDark : images.eveLogoLight}
            style={styles.chatsLogo}
            contentFit="contain"
          />
        </View>
        <TouchableOpacity
          style={styles.addCharacterButton}
          activeOpacity={0.7}
          onPress={onAddPress}
        >
          <Ionicons
            name="person-add-outline"
            size={16}
            color={isDark ? "#fff" : "#6C56FF"}
          />
          <Text
            style={[
              styles.addCharacterText,
              { color: isDark ? "#fff" : "#6C56FF" },
            ]}
          >
            New Characters
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChatsSearch({
  search,
  onSearchChange,
  showSearch,
}: {
  search: string;
  onSearchChange: (text: string) => void;
  showSearch: boolean;
}) {
  const isDark = useColorScheme() === "dark";

  if (!showSearch) return null;

  return (
    <View style={styles.chatsSearch}>
      <CustomInput
        value={search}
        onChangeText={onSearchChange}
        search
        placeholder="Search"
        backgroundColor={isDark ? "#1D1B31" : "#F0EEF9"}
        borderColor={isDark ? "#262626" : "#E0DCF0"}
        borderRadius={15}
      />
    </View>
  );
}

export default function Index() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { openAddContacts } = useAddContactsSheet();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useColorScheme() === "dark";
  const [addingAvailableIds, setAddingAvailableIds] = useState<Set<string>>(
    new Set(),
  );
  const [addedAvailableIds, setAddedAvailableIds] = useState<Set<string>>(
    new Set(),
  );

  useFocusEffect(
    useCallback(() => {
      setSortKey((k) => k + 1);
    }, []),
  );

  useEffect(() => {
    registerAndSyncPushToken();
  }, []);

  const { data: contacts = [], isPending: loading } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const remote = await contactsService.getContacts();
      saveLocalContacts(remote);
      return remote;
    },
    refetchInterval: 1000 * 60 * 5,
    placeholderData: () => {
      try {
        const cached = getLocalContacts();
        return cached.length > 0 ? cached : undefined;
      } catch {
        return undefined;
      }
    },
  });

  const { data: availableContacts = [] } = useQuery({
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

  const { data: unreadSummary } = useUnreadSummary();
  const unreadCounts = useMemo((): Map<string, UnreadInfo> => {
    if (!unreadSummary) return new Map();
    const m = new Map<string, UnreadInfo>();
    unreadSummary.byContact.forEach((v, contactId) => {
      m.set(contactId, { count: v.count, lastContent: null, lastAt: null });
    });
    return m;
  }, [unreadSummary]);

  const lastMessages = useMemo(
    () => getLastMessageByContact(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contacts, sortKey, unreadCounts],
  );

  const getDisplayLastMessage = useCallback(
    (contactId: string): LastMessageInfo | undefined => {
      const base = lastMessages.get(contactId);
      const unread = unreadCounts.get(contactId);

      if (!unread || !unread.lastAt || !unread.lastContent) {
        return base;
      }

      if (!base) {
        return { content: unread.lastContent, createdAt: unread.lastAt };
      }

      const baseTime = new Date(base.createdAt).getTime();
      const unreadTime = new Date(unread.lastAt).getTime();

      if (unreadTime > baseTime) {
        return { content: unread.lastContent, createdAt: unread.lastAt };
      }

      return base;
    },
    [lastMessages, unreadCounts],
  );


  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? contacts.filter((c) => c.name.toLowerCase().includes(q))
      : contacts;

    if (base.length <= 1) return base;

    return [...base].sort((a, b) => {
      const aLast = getDisplayLastMessage(a.id);
      const bLast = getDisplayLastMessage(b.id);

      const aUnread = unreadCounts.get(a.id);
      const bUnread = unreadCounts.get(b.id);

      // Last activity = max(last message time, unread lastAt, addedAt)
      const aTime = Math.max(
        aLast ? new Date(aLast.createdAt).getTime() : 0,
        aUnread?.lastAt ? new Date(aUnread.lastAt).getTime() : 0,
        new Date(a.addedAt).getTime(),
      );

      const bTime = Math.max(
        bLast ? new Date(bLast.createdAt).getTime() : 0,
        bUnread?.lastAt ? new Date(bUnread.lastAt).getTime() : 0,
        new Date(b.addedAt).getTime(),
      );

      return bTime - aTime;
    });
  }, [contacts, search, getDisplayLastMessage, unreadCounts]);

  const availableMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];

    const currentIds = new Set(contacts.map((c) => c.id));

    return availableContacts.filter(
      (c) => !currentIds.has(c.id) && c.name.toLowerCase().includes(q),
    );
  }, [search, contacts, availableContacts]);

  const handleAddAvailable = useCallback(
    async (contactId: string) => {
      setAddingAvailableIds((prev) => new Set(prev).add(contactId));
      try {
        await contactsService.addContact(contactId);
        setAddedAvailableIds((prev) => new Set(prev).add(contactId));
        await queryClient.invalidateQueries({ queryKey: ["contacts"] });
        await queryClient.invalidateQueries({
          queryKey: ["availableContacts"],
        });
        await queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
        await queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      } catch (err) {
        console.error("Failed to add available contact:", err);
      } finally {
        setAddingAvailableIds((prev) => {
          const next = new Set(prev);
          next.delete(contactId);
          return next;
        });
      }
    },
    [queryClient],
  );

  const deleteContact = useCallback(
    async (id: string) => {
      queryClient.setQueryData<Contact[]>(["contacts"], (old) =>
        old ? old.filter((c) => c.id !== id) : [],
      );
      try {
        deleteLocalContact(id);
      } catch (err) {
        console.error("Failed to delete local contact:", err);
      }

      try {
        await contactsService.deleteContact(id);
        queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      } catch (err) {
        console.error("Failed to delete remote contact:", err);
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
      }
    },
    [queryClient],
  );

  const openChat = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      await invalidateUnreadSummary();
      await queryClient.invalidateQueries({ queryKey: REELS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: STORIES_QUERY_KEY });
      setSortKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const { maintenance } = useMaintenanceCheck();

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <MaintenanceModal visible={maintenance} />
        {loading ? (
          <View>
            <Reels />
            <ChatsHeaderSkeleton />
            <ChatRowSkeleton />
          </View>
        ) : (
          <>
            <View>
              <ChatsHeader onAddPress={openAddContacts} />
              <Reels />
              <ChatsSearch
                search={search}
                onSearchChange={setSearch}
                showSearch={contacts.length > 0}
              />
            </View>
            <FlatList
              data={[
                ...filteredContacts.map((c) => ({
                  kind: "contact" as const,
                  contact: c,
                })),
                ...(search.trim().length > 0
                  ? [
                      ...(availableMatches.length > 0
                        ? [{ kind: "availableHeader" as const }]
                        : []),
                      ...availableMatches.map((c) => ({
                        kind: "available" as const,
                        contact: c,
                      })),
                    ]
                  : []),
              ]}
              keyExtractor={(item) =>
                item.kind === "availableHeader"
                  ? "available-header"
                  : item.kind === "contact"
                    ? `contact-${item.contact.id}`
                    : `available-${item.contact.id}`
              }
              renderItem={({ item, index }) =>
                item.kind === "availableHeader" ? (
                  <View style={styles.availableSectionHeader}>
                    <Text
                      style={[
                        styles.availableSectionTitle,
                        { color: isDark ? "#888" : "#6B7280" },
                      ]}
                    >
                      New Characters
                    </Text>
                  </View>
                ) : item.kind === "contact" ? (
                  <ChatRow
                    item={item.contact}
                    lastMessage={getDisplayLastMessage(item.contact.id)}
                    unreadCount={unreadCounts.get(item.contact.id)?.count ?? 0}
                    onDelete={deleteContact}
                    onPress={openChat}
                    isFirst={index === 0}
                  />
                ) : (
                  <AvailableContactRow
                    item={item.contact}
                    onAdd={handleAddAvailable}
                    adding={addingAvailableIds.has(item.contact.id)}
                    added={addedAvailableIds.has(item.contact.id)}
                    isFirst={
                      index ===
                      filteredContacts.length +
                        (availableMatches.length > 0 ? 1 : 0)
                    }
                  />
                )
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={isDark ? "#A78BFA" : "#1A1A2E"}
                  colors={[isDark ? "#A78BFA" : "#1A1A2E"]}
                  progressBackgroundColor={isDark ? "#1E1740" : "#FFFFFF"}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color={isDark ? "#333" : "#C4B5FD"}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDark ? "#888" : "#6B7280" },
                    ]}
                  >
                    No character found
                  </Text>
                </View>
              }
            />
          </>
        )}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
  },
  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6C56FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 4,
  },
  emptyAddText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
  chatsHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    paddingLeft: 22,
  },
  chatsSearch: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  availableSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  availableSectionTitle: {
    fontSize: 12,
    fontFamily: "Outfit-SemiBold",
    textTransform: "uppercase",
  },
  chatsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  chatsHeaderLeft: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  chatsTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  chatsLogo: {
    width: 45,
    height: 45,
  },
  addCharacterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addCharacterText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
  deleteAction: {
    width: DELETE_WIDTH,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#1A1354",
  },
  deleteText: {
    color: "#fff",
    fontSize: 11,
    marginTop: 4,
    fontFamily: "Outfit-Medium",
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.17,
  },
  avatarContainer: {
    position: "relative",
  },
  chatAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  chatInitials: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  chatInitialsText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
  chatMid: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  chatName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
    fontFamily: "Outfit-SemiBold",
  },
  chatMessage: {
    fontSize: 13,
    fontFamily: "Outfit-Regular",
  },
  chatRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
  },
  unreadBadge: {
    backgroundColor: "#6C56FF",
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  availableAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
