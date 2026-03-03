import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Text, View } from "react-native";

const Header = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View className="mb-10 mt-5 gap-2">
      <Text
        className="font-OutfitSemiBold text-[26px] max-w-[330px]"
        style={{ color: isDark ? "#E4E1FF" : "#6C56FF" }}
      >
        {title}
      </Text>
      <Text
        className="font-OutfitLight text-base max-w-[330px]"
        style={{ color: isDark ? "#FAFAFA" : "#374151" }}
      >
        {subtitle}
      </Text>
    </View>
  );
};

export default Header;
