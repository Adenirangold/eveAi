import type { Story } from "@/services/stories";
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
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const DISMISS_THRESHOLD = 120;
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

  const trackPixelWidth = SCREEN_W - 24;

  // ── JS callbacks used from worklets ─────────────────
  const dismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const scrollNext = useCallback(() => {
    const next = indexRef.current + 1;
    if (next >= stories.length) {
      onClose();
    } else {
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }
  }, [stories.length, onClose]);

  // ── Progress timer ──────────────────────────────────
  const startProgress = useCallback(() => {
    cancelAnimation(progressValue);
    progressValue.value = 0;
    progressValue.value = withTiming(
      1,
      { duration: STORY_DURATION, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(scrollNext)();
      },
    );
  }, [progressValue, scrollNext]);

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
        1 - e.translationY / (SCREEN_H * 0.45),
      );
    })
    .onEnd((e) => {
      "worklet";
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 800) {
        translateY.value = withTiming(SCREEN_H, { duration: 250 });
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

  // ── Tap navigation ─────────────────────────────────
  const handleTap = useCallback(
    (locationX: number) => {
      const target =
        locationX < SCREEN_W * 0.3
          ? indexRef.current - 1
          : indexRef.current + 1;

      if (target < 0) return;
      if (target >= stories.length) {
        onClose();
        return;
      }

      flatListRef.current?.scrollToIndex({ index: target, animated: true });
      indexRef.current = target;
      setCurrentIndex(target);
    },
    [stories.length, onClose],
  );

  const handleClose = useCallback(() => {
    cancelAnimation(progressValue);
    onClose();
  }, [onClose, progressValue]);

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
              getItemLayout={(_, i) => ({
                length: SCREEN_W,
                offset: SCREEN_W * i,
                index: i,
              })}
              onViewableItemsChanged={onViewable}
              viewabilityConfig={viewCfg}
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
                    style={vs.page}
                    onPress={(e) => handleTap(e.nativeEvent.locationX)}
                  >
                    <LinearGradient
                      colors={bg}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    />
                    <View style={vs.center}>
                      <Text style={vs.quote}>{item.content}</Text>
                      <Text style={vs.attribution}>
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
                  style={vs.hAvatar}
                  contentFit="cover"
                />
                <Text style={vs.hName}>{story.contact.name}</Text>
                {story.contact.isPremium && <VerifiedBadge size={14} />}
                <Text style={vs.hTime}>{timeAgo(story.createdAt)}</Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={vs.x}>✕</Text>
              </TouchableOpacity>
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
    width: SCREEN_W,
    height: SCREEN_H,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
  },
  quote: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 34,
    fontFamily: "Outfit-Regular",
    fontStyle: "italic",
  },
  attribution: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    marginTop: 16,
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
  user: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1C1C2E",
  },
  hName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  hTime: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  x: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    padding: 4,
  },
});
