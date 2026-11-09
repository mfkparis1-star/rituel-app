import AsyncStorage from '@react-native-async-storage/async-storage';

export type AICacheType = 'makeup' | 'routine' | 'skin';

const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES_PER_TYPE = 5;

// Legacy keys are device-wide and have no verifiable owner.
const key = (account: string, type: AICacheType) =>
  `@rituel:ai_cache:v2:${account}:${type}`;

export type AICacheEntry<T = unknown> = {
  data: T;
  savedAt: number;
};

type StoredList<T = unknown> = AICacheEntry<T>[];

async function readList<T>(account: string | null, type: AICacheType): Promise<StoredList<T>> {
  if (!account) return [];
  try {
    const raw = await AsyncStorage.getItem(key(account, type));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    const fresh = parsed.filter(
      (e: AICacheEntry<T>) => e && typeof e.savedAt === 'number' && now - e.savedAt <= TTL_MS
    );
    if (fresh.length !== parsed.length) {
      await AsyncStorage.setItem(key(account, type), JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return [];
  }
}

async function writeList<T>(account: string | null, type: AICacheType, list: StoredList<T>): Promise<void> {
  if (!account) return;
  try {
    await AsyncStorage.setItem(key(account, type), JSON.stringify(list));
  } catch {
    // best-effort
  }
}

export async function saveAICache<T>(account: string | null, type: AICacheType, data: T): Promise<void> {
  const list = await readList<T>(account, type);
  const next: StoredList<T> = [{ data, savedAt: Date.now() }, ...list].slice(
    0,
    MAX_ENTRIES_PER_TYPE
  );
  await writeList(account, type, next);
}

export async function loadAICache<T>(account: string | null, type: AICacheType): Promise<T | null> {
  const list = await readList<T>(account, type);
  return list[0]?.data ?? null;
}

export async function getAICacheList<T>(account: string | null, type: AICacheType): Promise<AICacheEntry<T>[]> {
  return readList<T>(account, type);
}

export async function clearAICache(account: string | null, type: AICacheType): Promise<void> {
  if (!account) return;
  try {
    await AsyncStorage.removeItem(key(account, type));
  } catch {
    // best-effort
  }
}

export type AnyCacheEntry = AICacheEntry<unknown> & { type: AICacheType };

export async function getRecentAcrossTypes(account: string | null, limit = 3): Promise<AnyCacheEntry[]> {
  const types: AICacheType[] = ['makeup', 'routine', 'skin'];
  const all: AnyCacheEntry[] = [];
  for (const t of types) {
    const list = await readList<unknown>(account, t);
    list.forEach((e) => all.push({ ...e, type: t }));
  }
  all.sort((a, b) => b.savedAt - a.savedAt);
  return all.slice(0, limit);
}
