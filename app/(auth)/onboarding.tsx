import Background from "@/components/BackGround";
import CustomButton from "@/components/custom-button";
import images from "@/constants/images";
import { router } from "expo-router";
import React from "react";
import { Dimensions, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const onboarding = () => {
  return (
    <Background>
      <SafeAreaView className="px-5 flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-1"
        >
          <View className="items-center justify-center">
            <Image
              resizeMode="contain"
              source={images.onboarding}
              style={{
                height: Dimensions.get("window").height * 0.5,
                width: Dimensions.get("window").width * 0.8,
              }}
            />
          </View>
          <View className=" items-center gap-5">
            <Text className="text-typo-neutral max-w-[360px] font-OutfitSemiBold text-center text-3xl font-bold">
              Scripture Comes to Life Through Conversation
            </Text>
            <Text className="text-typo-neutralLight font-OutfitLight text-center text-base max-w-[320px]">
              Explore Scripture through interactive conversations with biblical
              figures
            </Text>
          </View>
          <View className=" flex-1 mt-10 gap-8">
            <CustomButton
              title="Get Started"
              rounded="full"
              onPress={() => router.push("/sign-up")}
            />
            <CustomButton
              title="Have an account? Log in"
              variant="secondary"
              rounded="full"
              onPress={() => router.push("/sign-in")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

export default onboarding;
