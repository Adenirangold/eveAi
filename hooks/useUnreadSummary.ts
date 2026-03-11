import { queryClient } from "@/lib/query-client";
import { unreadService, type UnreadSummary } from "@/services/unread";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

export const UNREAD_SUMMARY_QUERY_KEY = ["unreadSummary"] as const;

/**
 * Fetches unread summary from server. Refetches when app comes to foreground.
 * Shared across index, tab bar, and badge - React Query dedupes.
 */
export function useUnreadSummary(enabled = true) {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const query = useQuery({
    queryKey: UNREAD_SUMMARY_QUERY_KEY,
    queryFn: () => unreadService.fetchSummary(),
    enabled,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!enabled) return;

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev !== "active" && nextState === "active") {
        queryClient.invalidateQueries({ queryKey: UNREAD_SUMMARY_QUERY_KEY });
      }
    });

    return () => sub.remove();
  }, [enabled]);

  return query;
}

/**
 * Invalidates unread summary to trigger a refetch.
 */
export function invalidateUnreadSummary(): void {
  queryClient.invalidateQueries({ queryKey: UNREAD_SUMMARY_QUERY_KEY });
}
