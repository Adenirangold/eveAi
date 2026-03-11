import api from "@/lib/axios";
import { getLocalMessages, upsertLocalMessages } from "@/lib/database";

export interface ChatMessage {
  id: string;
  userId: string;
  contactId: string;
  role: "user" | "assistant";
  content: string;
  bibleRefs: string[] | null;
  createdAt: string;
  status?: "pending" | "sent" | "delivered";
}

interface MessagesResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface SendMessageResponse {
  success: boolean;
  data: {
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
  };
}

export const chatService = {
  getLocalMessages: (contactId: string): ChatMessage[] => {
    return getLocalMessages(contactId);
  },

  fetchAndSync: async (contactId: string): Promise<ChatMessage[]> => {
    const { data } = await api.get<MessagesResponse>(
      `/contacts/${contactId}/messages?limit=50`,
    );
    const messages = data.data.messages;
    upsertLocalMessages(messages);
    return getLocalMessages(contactId);
  },

  sendMessage: async (
    contactId: string,
    content: string,
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> => {
    const { data } = await api.post<SendMessageResponse>(
      `/contacts/${contactId}/messages`,
      { content },
    );
    const { userMessage, assistantMessage } = data.data;
    upsertLocalMessages([userMessage, assistantMessage]);
    return data.data;
  },
};
