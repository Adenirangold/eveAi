import { isVersionGte } from "@/utils/version";
import axios from "axios";
import Constants from "expo-constants";
import { useEffect, useState } from "react";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const VERSION_URL = "https://eve-ai.api.openhvn.dev/version";
const API_TIMEOUT_MS = 5000; // 5 seconds

async function fetchVersionWithTimeout(): Promise<string | null> {
  try {
    const { data } = await axios.get<{
      success: boolean;
      data: { version: string; minRequiredVersion: string };
    }>(VERSION_URL, {
      timeout: API_TIMEOUT_MS,
    });
    console.log("data", data);
    return data.success && data.data?.minRequiredVersion
      ? data.data.minRequiredVersion
      : null;
  } catch {
    return null;
  }
}

/**
 * Returns { needsUpdate: true } when app version is lower than API minRequiredVersion.
 * - Runs on every layout mount (no persistence / caching).
 * - API call has 5s timeout; on timeout or error, app continues (no blocking, assumes up-to-date).
 */
export function useVersionCheck() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      const minRequired = await fetchVersionWithTimeout();
      if (cancelled) return;

      if (minRequired) {
        setNeedsUpdate(!isVersionGte(APP_VERSION, minRequired));
      } else {
        setNeedsUpdate(false);
      }
    }

    runCheck();
    return () => {
      cancelled = true;
    };
  }, []);

  return { needsUpdate };
}
