import api from "@/lib/axios";
import {
  getLocalAvailableContacts,
  getLocalContactById,
  getLocalContacts,
  saveLocalAvailableContacts,
  saveLocalContacts,
} from "@/lib/database";

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
    try {
      const { data } = await api.get<ApiResponse<Contact[]>>("/contacts");
      const contacts = data.data ?? [];

      // Keep SQLite in sync, but never let cache errors break the UI.
      try {
        saveLocalContacts(contacts);
      } catch (err) {
        console.error("Failed to save contacts to local cache:", err);
      }

      return contacts;
    } catch (error) {
      console.error("Failed to fetch contacts from API, falling back to cache:", error);

      try {
        const cached = getLocalContacts();
        if (cached.length > 0) {
          return cached;
        }
      } catch (err) {
        console.error("Failed to read contacts from local cache:", err);
      }

      // No remote data and no cache – surface an error so the UI
      // can distinguish "could not load" from "truly empty".
      throw error;
    }
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
    try {
      const { data } = await api.get<ApiResponse<AvailableContact[]>>(
        "/contacts/available",
      );
      const contacts = data.data ?? [];

      try {
        saveLocalAvailableContacts(contacts);
      } catch (err) {
        console.error("Failed to save available contacts to local cache:", err);
      }

      return contacts;
    } catch (error) {
      console.error(
        "Failed to fetch available contacts from API, falling back to cache:",
        error,
      );

      try {
        const cached = getLocalAvailableContacts();
        if (cached.length > 0) {
          return cached;
        }
      } catch (err) {
        console.error("Failed to read available contacts from local cache:", err);
      }

      // No remote data and no cache – surface an error so the UI
      // can render a connection error instead of "no characters".
      throw error;
    }
  },

  addContact: async (contactId: string): Promise<void> => {
    await api.post("/contacts", { contactId });
  },

  deleteContact: async (contactId: string): Promise<void> => {
    await api.delete(`/contacts/${contactId}`);
  },
};
