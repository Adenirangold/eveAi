import { useColorScheme } from "@/hooks/use-color-scheme";
import { BibleVerse, lookupVerses } from "@/lib/bible";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface BibleRefModalProps {
  visible: boolean;
  onClose: () => void;
  refs: string[];
}

export default function BibleRefModal({
  visible,
  onClose,
  refs,
}: BibleRefModalProps) {
  const isDark = useColorScheme() === "dark";

  const verses: BibleVerse[] = useMemo(() => {
    if (refs.length === 0) return [];
    return lookupVerses(refs);
  }, [refs]);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={StyleSheet.absoluteFill} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF",
              shadowOpacity: isDark ? 0.5 : 0.18,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="book"
                size={18}
                color={isDark ? "#8B7FFF" : "#6C56FF"}
              />
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDark ? "#fff" : "#1A1A2E" },
                ]}
              >
                Scripture Reference
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={10}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? "#888" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F0EEF9" },
            ]}
          />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {verses.length === 0 ? (
              <Text
                style={[
                  styles.notFound,
                  { color: isDark ? "#666" : "#9CA3AF" },
                ]}
              >
                Reference not found
              </Text>
            ) : (
              verses.map((v, idx) => (
                <View
                  key={v.ref}
                  style={[
                    styles.verseBlock,
                    idx < verses.length - 1 && styles.verseBlockSpacing,
                  ]}
                >
                  <Text
                    style={[
                      styles.verseRef,
                      { color: isDark ? "#8B7FFF" : "#6C56FF" },
                    ]}
                  >
                    {v.ref}
                  </Text>
                  <Text
                    style={[
                      styles.verseText,
                      { color: isDark ? "#D4D4D4" : "#374151" },
                    ]}
                  >
                    {v.text}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: SCREEN_W * 0.85,
    maxHeight: SCREEN_H * 0.6,
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  verseBlock: {},
  verseBlockSpacing: {
    marginBottom: 20,
  },
  verseRef: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Outfit-SemiBold",
    marginBottom: 6,
  },
  verseText: {
    fontSize: 15,
    fontFamily: "Outfit-Regular",
    lineHeight: 23,
  },
  notFound: {
    fontSize: 14,
    fontFamily: "Outfit-Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
});
