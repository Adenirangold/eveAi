import { getLocalStories, saveLocalStories } from "@/lib/database";
import type { Story } from "@/services/stories";
import { storiesService } from "@/services/stories";
import { useQuery } from "@tanstack/react-query";

export const REELS_QUERY_KEY = ["reels"] as const;

export function useReels() {
  return useQuery<Story[]>({
    queryKey: REELS_QUERY_KEY,
    queryFn: async () => {
      const remote = await storiesService.getStories();
      saveLocalStories(remote);
      return remote;
    },
    placeholderData: () => {
      try {
        const cached = getLocalStories();
        return cached.length > 0 ? cached : undefined;
      } catch {
        return undefined;
      }
    },
  });
}
