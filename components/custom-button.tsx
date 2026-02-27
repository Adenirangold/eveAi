import React from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  type ImageSourcePropType,
  type TouchableOpacityProps,
} from "react-native";

type Variant = "primary" | "secondary";
type Rounded = "default" | "full";

interface CustomButtonProps extends Omit<TouchableOpacityProps, "children"> {
  title?: string;
  variant?: Variant;
  rounded?: Rounded;
  backgroundColor?: string;
  textColor?: string;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ImageSourcePropType;
  rightIcon?: ImageSourcePropType;
  iconSize?: number;
  leftIconTintColor?: string;
  rightIconTintColor?: string;
}

const VARIANT_COLORS: Record<Variant, string> = {
  primary: "#6C56FF",
  secondary: "#1D1B31",
};

const BORDER_RADIUS: Record<Rounded, number> = {
  default: 3,
  full: 30,
};

const CustomButton = ({
  title = "Button",
  variant = "primary",
  rounded = "default",
  backgroundColor,
  textColor = "#E5E5E5",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  iconSize = 20,
  leftIconTintColor,
  rightIconTintColor,
  style,
  ...rest
}: CustomButtonProps) => {
  const bgColor = backgroundColor ?? VARIANT_COLORS[variant];
  const radius = BORDER_RADIUS[rounded];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        {
          backgroundColor: bgColor,
          borderRadius: radius,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          paddingHorizontal: 24,
          gap: 8,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {leftIcon && (
            <Image
              source={leftIcon}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: leftIconTintColor,
              }}
              resizeMode="contain"
            />
          )}
          <Text
            className="font-OutfitMedium"
            style={{ color: textColor, fontSize: 16 }}
          >
            {title}
          </Text>
          {rightIcon && (
            <Image
              source={rightIcon}
              style={{
                width: iconSize,
                height: iconSize,
                tintColor: rightIconTintColor,
              }}
              resizeMode="contain"
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;
