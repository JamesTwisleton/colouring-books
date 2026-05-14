/**
 * IndexedDB asset cache for offline coloring book support.
 *
 * Uses idb-keyval for simple key-value blob storage.
 * Keys are the original asset URLs; values are Blobs (images/JSON).
 *
 * Usage pattern:
 *   1. User taps "Download" — call cacheBookAssets()
 *   2. Canvas loads — call getCachedAsset() to get a local Object URL
 *   3. Object URLs are revoked after use to prevent memory leaks
 */

import { get, set, del, keys } from "idb-keyval";
import type { PageConfig } from "@/types/coloring";

const STORE_PREFIX = "asset:";

/** Download and cache all assets for a book's pages */
export async function cacheBookAssets(pages: PageConfig[]): Promise<void> {
  const urls = pages.flatMap((p) => [
    p.outlineUrl,
    p.animatableElementsUrl,
  ]);

  await Promise.all(
    urls.map(async (url) => {
      const existing = await get<Blob>(STORE_PREFIX + url);
      if (existing) return; // already cached

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        await set(STORE_PREFIX + url, blob);
      } catch (err) {
        console.warn(`[assetCache] Failed to cache ${url}:`, err);
      }
    })
  );
}

/**
 * Get a cached asset as an object URL, or null if not cached.
 * The caller is responsible for calling URL.revokeObjectURL() when done.
 */
export async function getCachedAsset(url: string): Promise<string | null> {
  const blob = await get<Blob>(STORE_PREFIX + url);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/** Remove all cached assets for a specific set of URLs */
export async function evictCachedAssets(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => del(STORE_PREFIX + url)));
}

/** Return list of all currently cached asset URLs */
export async function listCachedAssets(): Promise<string[]> {
  const allKeys = await keys<string>();
  return allKeys
    .filter((k) => k.startsWith(STORE_PREFIX))
    .map((k) => k.slice(STORE_PREFIX.length));
}

/**
 * Save the child's colored page (Blob) to IndexedDB.
 * Key: `save:{childId}:{pageId}`
 */
export async function saveColoredPage(
  childId: string,
  pageId: string,
  blob: Blob
): Promise<void> {
  await set(`save:${childId}:${pageId}`, blob);
}

/**
 * Load the child's saved colored page from IndexedDB.
 * Returns an Object URL (caller must revoke), or null if not saved.
 */
export async function loadColoredPage(
  childId: string,
  pageId: string
): Promise<string | null> {
  const blob = await get<Blob>(`save:${childId}:${pageId}`);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}
