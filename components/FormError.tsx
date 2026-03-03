import icons from "@/constants/icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

interface FormErrorProps {
  message: string;
}

const FormError = ({ message }: FormErrorProps) => {
  const [dismissed, setDismissed] = useState(false);
  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    setDismissed(false);
  }, [message]);

  if (!message || dismissed) return null;

  return (
    <View
      className="flex-row items-center p-3 gap-2.5 my-5 rounded-[8px] border"
      style={{
        backgroundColor: isDark ? "#2D1B1B" : "#FEF3F2",
        borderColor: isDark ? "#5C2B2B" : "#FECDCA",
      }}
    >
      <Image
        source={icons.info}
        className="w-4 h-4"
        resizeMode="contain"
        style={{ tintColor: isDark ? "#F87171" : "#D92D20" }}
      />
      <Text
        className="font-Arial text-sm flex-1 flex-shrink"
        style={{ color: isDark ? "#FCA5A5" : "#912018" }}
      >
        {message}
      </Text>
      <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
        <Image
          source={icons.close}
          className="w-4 h-4"
          resizeMode="contain"
          style={{ tintColor: isDark ? "#F87171" : "#D92D20" }}
        />
      </Pressable>
    </View>
  );
};

export default FormError;
