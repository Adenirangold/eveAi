import React from "react";
import { Text, View } from "react-native";

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <View className="mb-10 mt-5 gap-2">
      <Text className="font-OutfitSemiBold text-[26px] text-primary-100 max-w-[330px]">
        {title}
      </Text>
      <Text className="font-OutfitLight text-base text-typo-neutral max-w-[330px]">
        {subtitle}
      </Text>
    </View>
  );
};

export default Header;
