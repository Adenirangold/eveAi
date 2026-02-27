import icons from "@/constants/icons";
import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";

interface FormErrorProps {
  message: string;
}

const FormError = ({ message }: FormErrorProps) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [message]);

  if (!message || dismissed) return null;

  return (
    <View className="flex-row items-center p-3 bg-[#FEF3F2] gap-2.5 my-5 rounded-[8px] border border-[#FECDCA]">
      <Image
        source={icons.info}
        className="w-4 h-4"
        resizeMode="contain"
        style={{ tintColor: "#D92D20" }}
      />
      <Text className="font-Arial text-sm text-[#912018] flex-1 flex-shrink">
        {message}
      </Text>
      <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
        <Image
          source={icons.close}
          className="w-4 h-4"
          resizeMode="contain"
          style={{ tintColor: "#D92D20" }}
        />
      </Pressable>
    </View>
  );
};

export default FormError;
