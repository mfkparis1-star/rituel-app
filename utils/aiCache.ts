/**
 * AI Generation Cache — list-based persistence (Phase 16C M3 upgrade).
 *
 * Stores up to MAX_ENTRIES_PER_TYPE generations per AI type with 24h TTL
 * per entry. Backward compatible: loadAICache() still returns the latest
 * entry (list[0]) so existing makeup/routine/skin restore flows work
 * unchanged. New: getAICacheList() returns the full list, used by the
 * "Mes derniers résultats" section on AI Studio.
 *
 * Phase 16D will replace AsyncStorage with a supabase ai_generations
 * table for cross-device history.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AICacheType = 'makeup' | 'routine' | 'skin';

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES_PER_TYPE = 5;

const key = (type: AICacheType) => `@rituel:ai_cache:${type}`;

export type AICacheEntry<T = unknown> = {
  data: T;
  savedAt: number;
};

type StoredList<T = unknown> = AICacheEntry<T>[];

async function readList<T>(type: AICacheType): Promise<StoredList<T>> {
  try {
    const raw = await AsyncStorage.getItem(key(type));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && !Array.isArray(parsed) && typeof parsed.savedAt === 'number') {
      return [parsed as AICacheEntry<T>];
    }
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const fresh = parsed.filter(
      (e: AICacheEntry<T>) => e && typeof e.savedAt === 'number' && now - e.savedAt <= TTL_MS
    );
    if (fresh.length !== parsed.length) {
      await AsyncStorage.setItem(key(type), JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return [];
  }
}

async function writeList<T>(type: AICacheType, list: StoredList<T>): Promise<void> {
  try {
    await AsyncStorage.setItem(key(type), JSON.stringify(list));
  } catch {
    // best-effort
  }
}

export async function saveAICache<T>(type: AICacheType, data: T): Promise<void> {
  const list = await readList<T>(type);
  const next: StoredList<T> = [{ data, savedAt: Date.now() }, ...list].slice(
    0,
    MAX_ENTRIES_PER_TYPE
  );
  await writeList(type, next);
}

export async function loadAICache<T>(type: AICacheType): Promise<T | null> {
  const list = await readList<T>(type);
  return list[0]?.data ?? null;
}

export async function getAICacheList<T>(type: AICacheType): Promise<AICacheEntry<T>[]> {
  return readList<T>(type);
}

export async function clearAICache(type: AICacheType): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(type));
  } catch {
    // best-effort
  }
}

export type AnyCacheEntry = AICacheEntry<unknown> & { type: AICacheType };

export async function getRecentAcrossTypes(limit = 3): Promise<AnyCacheEntry[]> {
  const types: AICacheType[] = ['makeup', 'routine', 'skin'];
  const all: AnyCacheEntry[] = [];
  for (const t of types) {
    const list = await readList<unknown>(t);
    list.forEach((e) => all.push({ ...e, type: t }));
  }
  all.sort((a, b) => b.savedAt - a.savedAt);
  return all.slice(0, limit);
}
