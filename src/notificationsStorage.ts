import AsyncStorage from '@react-native-async-storage/async-storage';

const READ_NOTICES_KEY = '@alrashidi_read_notices_v2';
const CLEARED_NOTICES_KEY = '@alrashidi_cleared_notices_v2';

let cachedReadIds = new Set<string>();
let cachedClearedIds = new Set<string>();
let isInitialized = false;

export async function initNotificationsStorage(): Promise<{ read: Set<string>; cleared: Set<string> }> {
  if (isInitialized) return { read: cachedReadIds, cleared: cachedClearedIds };
  try {
    const [rawRead, rawCleared] = await Promise.all([
      AsyncStorage.getItem(READ_NOTICES_KEY),
      AsyncStorage.getItem(CLEARED_NOTICES_KEY),
    ]);
    if (rawRead) {
      const arr = JSON.parse(rawRead);
      if (Array.isArray(arr)) cachedReadIds = new Set(arr);
    }
    if (rawCleared) {
      const arr = JSON.parse(rawCleared);
      if (Array.isArray(arr)) cachedClearedIds = new Set(arr);
    }
  } catch (e) {
    console.warn('initNotificationsStorage error:', e);
  }
  isInitialized = true;
  return { read: cachedReadIds, cleared: cachedClearedIds };
}

export function isNoticeRead(id: string): boolean {
  return cachedReadIds.has(id);
}

export function isNoticeCleared(id: string): boolean {
  return cachedClearedIds.has(id);
}

export async function markNoticeAsRead(id: string): Promise<void> {
  if (!id) return;
  cachedReadIds.add(id);
  try {
    await AsyncStorage.setItem(READ_NOTICES_KEY, JSON.stringify(Array.from(cachedReadIds).slice(-150)));
  } catch {}
}

export async function markNoticeAsCleared(id: string): Promise<void> {
  if (!id) return;
  cachedClearedIds.add(id);
  try {
    await AsyncStorage.setItem(CLEARED_NOTICES_KEY, JSON.stringify(Array.from(cachedClearedIds).slice(-200)));
  } catch {}
}

export async function markAllNoticesAsCleared(ids: string[]): Promise<void> {
  if (!Array.isArray(ids)) return;
  ids.forEach((id) => {
    if (id) cachedClearedIds.add(id);
  });
  try {
    await AsyncStorage.setItem(CLEARED_NOTICES_KEY, JSON.stringify(Array.from(cachedClearedIds).slice(-200)));
  } catch {}
}
