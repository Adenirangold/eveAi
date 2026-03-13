import BibleRefModal from "@/components/BibleRefModal";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { invalidateUnreadSummary } from "@/hooks/useUnreadSummary";
import { setActiveChatId } from "@/lib/active-chat";
import { formatRefLabel } from "@/lib/bible";
import { ChatMessage, chatService } from "@/services/chat";
import { contactsService, type Contact } from "@/services/contacts";
import { unreadService } from "@/services/unread";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
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
import Popover from "react-native-popover-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFakePresence } from "@/lib/presence";

type MessageStatus = "pending" | "sent" | "delivered" | "failed";

interface ExtendedMessage extends IMessage {
  bibleRefs?: string[] | null;
  status?: MessageStatus;
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
  const [copiedVisible, setCopiedVisible] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<
    string | number | null
  >(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const copiedSlideAnim = useRef(new Animated.Value(20)).current;
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<RNFlatList>(null);
  const [isOnline, setIsOnline] = useState(true);
  const retryCountsRef = useRef<Map<string, number>>(new Map());
  const wasOnlineRef = useRef<boolean | null>(null);

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
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      setIsOnline(online);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // When network comes back, retry pending (clock) messages up to 2 times.
  useEffect(() => {
    if (!id) {
      wasOnlineRef.current = isOnline;
      return;
    }

    // Only act on transitions from offline -> online.
    if (isOnline && wasOnlineRef.current === false) {
      const current =
        queryClient.getQueryData<ChatMessage[]>(["chat", id]) ?? [];
      const pending = current.filter(
        (m) => m.role === "user" && m.status === "pending",
      );

      pending.forEach((m) => {
        const attempts = retryCountsRef.current.get(m.id) ?? 0;
        if (attempts >= 2) {
          // Mark as failed (red info) after max retries.
          queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) =>
            old.map((msg) =>
              msg.id === m.id
                ? { ...msg, status: "failed" as MessageStatus }
                : msg,
            ),
          );
          return;
        }

        retryCountsRef.current.set(m.id, attempts + 1);

        chatService
          .sendMessage(id, m.content)
          .then(({ userMessage, assistantMessage }) => {
            const deliveredUserMessage: ChatMessage = {
              ...userMessage,
              status: "delivered",
            };
            queryClient.setQueryData<ChatMessage[]>(
              ["chat", id],
              (old = []) => {
                const withoutOld = old.filter((msg) => msg.id !== m.id);
                return [...withoutOld, deliveredUserMessage, assistantMessage];
              },
            );
          })
          .catch(() => {
            const currentAttempts = retryCountsRef.current.get(m.id) ?? 0;
            if (currentAttempts >= 2) {
              queryClient.setQueryData<ChatMessage[]>(
                ["chat", id],
                (old = []) =>
                  old.map((msg) =>
                    msg.id === m.id
                      ? { ...msg, status: "failed" as MessageStatus }
                      : msg,
                  ),
              );
            }
          });
      });
    }

    wasOnlineRef.current = isOnline;
  }, [id, isOnline, queryClient]);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
        copiedTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (copiedVisible) {
      copiedSlideAnim.setValue(20);
      Animated.timing(copiedSlideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [copiedVisible, copiedSlideAnim]);

  useEffect(() => {
    if (!id) return;
    setActiveChatId(id);
    unreadService.markRead(id).finally(invalidateUnreadSummary);
    return () => setActiveChatId(null);
  }, [id]);

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

  useEffect(() => {
    if (!id || messages.length === 0) return;
    unreadService.markRead(id).finally(invalidateUnreadSummary);
  }, [id, messages.length]);

  const handleViewProfile = useCallback(() => {
    if (id) router.push(`/contact/${id}`);
    setMenuVisible(false);
  }, [id, router]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!id || !text) return;

    setInputText("");
    if (id) AsyncStorage.removeItem(getDraftKey(id));

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
      // If we're online, show a single tick (sent).
      // If we're offline, mark as pending so we only ever show the clock for clearly failed sends.
      status: (isOnline ? "sent" : "pending") as MessageStatus,
    };

    queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) => [
      ...old,
      optimisticMsg,
    ]);
    scrollToEnd();

    // If we're offline, don't try to send now – leave it as a pending clock and don't show typing.
    if (!isOnline) {
      return;
    }

    // Start typing indicator 1s after sending
    const typingTimeout = setTimeout(() => {
      setIsSending(true);
    }, 1000);

    try {
      const { userMessage, assistantMessage } = await chatService.sendMessage(
        id,
        text,
      );

      // When the assistant reply is ready, mark the user message as delivered (double tick)
      const deliveredUserMessage: ChatMessage = {
        ...userMessage,
        status: "delivered",
      };

      queryClient.setQueryData<ChatMessage[]>(["chat", id], (old = []) => {
        const withoutOptimistic = old.filter((m) => m.id !== tempId);
        return [...withoutOptimistic, deliveredUserMessage, assistantMessage];
      });
      scrollToEnd();

      // Stop typing once the assistant message is ready
      clearTimeout(typingTimeout);
      setIsSending(false);
    } catch {
      clearTimeout(typingTimeout);
      // On failure while online, keep the last known status so the UI doesn't downgrade.
      setIsSending(false);
    }
  }, [id, inputText, isOnline, queryClient, scrollToEnd]);

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

      const handleCopy = () => {
        if (!msg?.text) return;
        Clipboard.setStringAsync(msg.text);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCopiedVisible(true);
        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => {
          setCopiedVisible(false);
          copiedTimeoutRef.current = null;
        }, 1400);
      };

      return (
        <View>
          <View style={[styles.bubbleRow, { flexDirection: "row" }]}>
            <View style={styles.bubbleWithMenu}>
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

                  if (msg.status === "failed") {
                    return (
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color="#F87171"
                        style={{ marginRight: 2, marginBottom: 2 }}
                      />
                    );
                  }

                  return null;
                }}
              />
              {isLeft && msg?.text ? (
                <Popover
                  isVisible={activeMessageMenuId === msg._id}
                  onRequestClose={() => setActiveMessageMenuId(null)}
                  popoverStyle={[
                    styles.messageMenu,
                    {
                      backgroundColor: isDark ? "#64686e" : "#F9FAFB",
                    },
                  ]}
                  from={
                    <TouchableOpacity
                      onPress={() =>
                        setActiveMessageMenuId((current) =>
                          current === msg._id ? null : msg._id,
                        )
                      }
                      activeOpacity={0.7}
                      hitSlop={6}
                      style={styles.messageMenuTrigger}
                    >
                      <Ionicons
                        name="ellipsis-vertical"
                        size={18}
                        color={isDark ? "#E8E8E8" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  }
                >
                  <TouchableOpacity
                    style={styles.messageMenuItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      handleCopy();
                      setActiveMessageMenuId(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.messageMenuText,
                        { color: isDark ? "#E5E7EB" : "#111827" },
                      ]}
                    >
                      Copy
                    </Text>
                    <Ionicons
                      name="copy-outline"
                      size={18}
                      color={isDark ? "#E5E7EB" : "#111827"}
                    />
                  </TouchableOpacity>
                </Popover>
              ) : null}
            </View>
          </View>
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
    [isDark, activeMessageMenuId],
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
                {(() => {
                  if (isSending) {
                    return "Typing...";
                  }

                  const now = new Date();

                  // If there has been very recent conversation activity
                  // (either from the assistant or the user), treat the
                  // contact as definitely online regardless of the
                  // background fake schedule.
                  const lastAssistantMessage = messages.find(
                    (m) => m.user?._id === 2,
                  );

                  const lastUserMessage = messages.find(
                    (m) => m.user?._id === 1,
                  );

                  const times: number[] = [];

                  if (lastAssistantMessage?.createdAt) {
                    const createdAt =
                      lastAssistantMessage.createdAt instanceof Date
                        ? lastAssistantMessage.createdAt.getTime()
                        : new Date(lastAssistantMessage.createdAt).getTime();
                    times.push(createdAt);
                  }

                  if (lastUserMessage?.createdAt) {
                    const createdAt =
                      lastUserMessage.createdAt instanceof Date
                        ? lastUserMessage.createdAt.getTime()
                        : new Date(lastUserMessage.createdAt).getTime();
                    times.push(createdAt);
                  }

                  if (times.length > 0) {
                    const lastInteraction = Math.max(...times);
                    const diffMinutes = (now.getTime() - lastInteraction) / 60000;

                    // Within the last 10 minutes after any activity, always show Online.
                    if (diffMinutes >= 0 && diffMinutes < 10) {
                      return "Online";
                    }
                  }

                  const presence = getFakePresence(contact.id, now);

                  if (presence.status === "online") {
                    return "Online";
                  }

                  if (presence.status === "recently_online") {
                    const mins = presence.lastSeenMinutesAgo ?? 0;
                    if (mins < 1) return "Last seen just now";
                    if (mins < 60) {
                      return `Last seen ${mins} min ago`;
                    }
                    const hours = Math.floor(mins / 60);
                    if (hours === 1) return "Last seen 1 hour ago";
                    return `Last seen ${hours} hours ago`;
                  }

                  return "Offline";
                })()}
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
            <Ionicons name="ellipsis-horizontal" size={20} color={iconColor} />
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
      {copiedVisible && (
        <View style={styles.copiedOverlay}>
          <Animated.View
            style={{ transform: [{ translateY: copiedSlideAnim }] }}
          >
            <View
              style={[
                styles.copiedToast,
                { backgroundColor: isDark ? "#111827" : "#111827" },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={styles.copiedText}>Message copied</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    position: "relative",
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
  bubbleRow: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
    alignSelf: "flex-start",
  },
  bubbleWithMenu: {
    position: "relative",
    maxWidth: "100%",
  },
  messageMenuTrigger: {
    position: "absolute",
    right: -30,
    bottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  messageMenu: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  messageMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
    gap: 6,
  },
  messageMenuText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
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
  copiedOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 140,
    alignItems: "center",
    zIndex: 50,
  },
  copiedToast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 8,
  },
  copiedText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontFamily: "Outfit-Medium",
  },
});
