import { ChatMessage, chatService } from "@/services/chat";
import { Contact } from "@/services/contacts";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Bubble,
  GiftedChat,
  type BubbleProps,
  type IMessage,
} from "react-native-gifted-chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";

const BUBBLE_AVATAR_SIZE = 30;

const AVATAR_SIZE = 38;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function toGiftedMessages(
  msgs: ChatMessage[],
  contact: Contact | null,
): IMessage[] {
  return msgs
    .filter((m) => m?.id != null)
    .map((m) => ({
      _id: m.id,
      text: m.content,
      createdAt: new Date(m.createdAt),
      user:
        m.role === "user"
          ? { _id: 1 }
          : {
              _id: 2,
              name: contact?.name ?? "AI",
              avatar: contact?.avatar ?? undefined,
            },
    }))
    .reverse();
}

const TypingIndicator = React.memo(() => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );

    const anims = [animateDot(dot1, 0), animateDot(dot2, 200), animateDot(dot3, 400)];
    anims.forEach((a) => a.start());
    return () => {
      anims.forEach((a) => a.stop());
      dot1.setValue(0.3);
      dot2.setValue(0.3);
      dot3.setValue(0.3);
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
});

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();

  const [menuVisible, setMenuVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const contact = useMemo(() => {
    const contacts = queryClient.getQueryData<Contact[]>(["contacts"]);
    return contacts?.find((c) => c.id === id) ?? null;
  }, [id, queryClient]);

  const localMessages = useMemo(
    () => (id ? chatService.getLocalMessages(id) : []),
    [id],
  );

  const { data: messages = [], isPending: loading } = useQuery({
    queryKey: ["chat", id],
    queryFn: () => chatService.fetchAndSync(id!),
    enabled: !!id,
    initialData: localMessages.length > 0 ? localMessages : undefined,
    refetchInterval: isSending ? false : 10_000,
    select: (data) => toGiftedMessages(data, contact),
  });

  const handleViewProfile = useCallback(() => {
    if (id) router.push(`/contact/${id}`);
    setMenuVisible(false);
  }, [id, router]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!id || !text) return;

    setInputText("");
    setIsSending(true);

    await queryClient.cancelQueries({ queryKey: ["chat", id] });

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      userId: "",
      contactId: id,
      role: "user",
      content: text,
      bibleRefs: null,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) => [
      ...old,
      optimisticMsg,
    ]);

    try {
      const { userMessage, assistantMessage } = await chatService.sendMessage(
        id,
        text,
      );

      queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) => {
        const withoutOptimistic = old.filter((m) => m.id !== tempId);
        return [...withoutOptimistic, userMessage, assistantMessage];
      });
    } catch {
      queryClient.invalidateQueries({ queryKey: ["chat", id] });
    } finally {
      setIsSending(false);
    }
  }, [id, inputText, queryClient]);

  const onGiftedSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!id || newMessages.length === 0) return;
      handleSend();
    },
    [id, handleSend],
  );

  const renderBubble = useCallback(
    (props: BubbleProps<IMessage>) => (
      <Bubble
        {...props}
        wrapperStyle={{
          right: styles.bubbleRight,
          left: styles.bubbleLeft,
        }}
        textStyle={{
          right: styles.bubbleTextRight as TextStyle,
          left: styles.bubbleTextLeft as TextStyle,
        }}
        tickStyle={{ color: "#6C56FF" }}
      />
    ),
    [],
  );

  const renderAvatar = useCallback(
    (props: any) => {
      const avatarUri = contact?.avatar;
      if (props.currentMessage?.user?._id === 1) return null;

      if (avatarUri) {
        return (
          <ExpoImage
            source={avatarUri}
            style={styles.bubbleAvatar}
            contentFit="cover"
          />
        );
      }

      return (
        <View style={styles.bubbleAvatarFallback}>
          <Text style={styles.bubbleAvatarText}>
            {getInitials(contact?.name ?? "AI")}
          </Text>
        </View>
      );
    },
    [contact],
  );

  const renderInputToolbar = useCallback(() => {
    return (
      <View
        style={[
          styles.customInputWrapper,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Write your message"
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            blurOnSubmit={false}
            returnKeyType="default"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.7}
            hitSlop={8}
            style={styles.sendButton}
          >
            <Ionicons name="send" size={20} color="#6C56FF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [inputText, handleSend, insets.bottom]);

  const renderFooter = useCallback(() => {
    if (!isSending) return null;
    return <TypingIndicator />;
  }, [isSending]);

  const chatUser = useMemo(
    () => ({ _id: 1, name: user?.name ?? "Me" }),
    [user],
  );

  return (
    <View style={styles.safe}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        {contact && (
          <TouchableOpacity
            style={styles.headerInfo}
            activeOpacity={0.7}
            onPress={() => router.push(`/contact/${id}`)}
          >
            {contact.avatar ? (
              <ExpoImage
                source={contact.avatar}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>
                  {getInitials(contact.name)}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.headerName}>{contact.name}</Text>
              <Text style={styles.headerStatus}>
                {isSending ? "Typing..." : "Online"}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.menuWrapper}>
          <TouchableOpacity
            onPress={() => setMenuVisible((v) => !v)}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>

          {menuVisible && (
            <Modal
              transparent
              animationType="fade"
              visible={menuVisible}
              onRequestClose={() => setMenuVisible(false)}
            >
              <Pressable
                style={[styles.menuOverlay, { paddingTop: insets.top + 50 }]}
                onPress={() => setMenuVisible(false)}
              >
                <View style={styles.dropdown}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    activeOpacity={0.7}
                    onPress={handleViewProfile}
                  >
                    <Ionicons name="person-outline" size={16} color="#fff" />
                    <Text style={styles.dropdownText}>View Profile</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onGiftedSend}
          user={chatUser}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderFooter={renderFooter}
          renderAvatar={renderAvatar}
          isScrollToBottomEnabled
          scrollToBottomStyle={styles.scrollToBottom}
          keyboardAvoidingViewProps={{ enabled: false }}
          listProps={{
            keyboardDismissMode: "on-drag" as const,
            keyboardShouldPersistTaps: "handled" as const,
          }}
          timeTextStyle={{
            right: { color: "rgba(255,255,255,0.5)" },
            left: { color: "rgba(255,255,255,0.4)" },
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0A0A0B",
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111114",
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
  },
  initialsAvatar: {
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
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
  headerStatus: {
    color: "#6C56FF",
    fontSize: 14,
    fontFamily: "Outfit-Regular",
  },
  menuWrapper: {
    position: "relative",
  },
  menuButton: {
    padding: 6,
  },
  menuOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  bubbleAvatar: {
    width: BUBBLE_AVATAR_SIZE,
    height: BUBBLE_AVATAR_SIZE,
    borderRadius: BUBBLE_AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    marginRight: 4,
    marginBottom: 2,
  },
  bubbleAvatarFallback: {
    width: BUBBLE_AVATAR_SIZE,
    height: BUBBLE_AVATAR_SIZE,
    borderRadius: BUBBLE_AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    marginBottom: 2,
  },
  bubbleAvatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Outfit-SemiBold",
  },
  bubbleRight: {
    backgroundColor: "#6C56FF",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginVertical: 2,
  },
  bubbleLeft: {
    backgroundColor: "#1C1C2E",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 2,
    paddingVertical: 1,
    marginVertical: 2,
  },
  bubbleTextRight: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 21,
  },
  bubbleTextLeft: {
    color: "#E8E8E8",
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 21,
  },
  customInputWrapper: {
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: "#111114",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C2E",
    borderRadius: 28,
    paddingHorizontal: 18,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "Outfit-Regular",
    paddingTop: 14,
    paddingBottom: 14,
    maxHeight: 100,
  },
  sendButton: {
    padding: 6,
    marginLeft: 8,
  },
  scrollToBottom: {
    backgroundColor: "#1C1C2E",
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 0.5,
  },
  typingRow: {
    paddingLeft: 10 + BUBBLE_AVATAR_SIZE + 4,
    paddingBottom: 10,
  },
  typingBubble: {
    backgroundColor: "#1C1C2E",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6C56FF",
    marginHorizontal: 3,
  },
});
