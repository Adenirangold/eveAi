import React, { useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";

export interface OTPInputProps {
  value: string;
  onChange: (otp: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  containerClassName?: string;
  boxClassName?: string;
  labelClassName?: string;
}

const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  error = false,
  containerClassName = "",
  boxClassName = "",
  labelClassName = "",
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(TextInput | null | undefined)[]>([]);

  const digits = value.split("").slice(0, 6);
  while (digits.length < 6) {
    digits.push("");
  }

  const handleChangeText = (text: string, index: number) => {
    if (text && !/^\d+$/.test(text)) return;

    const newDigits = [...digits];

    if (text.length > 1) {
      const pastedDigits = text.slice(0, 6).split("");
      pastedDigits.forEach((digit, i) => {
        if (index + i < 6) {
          newDigits[index + i] = digit;
        }
      });
      onChange(newDigits.join(""));

      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = text;
    onChange(newDigits.join(""));

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text
          className={`font-Arial text-sm mb-2 ${labelClassName}`}
          style={{ color: "#003131" }}
        >
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}

      <View className="flex-row items-center justify-center">
        {digits.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = !!digit;

          return (
            <React.Fragment key={index}>
              <View className="flex-1 max-w-[48px]">
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className={`
                    h-[56px]
                    rounded-[12px]
                    text-center
                    font-ArialBold
                    text-[24px]
                    ${boxClassName}
                  `}
                  style={{
                    backgroundColor: isFocused ? "#1D1B31" : "#191919",
                    borderWidth: isFocused ? 1.5 : 1,
                    borderColor: isFocused ? "#6C56FF" : "#E2E3E3",
                    color: hasValue ? "#E6F3F3" : "#808080",
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => handleFocus(index)}
                  onBlur={handleBlur}
                  selectTextOnFocus
                  returnKeyType={index === 5 ? "done" : "next"}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {index === 2 && (
                <View className="mx-3">
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: "#003131" }}
                  >
                    –
                  </Text>
                </View>
              )}

              {index < 5 && index !== 2 && <View className="w-2" />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export default OTPInput;
