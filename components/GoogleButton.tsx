import icons from "@/constants/icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useGoogleLogin } from "@/hooks/useAuth";
import { Prompt, makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect } from "react";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import CustomButton from "./custom-button";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  "952103083476-mmjp9jfkjvdbm8er3l4e89svq1vbindt.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  "952103083476-0ftbdhgb5l6bpqi4573eir4h0mrcatlp.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  "952103083476-m25v314ccsu6v8hd3uq6fh0a6796aric.apps.googleusercontent.com";

const GoogleButton = () => {
  const isDark = useColorScheme() === "dark";
  const googleLogin = useGoogleLogin();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: "org.rsc.eveai" }),
    prompt: ["select_account"] as Prompt[],
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.params.id_token;
      if (idToken) {
        googleLogin.mutate(idToken, {
          onSuccess: () => {
            router.replace("/(tabs)");
          },
          onError: (error) => {
            Toast.show({
              type: "error",
              text1: "Login failed",
              text2:
                (error as Error).message ??
                "Something went wrong while logging in",
            });
          },
        });
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
          loading={googleLogin.isPending}
          disabled={!request}
          style={
            !isDark ? { borderWidth: 1, borderColor: "#E0DCF0" } : undefined
          }
        />
      </View>
    </View>
  );
};

export default GoogleButton;
