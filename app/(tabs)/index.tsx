import Background from "@/components/BackGround";
import Reels from "@/components/reels";
import React from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatItem = {
  id: string;
  name: string;
  message: string;
  time: string;
  avatar?: ImageSourcePropType;
  initials?: string;
  avatarBg?: string;
  isOnline?: boolean;
  unread?: number;
  isSelected?: boolean;
};

const CHATS: ChatItem[] = [
  {
    id: "1",
    name: "X-AE-A-13b",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
    isOnline: true,
  },
  {
    id: "2",
    name: "Jerome White",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
    isOnline: true,
  },
  {
    id: "3",
    name: "Madagascar Silver",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
    unread: 999,
  },
  {
    id: "4",
    name: "Pippins McGray",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
  },
  {
    id: "5",
    name: "McKinsey Vermillion",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
    isSelected: true,
  },
  {
    id: "6",
    name: "Dorian F. Gray",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
    unread: 2,
  },
  {
    id: "7",
    name: "Benedict Combersmacks",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
  },
  {
    id: "8",
    name: "Kaori D. Miyazono",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
  },
  {
    id: "9",
    name: "Kaori D. Miyazono",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
  },
  {
    id: "10",
    name: "Kaori D. Miyazono",
    message: "Enter your message description here...",
    time: "12:25",
    avatar: require("@/assets/images/icon.png"),
  },
];

function ChatRow({ item }: { item: ChatItem }) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.chatRow, item.isSelected && styles.chatRowSelected]}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={item.avatar} style={styles.chatAvatar} />
        ) : (
          <View
            style={[
              styles.chatInitials,
              item.avatarBg ? { backgroundColor: item.avatarBg } : undefined,
            ]}
          >
            <Text style={styles.chatInitialsText}>{item.initials}</Text>
          </View>
        )}
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.chatMid}>
        <Text style={styles.chatName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {item.message}
        </Text>
      </View>

      <View style={styles.chatRight}>
        <Text style={styles.chatTime}>{item.time}</Text>
        {item.unread ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function ChatsHeader() {
  return (
    <View style={styles.chatsHeader}>
      <Text style={styles.chatsTitle}>Chats</Text>
    </View>
  );
}

function ListHeader() {
  return (
    <>
      <Reels />
      <ChatsHeader />
    </>
  );
}

export default function Index() {
  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <ListHeader />
        <FlatList
          data={CHATS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatRow item={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Background>
  );
}

const AVATAR_SIZE = 50;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  chatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  chatsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  chatRowSelected: {
    backgroundColor: "#1A1640",
    borderRadius: 16,
    marginHorizontal: 8,
    paddingHorizontal: 16,
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
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  chatInitialsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#0A0A0B",
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
  },
  chatMessage: {
    color: "#888",
    fontSize: 13,
  },
  chatRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  chatTime: {
    color: "#888",
    fontSize: 12,
  },
  badge: {
    backgroundColor: "#6C56FF",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
