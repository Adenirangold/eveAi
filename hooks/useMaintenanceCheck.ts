import axios from "axios";
import { useEffect, useState } from "react";

const HEALTH_URL = "https://eve-ai.api.openhvn.dev/health";
const API_TIMEOUT_MS = 5000;

type HealthResponse = {
  ok: boolean;
  timestamp: string;
  maintenance: boolean;
};

/**
 * Runs a background /health check once on mount.
 * Returns { maintenance: true } when API reports maintenance mode.
 * Network errors are treated as non-maintenance so the UI is not blocked.
 */
export function useMaintenanceCheck() {
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      try {
        const { data } = await axios.get<HealthResponse>(HEALTH_URL, {
          timeout: API_TIMEOUT_MS,
        });

        if (!cancelled) {
          setMaintenance(Boolean(data?.maintenance));
        }
      } catch {
        if (!cancelled) {
          setMaintenance(false);
        }
      }
    }

    runCheck();

    return () => {
      cancelled = true;
    };
  }, []);

  return { maintenance };
}


