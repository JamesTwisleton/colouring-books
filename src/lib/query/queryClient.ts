import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

// Singleton QueryClient for the app
let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Keep library data fresh for 5 minutes, then refetch in background
          staleTime: 5 * 60 * 1_000,
          // Keep unused data in cache for 10 minutes
          gcTime: 10 * 60 * 1_000,
          // Retry once on failure (network hiccup)
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return queryClient;
}

/**
 * Wire up localStorage persistence for offline-first caching.
 * Call this once on the client — it patches the existing QueryClient.
 * IndexedDB via idb-keyval is used in Phase 3 asset caching (assetCache.ts);
 * here we use localStorage for lightweight query result caching.
 */
export function setupQueryPersistence(client: QueryClient): void {
  if (typeof window === "undefined") return;

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "cb-query-cache",
    // Throttle writes to avoid hammering localStorage on every update
    throttleTime: 2_000,
  });

  persistQueryClient({
    queryClient: client,
    persister,
    // Cached results older than 24h are discarded
    maxAge: 24 * 60 * 60 * 1_000,
  });
}
