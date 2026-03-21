import Background from "@/components/BackGround";
import CustomButton from "@/components/custom-button";
import images from "@/constants/images";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const markOnboardingSeen = () => {
  SecureStore.setItemAsync("hasSeenOnboarding", "true");
};

const onboarding = () => {
  const isDark = useColorScheme() === "dark";
  const { windowWidth, windowHeight, isLargeFormFactor, contentMaxWidth } =
    useResponsiveLayout();

  const imageWidth = isLargeFormFactor
    ? Math.min(windowWidth * 0.55, 480)
    : windowWidth * 0.8;
  const imageHeight = isLargeFormFactor
    ? Math.min(windowHeight * 0.42, imageWidth * 1.25)
    : windowHeight * 0.5;

  return (
    <Background>
      <SafeAreaView className="px-5 flex-1">
        <View
          style={
            isLargeFormFactor && contentMaxWidth != null
              ? {
                  flex: 1,
                  width: "100%",
                  maxWidth: contentMaxWidth,
                  alignSelf: "center",
                }
              : { flex: 1 }
          }
        >
          <ScrollView
            className={isLargeFormFactor ? "flex-1" : undefined}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="flex-1"
          >
            <View className="items-center justify-center">
              <Image
                resizeMode="contain"
                source={
                  isDark ? images.onboardingDark : images.onboardingLight
                }
                style={{
                  height: imageHeight,
                  width: imageWidth,
                }}
              />
            </View>
            <View className="items-center gap-5">
              <Text
                className={`font-OutfitSemiBold text-center text-3xl font-bold ${
                  isLargeFormFactor ? "max-w-[480px]" : "max-w-[360px]"
                }`}
                style={{ color: isDark ? "#FAFAFA" : "#1A1A2E" }}
              >
                Scripture Comes to Life Through Conversation
              </Text>
              <Text
                className={`font-OutfitLight text-center text-base ${
                  isLargeFormFactor ? "max-w-[420px]" : "max-w-[320px]"
                }`}
                style={{ color: isDark ? "#E5E5E5" : "#6B7280" }}
              >
                Explore Scripture through interactive conversations with
                biblical figures
              </Text>
            </View>
            <View className="flex-1 mt-10 gap-8">
              <CustomButton
                title="Get Started"
                rounded="full"
                onPress={() => {
                  markOnboardingSeen();
                  router.push("/sign-up");
                }}
              />
              <CustomButton
                title="Have an account? Log in"
                variant="secondary"
                rounded="full"
                onPress={() => {
                  markOnboardingSeen();
                  router.push("/sign-in");
                }}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
};

export default onboarding;
