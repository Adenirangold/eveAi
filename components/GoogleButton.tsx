import { useColorScheme } from "@/hooks/use-color-scheme";
import icons from "@/constants/icons";
import { useGoogleLogin } from "@/hooks/useAuth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import CustomButton from "./custom-button";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "YOUR_GOOGLE_WEB_CLIENT_ID";

const GoogleButton = () => {
  const isDark = useColorScheme() === "dark";
  const googleLogin = useGoogleLogin();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params.id_token;
      if (idToken) {
        googleLogin.mutate(idToken);
      }
    } else if (response?.type === "error") {
      Toast.show({
        type: "error",
        text1: "Google Sign-In failed",
        text2: response.error?.message ?? "Something went wrong",
      });
    }
  }, [response]);

  return (
    <View className="flex-1 justify-end">
      <View>
        <CustomButton
          onPress={() => promptAsync()}
          rounded="full"
          variant="primary"
          title="Continue with Google"
          leftIcon={icons.google}
          backgroundColor={isDark ? "#1D1B31" : "#FFFFFF"}
          textColor={isDark ? "#FAFAFA" : "#1A1A2E"}
          disabled={!request || googleLogin.isPending}
          style={
            !isDark
              ? { borderWidth: 1, borderColor: "#E0DCF0" }
              : undefined
          }
        />
      </View>
    </View>
  );
};

export default GoogleButton;
