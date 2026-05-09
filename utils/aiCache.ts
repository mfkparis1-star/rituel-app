/**
 * AI Generation Cache (Phase 16B.1) — AsyncStorage persistence with 24h TTL.
 *
 * Stores last AI generation per type so users do not lose paid/generated
 * content on app background, kill, or tab switch. Launch-safe MVP; full
 * Supabase persistence ships in Phase 16B.2.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AICacheType = 'makeup' | 'routine' | 'skin';

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const key = (type: AICacheType) => `@rituel:ai_cache:${type}`;

export type AICacheEntry<T = unknown> = {
  data: T;
  savedAt: number; // epoch ms
};

export async function saveAICache<T>(type: AICacheType, data: T): Promise<void> {
  try {
    const entry: AICacheEntry<T> = { data, savedAt: Date.now() };
    await AsyncStorage.setItem(key(type), JSON.stringify(entry));
  } catch {
    // best-effort; cache failure should never break the user flow
  }
}

export async function loadAICache<T>(type: AICacheType): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key(type));
    if (!raw) return null;
    const entry: AICacheEntry<T> = JSON.parse(raw);
    if (!entry || typeof entry.savedAt !== 'number') {
      await AsyncStorage.removeItem(key(type));
      return null;
    }
    if (Date.now() - entry.savedAt > TTL_MS) {
      await AsyncStorage.removeItem(key(type));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function clearAICache(type: AICacheType): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(type));
  } catch {
    // best-effort
  }
}
