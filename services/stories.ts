import api from "@/lib/axios";

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
    const { data } = await api.get<ApiResponse<StoriesData>>(
      `/stories?limit=${limit}`,
    );
    return data.data.stories;
  },
};
