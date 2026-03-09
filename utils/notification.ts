import api from "@/lib/axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const PUSH_TOKEN_KEY = "pushToken";
const PUSH_ENABLED_KEY = "pushEnabled";

// ── Permission & Registration ────────────────────────

export async function registerForPushNotificationsAsync(): Promise<
  string | undefined
> {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) return;

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return;
  }
}

export async function getPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

// ── Local storage ────────────────────────────────────

export async function savePushToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

export async function getSavedPushToken(): Promise<string | null> {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

export async function clearPushToken(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(PUSH_ENABLED_KEY, enabled ? "true" : "false");
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(PUSH_ENABLED_KEY);
  return val === "true";
}

// ── Server sync ──────────────────────────────────────

export async function sendPushTokenToServer(pushToken: string): Promise<void> {
  await api.patch("/me/push-token", { pushToken });
}

export async function removePushTokenFromServer(): Promise<void> {
  await api.patch("/me/push-token", { pushToken: "" });
}

// ── Full registration flow (called from index) ──────

export async function registerAndSyncPushToken(): Promise<boolean> {
  try {
    const token = await registerForPushNotificationsAsync();
    console.log("token", token);
    if (!token) return false;

    await savePushToken(token);
    await sendPushTokenToServer(token);
    await setNotificationsEnabled(true);
    return true;
  } catch {
    return false;
  }
}
