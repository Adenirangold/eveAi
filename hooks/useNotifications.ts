import {
  clearPushToken,
  getNotificationsEnabled,
  getPermissionStatus,
  registerAndSyncPushToken,
  removePushTokenFromServer,
  setNotificationsEnabled,
} from "@/utils/notification";
import { useCallback, useEffect, useState } from "react";

export function useNotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedEnabled, permissionGranted] = await Promise.all([
          getNotificationsEnabled(),
          getPermissionStatus(),
        ]);

        const effectiveEnabled = storedEnabled && permissionGranted;
        setIsEnabled(effectiveEnabled);

        if (!permissionGranted && storedEnabled) {
          // OS permission was revoked; keep local flag in sync
          await setNotificationsEnabled(false);
        }
      } catch {
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggle = useCallback(
    async (value: boolean) => {
      const previous = isEnabled;
      setIsEnabled(value);
      setIsLoading(true);

      try {
        if (value) {
          const enabled = await registerAndSyncPushToken();
          if (!enabled) {
            // Permission not granted or token failed – reflect real state
            setIsEnabled(false);
          }
        } else {
          try {
            await removePushTokenFromServer();
            await clearPushToken();
            await setNotificationsEnabled(false);
          } catch {
            // If turning off fails, revert to previous state
            setIsEnabled(previous);
          }
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isEnabled],
  );

  return { isEnabled, isLoading, toggle };
}
