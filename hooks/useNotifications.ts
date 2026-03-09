import {
  clearPushToken,
  getNotificationsEnabled,
  registerAndSyncPushToken,
  removePushTokenFromServer,
  setNotificationsEnabled,
} from "@/utils/notification";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";

export function useNotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getNotificationsEnabled()
      .then((enabled) => setIsEnabled(enabled))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    try {
      const enabled = await registerAndSyncPushToken();

      if (enabled) {
        setIsEnabled(true);
      } else {
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch {
      // Failed silently — switch stays off
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDisable = useCallback(() => {
    Alert.alert(
      "Turn Off Notifications",
      "Are you sure you want to disable push notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Turn Off",
          style: "destructive",
          onPress: async () => {
            setIsEnabled(false);
            try {
              await removePushTokenFromServer();
              await clearPushToken();
              await setNotificationsEnabled(false);
            } catch {
              setIsEnabled(true);
            }
          },
        },
      ],
    );
  }, []);

  const toggle = useCallback(
    (value: boolean) => {
      if (value) {
        handleEnable();
      } else {
        handleDisable();
      }
    },
    [handleEnable, handleDisable],
  );

  return { isEnabled, isLoading, toggle };
}
