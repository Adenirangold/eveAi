import icons from "@/constants/icons";
import { router } from "expo-router";
import React from "react";
import { Image, TouchableOpacity } from "react-native";

const BackButton = () => {
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      className="p-3 flex-row items-center justify-center rounded-full bg-[#191919] w-[44px] h-[44px mb-5"
    >
      <Image
        resizeMode="contain"
        source={icons.chevronLeft}
        style={{ width: 24, height: 24 }}
      />
    </TouchableOpacity>
  );
};

export default BackButton;
