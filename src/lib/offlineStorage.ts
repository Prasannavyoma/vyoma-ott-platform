"use client";

export interface OfflineItemMeta {
  url: string;
  courseTitle: string;
  episodeTitle?: string;
  courseId?: string;
  episodeId?: string;
  thumbnailUrl?: string;
  downloadedAt: number;
  expiresAt: number;
}

const CACHE_NAME = 'vyoma-offline-video-v1';
const METADATA_KEY = 'vyoma_offline_downloads_index_v1';
const EXPIRY_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days in milliseconds (YouTube-style 1-month auto clear)

function getStoredMetadataMap(): Record<string, OfflineItemMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to read offline metadata:', e);
    return {};
  }
}

function saveStoredMetadataMap(map: Record<string, OfflineItemMeta>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('Failed to write offline metadata:', e);
  }
}

/**
 * Checks cache storage and auto-clears any items older than 30 days.
 * Returns array of remaining valid offline items.
 */
export async function getOfflineDownloads(): Promise<OfflineItemMeta[]> {
  if (typeof window === 'undefined' || !('caches' in window)) return [];

  const map = getStoredMetadataMap();
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const cachedUrls = new Set(keys.map(k => k.url));

  const now = Date.now();
  const validItems: OfflineItemMeta[] = [];
  let updated = false;

  for (const url of Object.keys(map)) {
    const item = map[url];

    // Auto-clear if download is past 30-day expiration date OR no longer present in browser cache
    if (now >= item.expiresAt || !cachedUrls.has(url)) {
      try {
        await cache.delete(url);
      } catch (e) {}
      delete map[url];
      updated = true;
    } else {
      validItems.push(item);
    }
  }

  // Also check if cache has items missing in metadata (sync metadata)
  for (const req of keys) {
    if (!map[req.url]) {
      const nowTs = Date.now();
      const meta: OfflineItemMeta = {
        url: req.url,
        courseTitle: 'Offline Video',
        downloadedAt: nowTs,
        expiresAt: nowTs + EXPIRY_DURATION_MS,
      };
      map[req.url] = meta;
      validItems.push(meta);
      updated = true;
    }
  }

  if (updated) {
    saveStoredMetadataMap(map);
  }

  // Sort newest downloads first
  return validItems.sort((a, b) => b.downloadedAt - a.downloadedAt);
}

/**
 * Saves item download metadata with a strict 30-day expiration date.
 */
export async function saveOfflineDownloadMeta(
  item: Omit<OfflineItemMeta, 'downloadedAt' | 'expiresAt'>
): Promise<OfflineItemMeta> {
  const nowTs = Date.now();
  const meta: OfflineItemMeta = {
    ...item,
    downloadedAt: nowTs,
    expiresAt: nowTs + EXPIRY_DURATION_MS,
  };

  const map = getStoredMetadataMap();
  map[item.url] = meta;
  saveStoredMetadataMap(map);
  return meta;
}

/**
 * Removes a download from both CacheStorage and localStorage index.
 */
export async function removeOfflineDownload(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(url);

    const map = getStoredMetadataMap();
    if (map[url]) {
      delete map[url];
      saveStoredMetadataMap(map);
    }
    return true;
  } catch (e) {
    console.error('Failed to delete offline download:', e);
    return false;
  }
}

/**
 * Utility to calculate days remaining before auto-cleanup.
 */
export function getRemainingDays(expiresAt: number): number {
  const diffMs = expiresAt - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
