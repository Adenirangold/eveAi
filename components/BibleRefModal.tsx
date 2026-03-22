import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { BibleVerse, lookupVerses } from "@/lib/bible";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { windowWidth, windowHeight, isLargeFormFactor, contentMaxWidth } =
    useResponsiveLayout();

  const cardWidth =
    isLargeFormFactor && contentMaxWidth != null
      ? Math.min(contentMaxWidth, windowWidth * 0.9)
      : windowWidth * 0.85;
  const maxCardHeight = windowHeight * 0.6;

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
              width: cardWidth,
              maxHeight: maxCardHeight,
              backgroundColor: isDark ? "#1C1C2E" : "#FFFFFF",
              shadowOpacity: isDark ? 0.5 : 0.18,
              paddingTop: isLargeFormFactor ? 22 : 18,
              paddingBottom: isLargeFormFactor ? 10 : 6,
              borderRadius: isLargeFormFactor ? 24 : 20,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                paddingHorizontal: isLargeFormFactor ? 24 : 20,
                paddingBottom: isLargeFormFactor ? 18 : 14,
              },
            ]}
          >
            <View style={[styles.headerLeft, isLargeFormFactor && { gap: 10 }]}>
              <Ionicons
                name="book"
                size={isLargeFormFactor ? 22 : 18}
                color={isDark ? "#8B7FFF" : "#6C56FF"}
              />
              <Text
                style={[
                  styles.headerTitle,
                  {
                    color: isDark ? "#fff" : "#1A1A2E",
                    fontSize: isLargeFormFactor ? 19 : 17,
                  },
                ]}
              >
                Scripture Reference
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={isLargeFormFactor ? 12 : 10}
            >
              <Ionicons
                name="close"
                size={isLargeFormFactor ? 26 : 22}
                color={isDark ? "#888" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.divider,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F0EEF9",
                marginHorizontal: isLargeFormFactor ? 20 : 16,
              },
            ]}
          />

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: isLargeFormFactor ? 24 : 20,
                paddingTop: isLargeFormFactor ? 20 : 16,
                paddingBottom: isLargeFormFactor ? 22 : 18,
              },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {verses.length === 0 ? (
              <Text
                style={[
                  styles.notFound,
                  {
                    color: isDark ? "#666" : "#9CA3AF",
                    fontSize: isLargeFormFactor ? 15 : 14,
                    paddingVertical: isLargeFormFactor ? 24 : 20,
                  },
                ]}
              >
                Unable to get Bible verse. Visit bible.org
              </Text>
            ) : (
              verses.map((v, idx) => (
                <View
                  key={v.ref}
                  style={[
                    styles.verseBlock,
                    idx < verses.length - 1 && {
                      marginBottom: isLargeFormFactor ? 24 : 20,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.verseRef,
                      {
                        color: isDark ? "#8B7FFF" : "#6C56FF",
                        fontSize: isLargeFormFactor ? 15 : 14,
                        marginBottom: isLargeFormFactor ? 8 : 6,
                      },
                    ]}
                  >
                    {v.ref}
                  </Text>
                  <Text
                    style={[
                      styles.verseText,
                      {
                        color: isDark ? "#D4D4D4" : "#374151",
                        fontSize: isLargeFormFactor ? 16 : 15,
                        lineHeight: isLargeFormFactor ? 26 : 23,
                      },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {},
  verseBlock: {},
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
