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

type ReelItem = {
  id: string;
  name: string;
  avatar?: ImageSourcePropType;
  initials?: string;
  isAddStory?: boolean;
  hasStory?: boolean;
};

const DUMMY_REELS: ReelItem[] = [
  {
    id: "1",
    name: "Terry",
    avatar: require("@/assets/images/icon.png"),
    hasStory: true,
  },
  { id: "2", name: "Craig", initials: "SA", hasStory: true },
  { id: "3", name: "Craig", initials: "SA", hasStory: true },
  { id: "4", name: "Craig", initials: "SA", hasStory: true },
  { id: "5", name: "Lena", initials: "LN", hasStory: true },
  { id: "6", name: "Max", initials: "MX", hasStory: true },
];

function ReelAvatar({ item }: { item: ReelItem }) {
  return (
    <TouchableOpacity style={styles.reelWrapper} activeOpacity={0.7}>
      <View style={[styles.storyRing, item.hasStory && styles.activeRing]}>
        {item.avatar ? (
          <Image source={item.avatar} style={styles.avatar} />
        ) : (
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>{item.initials}</Text>
          </View>
        )}
      </View>
      <Text style={styles.reelName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

export default function Reels() {
  return (
    <FlatList
      data={DUMMY_REELS}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <ReelAvatar item={item} />}
      style={{ overflow: "visible" }}
    />
  );
}

const AVATAR_SIZE = 56;
const RING_SIZE = 64;

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  reelWrapper: {
    alignItems: "center",
    width: 72,
    paddingBottom: 4,
  },
  addStoryCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#3A3A4A",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  storyRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: "#2A2A35",
    alignItems: "center",
    justifyContent: "center",
  },
  activeRing: {
    borderColor: "#6C56FF",
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
    backgroundColor: "#1C1C2E",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  reelName: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
});
