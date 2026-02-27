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
          backgroundColor="#1D1B31"
          textColor="#FAFAFA"
          disabled={!request || googleLogin.isPending}
        />
      </View>
    </View>
  );
};

export default GoogleButton;
