import BibleRefModal from "@/components/BibleRefModal";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { setActiveChatId } from "@/lib/active-chat";
import { cleanRef, formatRefLabel } from "@/lib/bible";
import { clearUnread } from "@/lib/database";
import { ChatMessage, chatService } from "@/services/chat";
import { contactsService, type Contact } from "@/services/contacts";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  FlatList as RNFlatList,
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

interface ExtendedMessage extends IMessage {
  bibleRefs?: string[] | null;
  status?: "pending" | "sent" | "delivered";
}

const DRAFT_KEY_PREFIX = "chat_draft_";
const getDraftKey = (chatId: string) => `${DRAFT_KEY_PREFIX}${chatId}`;

const BUBBLE_AVATAR_SIZE = 25;

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
): ExtendedMessage[] {
  return msgs
    .filter((m) => m?.id != null)
    .map((m) => ({
      _id: m.id,
      text: m.content,
      createdAt: new Date(m.createdAt),
      bibleRefs: m.bibleRefs,
      status: m.status,
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
  const isDark = useColorScheme() === "dark";
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

    const anims = [
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ];
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
      <View
        style={[
          styles.typingBubble,
          { backgroundColor: isDark ? "#1C1C2E" : "#EDEBF6" },
        ]}
      >
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
  const isDark = useColorScheme() === "dark";

  const [menuVisible, setMenuVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [bibleModalRefs, setBibleModalRefs] = useState<string[] | null>(null);
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<RNFlatList>(null);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(getDraftKey(id)).then((draft) => {
      if (draft) setInputText(draft);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setActiveChatId(id);
    clearUnread(id);
    queryClient.invalidateQueries({ queryKey: ["unreadCounts"] });
    return () => {
      setActiveChatId(null);
    };
  }, [id, queryClient]);

  const handleTextChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (id) {
        if (text) {
          AsyncStorage.setItem(getDraftKey(id), text);
        } else {
          AsyncStorage.removeItem(getDraftKey(id));
        }
      }
    },
    [id],
  );

  const { data: contact } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsService.getContacts(),
    select: (data) => (data ?? []).find((c) => c.id === id) ?? null,
    enabled: !!id,
  });

  const localMessages = useMemo(
    () => (id ? chatService.getLocalMessages(id) : []),
    [id],
  );

  const { data: messages = [], isPending: loading } = useQuery({
    queryKey: ["chat", id],
    queryFn: () => chatService.fetchAndSync(id!),
    enabled: !!id,
    initialData: localMessages.length > 0 ? localMessages : undefined,
    refetchInterval: isSending ? false : 3000,
    refetchIntervalInBackground: false,
    select: (data) => {
      // Derive sent / delivered status for non-optimistic user messages
      const withStatus: ChatMessage[] = data.map((m) => ({ ...m }));

      // Find index of last user message without an explicit status (ignore optimistic 'pending')
      let lastUserIdx = -1;
      for (let i = 0; i < withStatus.length; i++) {
        const m = withStatus[i];
        if (m.role === "user" && !m.status) {
          lastUserIdx = i;
        }
      }

      if (lastUserIdx >= 0) {
        const lastUser = withStatus[lastUserIdx];
        const lastUserTime = new Date(lastUser.createdAt).getTime();

        const hasResponseAfter = withStatus.some(
          (m) =>
            m.role === "assistant" &&
            new Date(m.createdAt).getTime() > lastUserTime,
        );

        withStatus[lastUserIdx] = {
          ...lastUser,
          status: hasResponseAfter ? "delivered" : "sent",
        };

        for (let i = 0; i < lastUserIdx; i++) {
          const m = withStatus[i];
          if (m.role === "user" && !m.status) {
            withStatus[i] = { ...m, status: "sent" };
          }
        }
      }

      return toGiftedMessages(withStatus, contact ?? null);
    },
  });

  const handleViewProfile = useCallback(() => {
    if (id) router.push(`/contact/${id}`);
    setMenuVisible(false);
  }, [id, router]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!id || !text) return;

    setInputText("");
    if (id) AsyncStorage.removeItem(getDraftKey(id));
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
      status: "pending",
    };

    queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) => [
      ...old,
      optimisticMsg,
    ]);
    scrollToEnd();

    try {
      const { userMessage, assistantMessage } = await chatService.sendMessage(
        id,
        text,
      );

      queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) => {
        const withoutOptimistic = old.filter((m) => m.id !== tempId);
        return [...withoutOptimistic, userMessage, assistantMessage];
      });
      scrollToEnd();
    } catch {
      queryClient.invalidateQueries({ queryKey: ["chat", id] });
    } finally {
      setIsSending(false);
    }
  }, [id, inputText, queryClient, scrollToEnd]);

  const onGiftedSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!id || newMessages.length === 0) return;
      handleSend();
    },
    [id, handleSend],
  );

  const renderBubble = useCallback(
    (props: BubbleProps<ExtendedMessage>) => {
      const msg = props.currentMessage as ExtendedMessage | undefined;
      const isLeft = msg?.user?._id !== 1;

      const refsList = msg?.bibleRefs ?? [];

      return (
        <View>
          <Bubble
            {...props}
            wrapperStyle={{
              right: styles.bubbleRight,
              left: {
                ...styles.bubbleLeft,
                backgroundColor: isDark ? "#1C1C2E" : "#EDEBF6",
              },
            }}
            textStyle={{
              right: styles.bubbleTextRight as TextStyle,
              left: {
                ...(styles.bubbleTextLeft as TextStyle),
                color: isDark ? "#E8E8E8" : "#1A1A2E",
              },
            }}
            tickStyle={{ color: "#6C56FF" }}
            renderTicks={() => {
              if (!msg || msg.user?._id !== 1) return null;

              if (msg.status === "pending") {
                return (
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={isDark ? "#D1D5DB" : "#E5E7EB"}
                    style={{ marginRight: 2, marginBottom: 2 }}
                  />
                );
              }

              if (msg.status === "sent") {
                return (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color="#E5E7EB"
                    style={{ marginRight: 2, marginBottom: 2 }}
                  />
                );
              }

              if (msg.status === "delivered") {
                return (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="#E5E7EB"
                    style={{ marginRight: 2, marginBottom: 2 }}
                  />
                );
              }

              return null;
            }}
          />
          {refsList.length > 0 ? (
            <View
              style={[
                styles.refsContainer,
                isLeft ? styles.refsLeft : styles.refsRight,
              ]}
            >
              {refsList.slice(0, 2).map((ref) => (
                <TouchableOpacity
                  key={ref}
                  activeOpacity={0.7}
                  onPress={() => setBibleModalRefs([ref])}
                  style={[
                    styles.refChip,
                    {
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(108,86,255,0.1)",
                    },
                  ]}
                >
                  <Ionicons
                    name="book-outline"
                    size={11}
                    color={isDark ? "#8B7FFF" : "#6C56FF"}
                  />
                  <Text
                    style={[
                      styles.refChipText,
                      { color: isDark ? "#8B7FFF" : "#6C56FF" },
                    ]}
                  >
                    {formatRefLabel(ref)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      );
    },
    [isDark],
  );

  const renderAvatar = useCallback(
    (props: any) => {
      const avatarUri = contact?.avatar;
      if (props.currentMessage?.user?._id === 1) return null;

      if (avatarUri) {
        return (
          <ExpoImage
            source={avatarUri}
            style={[
              styles.bubbleAvatar,
              { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
            ]}
            contentFit="cover"
          />
        );
      }

      return (
        <View
          style={[
            styles.bubbleAvatarFallback,
            { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
          ]}
        >
          <Ionicons
            name="person"
            size={14}
            color={isDark ? "#fff" : "#6C56FF"}
          />
        </View>
      );
    },
    [contact, isDark],
  );

  const renderInputToolbar = useCallback(() => {
    return (
      <View
        style={[
          styles.customInputWrapper,
          {
            paddingBottom: Math.max(insets.bottom, 8) + 5,
            backgroundColor: isDark ? "#111114" : "#F5F3FF",
          },
        ]}
      >
        <View
          style={[
            styles.inputRow,
            { backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF" },
            !isDark && {
              borderWidth: 1,
              borderColor: "#E0DCF0",
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: isDark ? "#fff" : "#1A1A2E" }]}
            placeholder="Write your message"
            placeholderTextColor={isDark ? "#666" : "#9CA3AF"}
            value={inputText}
            onChangeText={handleTextChange}
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
  }, [inputText, handleSend, handleTextChange, insets.bottom, isDark]);

  const renderFooter = useCallback(() => {
    if (!isSending) return null;
    return <TypingIndicator />;
  }, [isSending]);

  const chatUser = useMemo(
    () => ({ _id: 1, name: user?.name ?? "Me" }),
    [user],
  );

  const iconColor = isDark ? "#fff" : "#1A1A2E";

  return (
    <View
      style={[styles.safe, { backgroundColor: isDark ? "#0A0A0B" : "#F5F3FF" }]}
    >
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
          {
            backgroundColor: isDark ? "#111114" : "#FFFFFF",
            borderBottomColor: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={iconColor} />
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
                style={[
                  styles.avatar,
                  { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
                ]}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.initialsAvatar,
                  { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
                ]}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={isDark ? "#fff" : "#6C56FF"}
                />
              </View>
            )}
            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    styles.headerName,
                    { color: isDark ? "#fff" : "#1A1A2E" },
                  ]}
                >
                  {contact.name}
                </Text>
                {contact.isPremium && <VerifiedBadge size={16} />}
              </View>
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
            <Ionicons name="ellipsis-vertical" size={20} color={iconColor} />
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
                <View
                  style={[
                    styles.dropdown,
                    {
                      backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF",
                      shadowOpacity: isDark ? 0.35 : 0.12,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    activeOpacity={0.7}
                    onPress={handleViewProfile}
                  >
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={iconColor}
                    />
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: isDark ? "#fff" : "#1A1A2E" },
                      ]}
                    >
                      View Profile
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          scrollToBottomComponent={() => (
            <Ionicons name="chevron-down" size={22} color={"#1A1A2E"} />
          )}
          scrollToBottomStyle={{
            backgroundColor: "transparent",
            borderWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          }}
          keyboardAvoidingViewProps={{ enabled: false }}
          listProps={{
            ref: flatListRef,
            keyboardDismissMode: "on-drag" as const,
            keyboardShouldPersistTaps: "handled" as const,
          }}
          timeTextStyle={{
            right: { color: "rgba(255,255,255,0.5)" },
            left: {
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)",
            },
          }}
        />
      </KeyboardAvoidingView>

      <BibleRefModal
        visible={!!bibleModalRefs}
        onClose={() => setBibleModalRefs(null)}
        refs={bibleModalRefs ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
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
  },
  initialsAvatar: {
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
  headerName: {
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
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
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
    fontSize: 16,
    fontFamily: "Outfit-Medium",
  },
  bubbleAvatar: {
    width: BUBBLE_AVATAR_SIZE,
    height: BUBBLE_AVATAR_SIZE,
    borderRadius: BUBBLE_AVATAR_SIZE / 2,
    marginRight: 4,
    marginBottom: 2,
  },
  bubbleAvatarFallback: {
    width: BUBBLE_AVATAR_SIZE,
    height: BUBBLE_AVATAR_SIZE,
    borderRadius: BUBBLE_AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
    marginBottom: 2,
  },
  bubbleAvatarText: {
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
    lineHeight: 26,
  },
  bubbleTextLeft: {
    fontSize: 16,
    fontFamily: "Outfit-Regular",
    lineHeight: 26,
  },
  customInputWrapper: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 18,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
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
    borderWidth: 0.5,
  },
  typingRow: {
    paddingLeft: 10 + BUBBLE_AVATAR_SIZE + 4,
    paddingBottom: 10,
  },
  typingBubble: {
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
  refsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 2,
    maxWidth: "85%",
  },
  refsLeft: {
    alignSelf: "flex-start",
  },
  refsRight: {
    alignSelf: "flex-end",
  },
  refChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  refChipText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
  },
});
