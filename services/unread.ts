import api from "@/lib/axios";

// ── Response types (matching your backend) ───────────────────────────

interface UnreadSummaryResponse {
  success: boolean;
  data: {
    count: number;
    messageIds: string[];
    byContact: Array<{
      contactId: string;
      count: number;
      messageIds: string[];
    }>;
  };
}

interface MarkReadResponse {
  success: boolean;
  data: { success: boolean };
}

// ── Exported types ───────────────────────────────────────────────────

export interface UnreadSummary {
  totalUnread: number;
  byContact: Map<string, { count: number }>;
}

// ── API calls ───────────────────────────────────────────────────────

export const unreadService = {
  async fetchSummary(): Promise<UnreadSummary> {
    const { data } = await api.get<UnreadSummaryResponse>(
      "/messages/unread-summary",
    );
    if (!data.success || !data.data) {
      return { totalUnread: 0, byContact: new Map() };
    }
    const d = data.data;
    const byContact = new Map<string, { count: number }>();
    for (const c of d.byContact ?? []) {
      byContact.set(c.contactId, { count: c.count });
    }
    return {
      totalUnread: d.count ?? 0,
      byContact,
    };
  },

  async markRead(contactId: string): Promise<void> {
    const { data } = await api.post<MarkReadResponse>("/messages/mark-read", {
      contactId,
    });
    if (!data.success) {
      throw new Error("Failed to mark messages as read");
    }
  },
};
