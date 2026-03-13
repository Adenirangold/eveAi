import api from "@/lib/axios";
import { getLocalStories, saveLocalStories } from "@/lib/database";

export interface StoryContact {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  isPremium: boolean;
}

export interface Story {
  id: string;
  content: string;
  backgroundColor: string[];
  createdAt: string;
  expiresAt: string;
  contact: StoryContact;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface StoriesData {
  stories: Story[];
}

export const storiesService = {
  getStories: async (limit = 10): Promise<Story[]> => {
    try {
      const { data } = await api.get<ApiResponse<StoriesData>>(
        `/stories?limit=${limit}`,
      );
      const stories = data.data.stories ?? [];

      // Best-effort cache update – failures here should never break the UI.
      try {
        saveLocalStories(stories);
      } catch (err) {
        console.error("Failed to save stories to local cache:", err);
      }

      return stories;
    } catch (error) {
      console.error("Failed to fetch stories from API, falling back to cache:", error);

      // On network/server error, fall back to last known local stories.
      try {
        const cached = getLocalStories();
        if (cached.length > 0) {
          return cached;
        }
      } catch (err) {
        console.error("Failed to read stories from local cache:", err);
      }

      // No remote data and no cache – return empty array instead of throwing
      // so the rest of the app can continue to render safely.
      return [];
    }
  },
};
