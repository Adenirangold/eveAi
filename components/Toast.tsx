import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Text, View } from "react-native";
import Toast, { BaseToast, BaseToastProps } from "react-native-toast-message";

function SuccessToast(props: BaseToastProps & { fullMessage?: string }) {
  const isDark = useColorScheme() === "dark";
  const successMessage = (props.fullMessage as string) || props.text2 || "";

  return (
    <View
      style={{
        minHeight: 60,
        width: "90%",
        backgroundColor: isDark ? "#1D1B31" : "#FFFFFF",
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#6C56FF",
        paddingHorizontal: 15,
        paddingVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.1 : 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: isDark ? "#FAFAFA" : "#1A1A2E",
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
            color: isDark ? "#E5E5E5" : "#6B7280",
            fontFamily: "Outfit-Regular",
            lineHeight: 20,
          }}
        >
          {successMessage}
        </Text>
      ) : null}
    </View>
  );
}

function ErrorToast(props: BaseToastProps & { fullMessage?: string }) {
  const isDark = useColorScheme() === "dark";
  const errorMessage = (props.fullMessage as string) || props.text2 || "";

  return (
    <View
      style={{
        minHeight: 60,
        width: "90%",
        backgroundColor: isDark ? "#1D1B31" : "#FFFFFF",
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#EF4444",
        paddingHorizontal: 15,
        paddingVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.1 : 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: isDark ? "#FAFAFA" : "#1A1A2E",
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
            color: isDark ? "#E5E5E5" : "#6B7280",
            fontFamily: "Outfit-Regular",
            lineHeight: 20,
          }}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

function InfoToast(props: BaseToastProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#6C56FF",
        backgroundColor: isDark ? "#1D1B31" : "#FFFFFF",
        borderRadius: 12,
        height: 60,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontWeight: "600",
        color: isDark ? "#FAFAFA" : "#1A1A2E",
        fontFamily: "Outfit-Bold",
      }}
      text2Style={{
        fontSize: 13,
        color: isDark ? "#E5E5E5" : "#6B7280",
        fontFamily: "Outfit-Regular",
      }}
    />
  );
}

const toastConfig = {
  success: (props: BaseToastProps & { fullMessage?: string }) => (
    <SuccessToast {...props} />
  ),
  error: (props: BaseToastProps & { fullMessage?: string }) => (
    <ErrorToast {...props} />
  ),
  info: (props: BaseToastProps) => <InfoToast {...props} />,
};

export const CustomToast = () => {
  return <Toast config={toastConfig} />;
};
