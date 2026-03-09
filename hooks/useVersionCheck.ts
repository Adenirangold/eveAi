import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import axios from "axios";
import { useEffect, useState } from "react";
import { isVersionGte } from "@/utils/version";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const VERSION_URL = "https://eve-ai.api.openhvn.dev/version";
const CACHE_KEY = "versionCheckCache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const API_TIMEOUT_MS = 5000; // 5 seconds

interface CachedResult {
  minRequiredVersion: string;
  timestamp: number;
}

async function fetchVersionWithTimeout(): Promise<string | null> {
  try {
    const { data } = await axios.get<{
      success: boolean;
      data: { version: string; minRequiredVersion: string };
    }>(VERSION_URL, {
      timeout: API_TIMEOUT_MS,
    });
    return data.success && data.data?.minRequiredVersion
      ? data.data.minRequiredVersion
      : null;
  } catch {
    return null;
  }
}

async function getCachedResult(): Promise<CachedResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedResult;
  } catch {
    return null;
  }
}

async function setCachedResult(minRequiredVersion: string): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        minRequiredVersion,
        timestamp: Date.now(),
      } satisfies CachedResult)
    );
  } catch {
    // ignore
  }
}

/**
 * Returns { needsUpdate: true } when app version is lower than API minRequiredVersion.
 * - Checks only once per 24 hours when successful (cached in AsyncStorage).
 * - API call has 5s timeout; on timeout or error, app continues (no blocking).
 */
export function useVersionCheck() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      const cached = await getCachedResult();
      const now = Date.now();
      const isCacheValid = cached && now - cached.timestamp < CACHE_TTL_MS;

      if (isCacheValid) {
        if (!cancelled) {
          setNeedsUpdate(
            !isVersionGte(APP_VERSION, cached!.minRequiredVersion)
          );
        }
        return;
      }

      const minRequired = await fetchVersionWithTimeout();
      if (cancelled) return;

      if (minRequired) {
        await setCachedResult(minRequired);
        if (!cancelled) {
          setNeedsUpdate(!isVersionGte(APP_VERSION, minRequired));
        }
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
