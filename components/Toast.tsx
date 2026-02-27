import React from "react";
import { Text, View } from "react-native";
import Toast, { BaseToast, BaseToastProps } from "react-native-toast-message";

const toastConfig = {
  success: (props: BaseToastProps & { fullMessage?: string }) => {
    const successMessage = (props.fullMessage as string) || props.text2 || "";

    return (
      <View
        style={{
          minHeight: 60,
          width: "90%",
          backgroundColor: "#1D1B31",
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: "#6C56FF",
          paddingHorizontal: 15,
          paddingVertical: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#FAFAFA",
            fontFamily: "Outfit-Bold",
            marginBottom: successMessage ? 6 : 0,
          }}
        >
          {props.text1 || "Success"}
        </Text>
        {successMessage ? (
          <Text
            style={{
              fontSize: 13,
              color: "#E5E5E5",
              fontFamily: "Arial-Regular",
              lineHeight: 20,
            }}
          >
            {successMessage}
          </Text>
        ) : null}
      </View>
    );
  },
  error: (props: BaseToastProps & { fullMessage?: string }) => {
    const errorMessage = (props.fullMessage as string) || props.text2 || "";

    return (
      <View
        style={{
          minHeight: 60,
          width: "90%",
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: "#EF4444",
          paddingHorizontal: 15,
          paddingVertical: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#FAFAFA",
            fontFamily: "Outfit-Bold",
            marginBottom: errorMessage ? 6 : 0,
          }}
        >
          {props.text1 || "Error"}
        </Text>
        {errorMessage ? (
          <Text
            style={{
              fontSize: 13,
              color: "#E5E5E5",
              fontFamily: "Outfit-Regular",
              lineHeight: 20,
            }}
          >
            {errorMessage}
          </Text>
        ) : null}
      </View>
    );
  },
  info: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#6C56FF",
        backgroundColor: "#1D1B31",
        borderRadius: 12,
        height: 60,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "600",
        color: "#FAFAFA",
        fontFamily: "Outfit-Bold",
      }}
      text2Style={{
        fontSize: 13,
        color: "#E5E5E5",
        fontFamily: "Outfit-Regular",
      }}
    />
  ),
};

export const CustomToast = () => {
  return <Toast config={toastConfig} />;
};
