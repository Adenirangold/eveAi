import type { Story } from "@/services/stories";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VerifiedBadge from "./VerifiedBadge";

const DISMISS_THRESHOLD = 120;
/** Reference shorter side ~ iPhone 14 width for scaling story text on tablets. */
const STORY_CONTENT_BASE = 390;
const STORY_DURATION = 6000;

interface Props {
  stories: Story[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export default function StoryViewer({
  stories,
  initialIndex,
  visible,
  onClose,
  onStoryViewed,
}: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeIndex = Math.min(
    Math.max(initialIndex, 0),
    Math.max(stories.length - 1, 0),
  );

  const [currentIndex, setCurrentIndex] = useState(safeIndex);
  const indexRef = useRef(safeIndex);
  const flatListRef = useRef<FlatList<Story>>(null);

  const translateY = useSharedValue(0);
  const backdropOpacity = useSharedValue(1);
  const progressValue = useSharedValue(0);

  const trackPixelWidth = winW - 24;
  const contentScale = Math.min(
    1.5,
    Math.max(1, Math.min(winW, winH) / STORY_CONTENT_BASE),
  );
  const headerScale = Math.min(contentScale, 1.2);

  // ── JS callbacks used from worklets ─────────────────
  const dismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const goToNextStory = useCallback(() => {
    const current = indexRef.current;
    const atLast = current >= stories.length - 1;
    if (atLast) {
      dismiss();
      return;
    }

    const next = current + 1;
    indexRef.current = next;
    setCurrentIndex(next);
    flatListRef.current?.scrollToIndex({
      index: next,
      animated: true,
    });
  }, [stories.length, dismiss]);

  // ── Progress timer ──────────────────────────────────
  const startProgress = useCallback(
    (from?: number) => {
      cancelAnimation(progressValue);
      const start = typeof from === "number" ? from : 0;
      const remaining = (1 - start) * STORY_DURATION;
      progressValue.value = start;
      progressValue.value = withTiming(
        1,
        { duration: remaining, easing: Easing.linear },
        (finished) => {
          "worklet";
          if (!finished) return;
          runOnJS(goToNextStory)();
        },
      );
    },
    [progressValue, goToNextStory],
  );

  const resumeProgress = useCallback(() => {
    const current = progressValue.value;
    if (current >= 1) return;
    startProgress(current);
  }, [progressValue, startProgress]);

  useLayoutEffect(() => {
    if (visible) {
      indexRef.current = safeIndex;
      setCurrentIndex(safeIndex);
      translateY.value = 0;
      backdropOpacity.value = 1;
      progressValue.value = 0;
    } else {
      cancelAnimation(progressValue);
    }
  }, [visible, safeIndex]);

  useEffect(() => {
    if (visible) {
      startProgress();
      const story = stories[currentIndex];
      if (story && onStoryViewed) onStoryViewed(story.id);
    }
  }, [currentIndex, visible, startProgress]);

  // ── Pan gesture (UI thread) ─────────────────────────
  const panGesture = Gesture.Pan()
    .activeOffsetY(15)
    .failOffsetX([-15, 15])
    .onStart(() => {
      "worklet";
      cancelAnimation(progressValue);
    })
    .onUpdate((e) => {
      "worklet";
      translateY.value = Math.max(0, e.translationY);
      backdropOpacity.value = Math.max(
        0,
        1 - e.translationY / (winH * 0.45),
      );
    })
    .onEnd((e) => {
      "worklet";
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(winH, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(dismiss)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        backdropOpacity.value = withTiming(1, { duration: 150 });
        runOnJS(startProgress)();
      }
    });

  // ── Animated styles (UI thread) ─────────────────────
  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: progressValue.value * trackPixelWidth,
  }));

  // ── FlatList viewability ────────────────────────────
  const onViewable = useRef(({ viewableItems }: any) => {
    const idx = viewableItems?.[0]?.index;
    if (idx != null) {
      indexRef.current = idx;
      setCurrentIndex(idx);
    }
  }).current;

  const viewCfg = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  // ── Horizontal swipe on last story should dismiss ────
  const handleHorizontalRelease = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityX = e.nativeEvent.velocity?.x ?? 0;

      if (indexRef.current === stories.length - 1 && velocityX < -0.5) {
        translateY.value = withTiming(winH, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 250 }, () => {
          runOnJS(dismiss)();
        });
      }
    },
    [stories.length, translateY, backdropOpacity, dismiss],
  );

  const handleClose = useCallback(() => {
    cancelAnimation(progressValue);
    onClose();
  }, [onClose, progressValue]);

  const handleShare = useCallback(async () => {
    const currentStory = stories[indexRef.current] ?? stories[0];
    if (!currentStory) return;

    const cleanText = currentStory.content?.replace(/^['"]+|['"]+$/g, "") ?? "";
    const shareUrl = `https://eveai-app.binahstudio.com/story/share/${currentStory.contact.slug}`;
    const message = `${currentStory.contact.name}\n\n${cleanText}\n\n${shareUrl}`;

    cancelAnimation(progressValue);
    try {
      await Share.share({ message });
    } finally {
      resumeProgress();
    }
  }, [stories, progressValue, resumeProgress]);

  if (!visible || stories.length === 0) return null;

  const story = stories[currentIndex] ?? stories[0];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={vs.root}>
        <Animated.View style={[vs.backdrop, backdropAnimStyle]} />
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[vs.sheet, sheetAnimStyle]}>
            <FlatList
              ref={flatListRef}
              data={stories}
              keyExtractor={(i) => i.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={safeIndex}
              extraData={`${winW}x${winH}`}
              getItemLayout={(_, i) => ({
                length: winW,
                offset: winW * i,
                index: i,
              })}
              onViewableItemsChanged={onViewable}
              viewabilityConfig={viewCfg}
              onScrollEndDrag={handleHorizontalRelease}
              renderItem={({ item }) => {
                const bg =
                  item.backgroundColor.length >= 2
                    ? (item.backgroundColor as [string, string, ...string[]])
                    : ([item.backgroundColor[0], item.backgroundColor[0]] as [
                        string,
                        string,
                      ]);
                return (
                  <Pressable
                    style={[vs.page, { width: winW, height: winH }]}
                    delayLongPress={250}
                    onLongPress={() => {
                      cancelAnimation(progressValue);
                    }}
                    onPressOut={() => {
                      resumeProgress();
                    }}
                  >
                    <LinearGradient
                      colors={bg}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    />
                    <View
                      style={[
                        vs.center,
                        { paddingHorizontal: 36 * contentScale },
                      ]}
                    >
                      <Text
                        style={[
                          vs.quote,
                          {
                            fontSize: 22 * contentScale,
                            lineHeight: 34 * contentScale,
                          },
                        ]}
                      >
                        {item.content?.replace(/^['"]+|['"]+$/g, "")}
                      </Text>
                      <Text
                        style={[
                          vs.attribution,
                          {
                            fontSize: 18 * contentScale,
                            marginTop: 16 * contentScale,
                          },
                        ]}
                      >
                        — {item.contact.name} —
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />

            {/* Progress bar */}
            <View style={[vs.progressRow, { top: insets.top + 10 }]}>
              <View style={vs.track}>
                <Animated.View style={[vs.fill, progressAnimStyle]} />
              </View>
            </View>

            {/* Header */}
            <View style={[vs.header, { top: insets.top + 22 }]}>
              <View style={vs.user}>
                <ExpoImage
                  source={story.contact.avatar}
                  style={[
                    vs.hAvatar,
                    {
                      width: 32 * headerScale,
                      height: 32 * headerScale,
                      borderRadius: 16 * headerScale,
                    },
                  ]}
                  contentFit="cover"
                />
                <Text style={[vs.hName, { fontSize: 14 * headerScale }]}>
                  {story.contact.name}
                </Text>
                {story.contact.isPremium && (
                  <VerifiedBadge size={Math.round(14 * headerScale)} />
                )}
                <Text style={[vs.hTime, { fontSize: 12 * headerScale }]}>
                  {timeAgo(story.createdAt)}
                </Text>
              </View>

              <View style={vs.headerActions}>
                <TouchableOpacity
                  onPress={handleShare}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <Ionicons
                    name="share-social"
                    size={Math.round(20 * headerScale)}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <Ionicons
                    name="close"
                    size={Math.round(30 * headerScale)}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

const vs = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    flex: 1,
  },
  page: {
    flexShrink: 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quote: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Outfit-Regular",
    fontStyle: "italic",
  },
  attribution: {
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontFamily: "Outfit-Regular",
  },
  progressRow: {
    position: "absolute",
    left: 12,
    right: 12,
  },
  track: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  header: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  user: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hAvatar: {
    backgroundColor: "#1C1C2E",
  },
  hName: {
    color: "#fff",
    fontWeight: "700",
  },
  hTime: {
    color: "rgba(255,255,255,0.55)",
  },
  x: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  tooltip: {
    position: "absolute",
    right: 32,
    top: 30,
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  tooltipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
