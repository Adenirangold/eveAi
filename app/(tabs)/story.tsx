import Background from "@/components/BackGround";
import StoryViewer from "@/components/StoryViewer";
import VerifiedBadge from "@/components/VerifiedBadge";
import StoriesSkeleton from "@/components/skeleton/StoriesSkeleton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getViewedStoryIds,
  markStoryViewed,
} from "@/lib/database";
import type { Story } from "@/services/stories";
import { useStories } from "@/hooks/useStories";
import CustomInput from "@/components/CustomInput";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AVATAR_SIZE = 46;
const RING_SIZE = 56;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const VIEWED_COLORS_DARK: [string, string] = ["#333", "#444"];
const VIEWED_COLORS_LIGHT: [string, string] = ["#D1D5DB", "#D1D5DB"];

function StoryRow({
  item,
  viewed,
  onPress,
}: {
  item: Story;
  viewed: boolean;
  onPress: () => void;
}) {
  const isDark = useColorScheme() === "dark";

  const ringColors: [string, string, ...string[]] = viewed
    ? isDark
      ? VIEWED_COLORS_DARK
      : VIEWED_COLORS_LIGHT
    : ["#7C4DFF", "#E040FB", "#FF5252"];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.row,
        {
          borderBottomColor: isDark ? "#1A1354" : "rgba(0,0,0,0.06)",
          borderBottomWidth: isDark ? 0.17 : 0.8,
        },
      ]}
    >
      <LinearGradient
        colors={ringColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyRing}
      >
        <View
          style={[
            styles.ringInner,
            { backgroundColor: isDark ? "#0D0B1E" : "#FFFFFF" },
          ]}
        >
          {item.contact.avatar ? (
            <ExpoImage
              source={item.contact.avatar}
              style={[
                styles.avatar,
                { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
              ]}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.initialsCircle,
                { backgroundColor: isDark ? "#1C1C2E" : "#E8E5F5" },
              ]}
            >
              <Ionicons name="person" size={20} color={isDark ? "#fff" : "#6C56FF"} />
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.mid}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[styles.name, { color: isDark ? "#fff" : "#1A1A2E" }]}
            numberOfLines={1}
          >
            {item.contact.name}
          </Text>
          {item.contact.isPremium && <VerifiedBadge size={15} />}
        </View>
        <Text style={[styles.time, { color: isDark ? "#888" : "#9CA3AF" }]}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function StoryTab() {
  const isDark = useColorScheme() === "dark";
  const [search, setSearch] = useState("");
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => getViewedStoryIds());
  const [viewedCollapsed, setViewedCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: stories = [],
    isPending: loading,
    isFetching,
    refetch,
  } = useStories();

  const filteredStories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stories;
    return stories.filter((s) => s.contact.name.toLowerCase().includes(q));
  }, [stories, search]);

  const sections = useMemo(() => {
    const recent: Story[] = [];
    const viewed: Story[] = [];
    for (const s of filteredStories) {
      if (viewedIds.has(s.id)) {
        viewed.push(s);
      } else {
        recent.push(s);
      }
    }
    const byNewest = (a: Story, b: Story) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    recent.sort(byNewest);
    viewed.sort(byNewest);
    const result: { title: string; data: Story[]; collapsible?: boolean }[] = [];
    if (recent.length > 0) result.push({ title: "Recent story", data: recent });
    if (viewed.length > 0)
      result.push({
        title: "Viewed story",
        data: viewedCollapsed ? [] : viewed,
        collapsible: true,
      });
    return result;
  }, [filteredStories, viewedIds, viewedCollapsed]);

  const handleStoryViewed = useCallback((storyId: string) => {
    markStoryViewed(storyId);
    setViewedIds((prev) => {
      if (prev.has(storyId)) return prev;
      const next = new Set(prev);
      next.add(storyId);
      return next;
    });
  }, []);

  const openStory = useCallback(
    (story: Story) => {
      const realIndex = stories.findIndex((s) => s.id === story.id);
      setSelectedIndex(realIndex >= 0 ? realIndex : 0);
      setViewerVisible(true);
    },
    [stories],
  );

  const closeViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  return (
    <Background>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: isDark ? "#fff" : "#1A1A2E" }]}
          >
            Stories
          </Text>
          {stories.length > 0 && (
            <CustomInput
              value={search}
              onChangeText={setSearch}
              search
              placeholder="Search"
              backgroundColor={isDark ? "#1D1B31" : "#F0EEF9"}
              borderColor={isDark ? "#262626" : "#E0DCF0"}
              borderRadius={15}
            />
          )}
        </View>

        {loading ? (
          <StoriesSkeleton />
        ) : stories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={48}
              color={isDark ? "#333" : "#C4B5FD"}
            />
            <Text
              style={[
                styles.emptyText,
                { color: isDark ? "#888" : "#6B7280" },
              ]}
            >
              No stories yet
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section }) => (
              <TouchableOpacity
                activeOpacity={section.collapsible ? 0.6 : 1}
                onPress={() => {
                  if (section.collapsible) setViewedCollapsed((v) => !v);
                }}
                style={styles.sectionHeader}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDark ? "#999" : "#6B7280" },
                  ]}
                >
                  {section.title}
                </Text>
                {section.collapsible && (
                  <Ionicons
                    name={viewedCollapsed ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={isDark ? "#999" : "#6B7280"}
                  />
                )}
              </TouchableOpacity>
            )}
            renderItem={({ item }) => (
              <StoryRow
                item={item}
                viewed={viewedIds.has(item.id)}
                onPress={() => openStory(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  try {
                    await refetch();
                  } finally {
                    setRefreshing(false);
                  }
                }}
                tintColor={isDark ? "#A78BFA" : "#1A1A2E"}
                colors={[isDark ? "#A78BFA" : "#1A1A2E"]}
                progressBackgroundColor={isDark ? "#1E1740" : "#FFFFFF"}
              />
            }
          />
        )}

        <StoryViewer
          stories={stories}
          initialIndex={selectedIndex}
          visible={viewerVisible}
          onClose={closeViewer}
          onStoryViewed={handleStoryViewed}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Outfit-Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  storyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: RING_SIZE - 4,
    height: RING_SIZE - 4,
    borderRadius: (RING_SIZE - 4) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  initialsCircle: {
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
  mid: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
    fontFamily: "Outfit-SemiBold",
  },
  time: {
    fontSize: 12,
    fontFamily: "Outfit-Regular",
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
});
