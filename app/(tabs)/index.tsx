import { useAddContactsSheet } from "@/app/(tabs)/_layout";
import Background from "@/components/BackGround";
import CustomInput from "@/components/CustomInput";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Reels from "@/components/reels";
import ChatRowSkeleton from "@/components/skeleton/ChatRowSkeleton";
import ChatsHeaderSkeleton from "@/components/skeleton/ChatsHeaderSkeleton";
import {
  deleteLocalContact,
  getLocalContacts,
  saveLocalContacts,
} from "@/lib/database";
import { Contact, contactsService } from "@/services/contacts";
import { registerAndSyncPushToken } from "@/utils/notification";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
  onDelete,
  onPress,
}: {
  item: Contact;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isDark = useColorScheme() === "dark";

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
              <Text
                style={[
                  styles.chatInitialsText,
                  { color: isDark ? "#fff" : "#6C56FF" },
                ]}
              >
                {getInitials(item.name)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatMid}>
          <Text
            style={[
              styles.chatName,
              { color: isDark ? "#fff" : "#1A1A2E" },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.chatMessage,
              { color: isDark ? "#888" : "#6B7280" },
            ]}
            numberOfLines={1}
          >
            {item.bio}
          </Text>
        </View>

        <View style={styles.chatRight}>
          <Text
            style={[
              styles.chatTime,
              { color: isDark ? "#888" : "#9CA3AF" },
            ]}
          >
            {formatTime(item.addedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </ReanimatedSwipeable>
  );
}

function ChatsHeader({
  search,
  onSearchChange,
  onAddPress,
  showSearch,
}: {
  search: string;
  onSearchChange: (text: string) => void;
  onAddPress: () => void;
  showSearch: boolean;
}) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={styles.chatsHeader}>
      <View style={styles.chatsTitleRow}>
        <Text
          style={[
            styles.chatsTitle,
            { color: isDark ? "#fff" : "#1A1A2E" },
          ]}
        >
          Chats
        </Text>
        <TouchableOpacity
          style={[
            styles.addCharacterButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(108,86,255,0.1)",
            },
          ]}
          activeOpacity={0.7}
          onPress={onAddPress}
        >
          <Ionicons
            name="person-add-outline"
            size={18}
            color={isDark ? "#fff" : "#6C56FF"}
          />
          <Text
            style={[
              styles.addCharacterText,
              { color: isDark ? "#fff" : "#6C56FF" },
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>
      {showSearch && (
        <CustomInput
          value={search}
          onChangeText={onSearchChange}
          search
          placeholder="Search"
          backgroundColor={isDark ? "#1D1B31" : "#F0EEF9"}
          borderColor={isDark ? "#262626" : "#E0DCF0"}
          borderRadius={15}
        />
      )}
    </View>
  );
}

export default function Index() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { openAddContacts } = useAddContactsSheet();
  const [search, setSearch] = useState("");
  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    registerAndSyncPushToken();
  }, []);

  const {
    data: contacts = [],
    isPending: loading,
    isFetching,
  } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const remote = await contactsService.getContacts();
      saveLocalContacts(remote);
      return remote;
    },
    placeholderData: () => {
      try {
        const cached = getLocalContacts();
        return cached.length > 0 ? cached : undefined;
      } catch {
        return undefined;
      }
    },
  });

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => c.name.toLowerCase().includes(q));
  }, [contacts, search]);

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
        queryClient.invalidateQueries({ queryKey: ["stories"] });
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

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["stories"] });
  }, [queryClient]);

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <VerifyEmailBanner />
        {loading ? (
          <View>
            <Reels />
            <ChatsHeaderSkeleton />
            <ChatRowSkeleton />
          </View>
        ) : (
          <>
            <View>
              <Reels />
              <ChatsHeader
                search={search}
                onSearchChange={setSearch}
                onAddPress={openAddContacts}
                showSearch={contacts.length > 0}
              />
            </View>
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatRow
                  item={item}
                  onDelete={deleteContact}
                  onPress={openChat}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && !loading}
                  onRefresh={onRefresh}
                  tintColor="#6C56FF"
                  colors={["#6C56FF"]}
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
                    No characters yet
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyAddButton}
                    activeOpacity={0.7}
                    onPress={openAddContacts}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.emptyAddText}>Add Character</Text>
                  </TouchableOpacity>
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
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 70,
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
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  chatsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatsTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  addCharacterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
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
});
