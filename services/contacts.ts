import api from "@/lib/axios";

export interface Contact {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  bio: string;
  addedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const contactsService = {
  getContacts: async (): Promise<Contact[]> => {
    const { data } = await api.get<ApiResponse<Contact[]>>("/contacts");
    return data.data;
  },
};
