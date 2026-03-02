import React from "react";
import { Switch, Text, View } from "react-native";

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  trackColorFalse?: string;
  trackColorTrue?: string;
  thumbColorFalse?: string;
  thumbColorTrue?: string;
  disabled?: boolean;
  scale?: number;
  labelFontsize?: number;
  labelSpacing?: number;
  labelColor?: string;
  rightlabel?: string;
  leftlabel?: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  value,
  onValueChange,
  label,
  leftlabel,
  rightlabel,
  trackColorFalse = "#767577",
  trackColorTrue = "#4C956C",
  thumbColorFalse = "#F4F3F4",
  thumbColorTrue = "#FFFFFF",
  disabled = false,
  scale = 0.7,
  labelFontsize,
  labelColor,
  labelSpacing,
}) => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
        gap: 0,
      }}
    >
      {label && (
        <Text
          className="font-Mulish"
          style={{ color: labelColor || "#000", fontSize: labelFontsize || 16 }}
        >
          {label}
        </Text>
      )}

      <View className="items-center flex-row">
        {leftlabel && (
          <Text
            className="font-Mulish"
            style={{
              color: labelColor || "#000",
              fontSize: labelFontsize || 16,
            }}
          >
            {leftlabel}
          </Text>
        )}

        <Switch
          trackColor={{ false: trackColorFalse, true: trackColorTrue }}
          thumbColor={value ? thumbColorTrue : thumbColorFalse}
          ios_backgroundColor={trackColorFalse}
          onValueChange={onValueChange}
          value={value}
          disabled={disabled}
          style={{ transform: [{ scaleX: scale }, { scaleY: scale }] }}
        />
      </View>
      {rightlabel && (
        <Text
          className="font-Mulish"
          style={{ color: labelColor || "#000", fontSize: labelFontsize || 16 }}
        >
          {rightlabel}
        </Text>
      )}
    </View>
  );
};

export default CustomSwitch;
