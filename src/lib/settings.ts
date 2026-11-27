import prisma from '@/lib/prisma';

let cachedSettings: { map: Map<string, string>; expiresAt: number } | null = null;
const SETTINGS_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Returns an in-memory cached Map of all system settings.
 * Refreshes automatically every 60 seconds or when invalidated.
 * Saves multiple sequential database queries per page render.
 */
export async function getSystemSettingsMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.expiresAt > now) {
    return cachedSettings.map;
  }

  try {
    const raw = await prisma.systemSetting.findMany();
    const map = new Map(raw.map(s => [s.key, s.value]));
    cachedSettings = { map, expiresAt: now + SETTINGS_TTL_MS };
    return map;
  } catch (e) {
    console.error("Failed to read system settings, falling back to cached or empty:", e);
    return cachedSettings ? cachedSettings.map : new Map();
  }
}

/**
 * Fast lookup for a single system setting value from memory cache.
 */
export async function getSystemSetting(key: string, defaultValue = ''): Promise<string> {
  const map = await getSystemSettingsMap();
  return map.get(key) ?? defaultValue;
}

/**
 * Invalidate the memory cache (call when admin updates settings).
 */
export function invalidateSettingsCache(): void {
  cachedSettings = null;
}
