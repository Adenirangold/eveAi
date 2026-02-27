import { CustomToast } from "@/components/Toast";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useProfile } from "@/hooks/useAuth";
import QueryProvider from "@/providers/QueryProvider";
import { useAuthStore } from "@/store/auth-store";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import "../global.css";
import SplashScreenComponent from "./SplashScreen";

function ProfileHydrator() {
  useProfile();
  return null;
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);

  const [animationDone, setAnimationDone] = useState(false);

  const [loaded, error] = useFonts({
    "Outfit-Bold": require("@/assets/fonts/Outfit-Bold.ttf"),
    "Outfit-Light": require("../assets/fonts/Outfit-Light.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-ExtraLight": require("../assets/fonts/Outfit-ExtraLight.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isReady = (loaded || error) && animationDone;

  return (
    <QueryProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {isReady ? (
          <>
            <ProfileHydrator />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="all-chat" options={{ headerShown: false }} />
            </Stack>
          </>
        ) : (
          <SplashScreenComponent
            onAnimationComplete={() => setAnimationDone(true)}
          />
        )}
        <StatusBar style="auto" />
        <CustomToast />
      </ThemeProvider>
    </QueryProvider>
  );
}
