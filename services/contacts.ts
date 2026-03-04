import api from "@/lib/axios";
import { getLocalContactById } from "@/lib/database";

export interface Contact {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  bio: string;
  isPremium: boolean;
  addedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface AvailableContact {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  bio: string;
  isPremium: boolean;
}

export const contactsService = {
  getContacts: async (): Promise<Contact[]> => {
    const { data } = await api.get<ApiResponse<Contact[]>>("/contacts");
    return data.data;
  },

  getContact: async (contactId: string): Promise<AvailableContact> => {
    const local = getLocalContactById(contactId);
    if (local) return local;

    const { data } = await api.get<ApiResponse<AvailableContact>>(
      `/contacts/${contactId}`,
    );
    return data.data;
  },

  getAvailableContacts: async (): Promise<AvailableContact[]> => {
    const { data } = await api.get<ApiResponse<AvailableContact[]>>(
      "/contacts/available",
    );
    console.log(data.data);
    return data.data;
  },

  addContact: async (contactId: string): Promise<void> => {
    await api.post("/contacts", { contactId });
  },

  deleteContact: async (contactId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}`);
  },
};
