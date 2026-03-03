import { useColorScheme } from "@/hooks/use-color-scheme";
import icons from "@/constants/icons";
import { router } from "expo-router";
import React from "react";
import { Image, TouchableOpacity } from "react-native";

const BackButton = () => {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      onPress={() => router.back()}
      className="p-3 flex-row items-center justify-center rounded-full w-[44px] h-[44px] mb-5"
      style={{ backgroundColor: isDark ? "#191919" : "#EDEBF6" }}
    >
      <Image
        resizeMode="contain"
        source={icons.chevronLeft}
        style={{
          width: 24,
          height: 24,
          tintColor: isDark ? undefined : "#1A1A2E",
        }}
      />
    </TouchableOpacity>
  );
};

export default BackButton;
