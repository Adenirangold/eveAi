import UpdateRequiredScreen from "@/components/UpdateRequiredScreen";
import { CustomToast } from "@/components/Toast";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useProfile } from "@/hooks/useAuth";
import { getActiveChatId } from "@/lib/active-chat";
import { incrementUnread } from "@/lib/database";
import { queryClient } from "@/lib/query-client";
import QueryProvider from "@/providers/QueryProvider";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/store/theme-store";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useMemo } from "react";
import "../global.css";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function ProfileHydrator() {
  useProfile();
  return null;
}

function VersionGate({ children }: { children: React.ReactNode }) {
  const { needsUpdate } = useVersionCheck();
  if (needsUpdate) {
    return <UpdateRequiredScreen />;
  }
  return <>{children}</>;
}

function useNotificationListeners() {
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as
          | {
              contactId?: string;
              content?: string;
              createdAt?: string;
            }
          | undefined;

        if (!data?.contactId) return;

        if (getActiveChatId() === data.contactId) return;

        incrementUnread(
          data.contactId,
          data.content ?? null,
          data.createdAt ?? new Date().toISOString(),
        );
        queryClient.invalidateQueries({ queryKey: ["unreadCounts"] });
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | {
              contactId?: string;
            }
          | undefined;

        if (data?.contactId) {
          router.push(`/chat/${data.contactId}`);
        }
      },
    );

    (async () => {
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      const data = lastResponse?.notification.request.content
        .data as
        | {
            contactId?: string;
          }
        | undefined;

      if (data?.contactId) {
        router.push(`/chat/${data.contactId}`);
      }
    })();

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);
}

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  useNotificationListeners();

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
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  const isReady = loaded || error;
  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#0A0A0B" : "#F5F3FF";

  const theme = useMemo(
    () =>
      isDark
        ? {
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: bgColor,
              card: bgColor,
            },
          }
        : {
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              background: bgColor,
              card: bgColor,
            },
          },
    [isDark, bgColor],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bgColor }}>
      <QueryProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={theme}>
            {isReady && (
              <VersionGate>
                <ProfileHydrator />
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: bgColor },
                  }}
                >
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="chat/[id]"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="contact/[id]"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="change-password"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                  <Stack.Screen
                    name="about"
                    options={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  />
                </Stack>
              </VersionGate>
            )}
            <StatusBar style={isDark ? "light" : "dark"} />
            <CustomToast />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
