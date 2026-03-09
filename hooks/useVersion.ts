import axios from "axios";
import { useQuery } from "@tanstack/react-query";

const VERSION_URL = "https://eve-ai.api.openhvn.dev/version";

export interface VersionInfo {
  version: string;
  minRequiredVersion: string;
}

export function useVersion() {
  return useQuery({
    queryKey: ["version"],
    queryFn: async (): Promise<VersionInfo> => {
      const { data } = await axios.get<{
        success: boolean;
        data: { version: string; minRequiredVersion: string };
      }>(VERSION_URL);
      if (data.success && data.data?.version && data.data?.minRequiredVersion) {
        return {
          version: data.data.version,
          minRequiredVersion: data.data.minRequiredVersion,
        };
      }
      throw new Error("Invalid version response");
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
