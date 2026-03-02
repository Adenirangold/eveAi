import { getLocalStories, saveLocalStories } from "@/lib/database";
import type { Story } from "@/services/stories";
import { storiesService } from "@/services/stories";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import ReelsSkeleton from "./skeleton/ReelsSkeleton";
import StoryViewer from "./StoryViewer";

export interface ReelsHandle {
  refetch: () => void;
}

const AVATAR_SIZE = 52;
const RING_SIZE = 62;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ReelAvatar({ item, onPress }: { item: Story; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.reelWrapper}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#7C4DFF", "#E040FB", "#FF5252"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyRing}
      >
        <View style={styles.ringInner}>
          {item.contact.avatar ? (
            <ExpoImage
              source={item.contact.avatar}
              style={styles.avatarCircle}
              contentFit="cover"
            />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>
                {getInitials(item.contact.name)}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      <Text style={styles.reelName} numberOfLines={1}>
        {item.contact.name}
      </Text>
    </TouchableOpacity>
  );
}

const Reels = React.forwardRef<ReelsHandle>((_props, ref) => {
  const queryClient = useQueryClient();
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: stories = [], isPending: loading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const remote = await storiesService.getStories();
      saveLocalStories(remote);
      return remote;
    },
    placeholderData: () => {
      try {
        const cached = getLocalStories();
        return cached.length > 0 ? cached : undefined;
      } catch {
        return undefined;
      }
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      refetch: () => {
        queryClient.invalidateQueries({ queryKey: ["stories"] });
      },
    }),
    [queryClient],
  );

  const openStory = useCallback((index: number) => {
    setSelectedIndex(index);
    setViewerVisible(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  if (loading) {
    return <ReelsSkeleton />;
  }

  if (stories.length === 0) return null;

  return (
    <>
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <ReelAvatar item={item} onPress={() => openStory(index)} />
        )}
        style={{ overflow: "visible" }}
      />
      <StoryViewer
        stories={stories}
        initialIndex={selectedIndex}
        visible={viewerVisible}
        onClose={closeViewer}
      />
    </>
  );
});

export default Reels;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  reelWrapper: {
    alignItems: "center",
    width: 72,
    paddingBottom: 4,
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
    backgroundColor: "#0D0B1E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
  },
  initialsCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Outfit-Regular",
  },
  reelName: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    fontFamily: "Outfit-SemiBold",
  },
});
