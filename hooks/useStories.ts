import { getLocalStories, saveLocalStories } from "@/lib/database";
import type { Story } from "@/services/stories";
import { storiesService } from "@/services/stories";
import { useQuery } from "@tanstack/react-query";

export const STORIES_QUERY_KEY = ["stories"] as const;

export function useStories() {
  return useQuery<Story[]>({
    queryKey: STORIES_QUERY_KEY,
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
