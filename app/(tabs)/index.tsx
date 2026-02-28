import { useAddContactsSheet } from "@/app/(tabs)/_layout";
import Background from "@/components/BackGround";
import CustomInput from "@/components/CustomInput";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import Reels from "@/components/reels";
import ChatRowSkeleton from "@/components/skeleton/ChatRowSkeleton";
import ChatsHeaderSkeleton from "@/components/skeleton/ChatsHeaderSkeleton";
import {
  deleteLocalContact,
  getLocalContacts,
  saveLocalContacts,
} from "@/lib/database";
import { Contact, contactsService } from "@/services/contacts";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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
import { SvgUri } from "react-native-svg";

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
      <TouchableOpacity activeOpacity={0.7} style={styles.chatRow} onPress={handlePress}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <View style={styles.chatAvatar}>
              <SvgUri
                uri={item.avatar}
                width={AVATAR_SIZE}
                height={AVATAR_SIZE}
              />
            </View>
          ) : (
            <View style={styles.chatInitials}>
              <Text style={styles.chatInitialsText}>
                {getInitials(item.name)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatMid}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.bio}
          </Text>
        </View>

        <View style={styles.chatRight}>
          <Text style={styles.chatTime}>{formatTime(item.addedAt)}</Text>
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
  return (
    <View style={styles.chatsHeader}>
      <View style={styles.chatsTitleRow}>
        <Text style={styles.chatsTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.addCharacterButton}
          activeOpacity={0.7}
          onPress={onAddPress}
        >
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={styles.addCharacterText}>Add</Text>
        </TouchableOpacity>
      </View>
      {showSearch && (
        <CustomInput
          value={search}
          onChangeText={onSearchChange}
          search
          placeholder="Search"
          backgroundColor="#1D1B31"
          borderColor="#262626"
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
                <ChatRow item={item} onDelete={deleteContact} onPress={openChat} />
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
                  <Ionicons name="people-outline" size={48} color="#333" />
                  <Text style={styles.emptyText}>No characters yet</Text>
                  <TouchableOpacity
                    style={styles.emptyAddButton}
                    activeOpacity={0.7}
                    onPress={openAddContacts}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#fff" />
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
    color: "#888",
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
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  addCharacterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6C56FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addCharacterText: {
    color: "#fff",
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
    borderBottomColor: "#1A1354",
    // backgroundColor: "#0D0B1E",
  },
  avatarContainer: {
    position: "relative",
  },
  chatAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    overflow: "hidden",
  },
  chatInitials: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  chatInitialsText: {
    color: "#fff",
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
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
    fontFamily: "Outfit-SemiBold",
  },
  chatMessage: {
    color: "#888",
    fontSize: 13,
    fontFamily: "Outfit-Regular",
  },
  chatRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  chatTime: {
    color: "#888",
    fontSize: 12,
    fontFamily: "Outfit-Regular",
  },
});
