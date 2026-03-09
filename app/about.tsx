import BackButton from "@/components/BackButton";
import Background from "@/components/BackGround";
import images from "@/constants/images";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResources } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

export default function About() {
  const isDark = useColorScheme() === "dark";
  const { data: resources } = useResources();

  const privacyUrl = resources?.privacyUrl ?? "https://binahstudio.com";
  const policyUrl = resources?.policyUrl ?? "https://binahstudio.com";

  const cardBg = isDark ? "#1F1D35" : "#FFFFFF";
  const cardBorder = isDark
    ? { borderWidth: 1, borderColor: "#2D2B4A" }
    : { borderWidth: 1, borderColor: "#E0DCF0" };
  const labelColor = isDark ? "#999" : "#6B7280";
  const valueColor = isDark ? "#fff" : "#1A1A2E";
  const separatorColor = isDark ? "#2D2B45" : "#E0DCF0";
  const chevronColor = isDark ? "#555" : "#9CA3AF";
  const subtextColor = isDark ? "#888" : "#6B7280";

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <BackButton />
          </View>

          {/* App Icon + Name */}
          <View
            style={{ alignItems: "center", paddingTop: 8, paddingBottom: 32 }}
          >
            <Image
              source={images.logo}
              style={{
                width: 96,
                height: 96,
                borderRadius: 28,
                marginBottom: 20,
              }}
              resizeMode="contain"
            />

            <Text
              style={{
                fontFamily: "Outfit-SemiBold",
                fontSize: 26,
                color: valueColor,
              }}
            >
              Eve
            </Text>
            <Text
              style={{
                fontFamily: "Outfit-Regular",
                fontSize: 14,
                color: subtextColor,
                marginTop: 4,
              }}
            >
              Version {APP_VERSION}
            </Text>
          </View>

          {/* Description */}
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <View
              style={[
                { backgroundColor: cardBg, borderRadius: 16, padding: 20 },
                cardBorder,
              ]}
            >
              <Text
                style={{
                  fontFamily: "Outfit-Regular",
                  fontSize: 14,
                  lineHeight: 22,
                  color: isDark ? "#ccc" : "#4B5563",
                  textAlign: "center",
                }}
              >
                Eve is your AI-powered bible companion for meaningful
                conversations. Connect with unique AI Bible characters, share
                stories, and explore creative Bible interactions.
              </Text>
            </View>

            {/* App Info */}
            <Text
              style={{
                fontFamily: "Outfit-SemiBold",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: labelColor,
                marginTop: 12,
              }}
            >
              App Info
            </Text>
            <View
              style={[
                { backgroundColor: cardBg, borderRadius: 16 },
                cardBorder,
              ]}
            >
              <Row
                icon="code-slash-outline"
                label="Version"
                value={APP_VERSION}
                labelColor={labelColor}
                valueColor={valueColor}
              />
              <Separator color={separatorColor} />
              <Row
                icon="business-outline"
                label="Developer"
                value="OpenHVN"
                labelColor={labelColor}
                valueColor={valueColor}
              />
              <Separator color={separatorColor} />
              <LinkRow
                icon="globe-outline"
                label="Website"
                onPress={() =>
                  WebBrowser.openBrowserAsync("https://binahstudio.com")
                }
                labelColor={labelColor}
                chevronColor={chevronColor}
              />
            </View>

            {/* Legal */}
            <Text
              style={{
                fontFamily: "Outfit-SemiBold",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: labelColor,
                marginTop: 12,
              }}
            >
              Legal
            </Text>
            <View
              style={[
                { backgroundColor: cardBg, borderRadius: 16 },
                cardBorder,
              ]}
            >
              <LinkRow
                icon="shield-outline"
                label="Privacy Policy"
                onPress={() => WebBrowser.openBrowserAsync(privacyUrl)}
                labelColor={labelColor}
                chevronColor={chevronColor}
              />
              <Separator color={separatorColor} />
              <LinkRow
                icon="document-text-outline"
                label="Terms of Service"
                onPress={() => WebBrowser.openBrowserAsync(policyUrl)}
                labelColor={labelColor}
                chevronColor={chevronColor}
              />
            </View>

            {/* Footer */}
            <View className=" items-center gap-3 mt-5 ">
              <Image
                source={isDark ? images.brand : images.brandBlack}
                resizeMode="contain"
                style={{ width: 60, height: 30 }}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

function Row({
  icon,
  label,
  value,
  labelColor,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: "rgba(108,86,255,0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <Ionicons name={icon} size={18} color="#6C56FF" />
      </View>

      <Text
        style={{
          fontFamily: "Outfit-Medium",
          fontSize: 15,
          color: labelColor,
          marginRight: 10,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          fontFamily: "Outfit-Medium",
          fontSize: 14,
          color: valueColor,
          flex: 1,
          flexWrap: "wrap",
          textAlign: "right",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  labelColor,
  chevronColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  labelColor: string;
  chevronColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <View className="w-9 h-9 rounded-xl bg-[#6C56FF]/10 items-center justify-center mr-4">
        <Ionicons name={icon} size={18} color="#6C56FF" />
      </View>
      <Text
        className="font-OutfitMedium text-base flex-1"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={chevronColor} />
    </Pressable>
  );
}

function Separator({ color }: { color: string }) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: color,
        marginHorizontal: 16,
      }}
    />
  );
}
