import { useColorScheme } from "@/hooks/use-color-scheme";
import icons from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

export interface CustomInputProps extends Omit<TextInputProps, "style"> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  editable?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: TextInputProps["keyboardType"];
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
  modal?: boolean;
  error?: string;
  search?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
}

const CustomInput: React.FC<CustomInputProps> = ({
  value,
  onChangeText,
  placeholder = "",
  label,
  required = false,
  secureTextEntry = false,
  editable = true,
  autoCapitalize = "none",
  keyboardType = "default",
  returnKeyType = "done",
  onSubmitEditing,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  autoFocus = false,
  onFocus,
  onBlur,
  modal = false,
  error,
  search = false,
  backgroundColor: bgProp,
  borderColor: borderColorProp,
  borderRadius,
  ...props
}) => {
  const isDark = useColorScheme() === "dark";
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const backgroundColor = bgProp ?? (isDark ? "#191919" : "#F5F3FF");
  const textColor = isDark ? "#E6F3F3" : "#1A1A2E";
  const labelColor = isDark ? "#E6F3F3" : "#374151";
  const placeholderColor = "#9CA3AF";

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const TextInputComponent = TextInput;
  return (
    <View className="w-full">
      {label && (
        <Text
          className="font-Outfit text-sm mb-2"
          style={{
            color: labelColor,
            flexShrink: 1,
          }}
        >
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}
      <View className="relative w-full">
        {search && (
          <View className="absolute left-[14px] top-[14px] z-10">
            <Image
              source={icons.search}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor="#9CA3AF"
            />
          </View>
        )}
        <TextInputComponent
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={editable}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            ${multiline ? "min-h-[48px]" : "h-[48px]"}
            rounded-[5px]
            ${isFocused ? "border-2" : "border"}
            ${search ? "pl-[42px]" : "pl-[14px]"}
            py-[10px]
            pr-[14px]
            font-Outfit
            text-base
            ${editable ? "" : "opacity-50"}
          `}
          style={{
            borderColor: error
              ? "#FF3B3B"
              : (borderColorProp ?? (isDark ? "transparent" : "#E0DCF0")),
            backgroundColor,
            color: textColor,
            ...(multiline && { minHeight: 48 }),
            ...(borderRadius != null && { borderRadius }),
          }}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            className="absolute right-[14px] top-[10px]"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPasswordVisible ? (
              <Ionicons name="eye-off" size={20} color="#9CA3AF" />
            ) : (
              <Ionicons name="eye" size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          className="text-[#FF3B3B] font-Outfit text-sm mt-1 px-2"
          style={{ flexShrink: 1 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default CustomInput;
