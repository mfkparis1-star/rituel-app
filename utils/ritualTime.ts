/**
 * ritualTime — the user's preferred evening ritual hour.
 * Stored locally (AsyncStorage). Default 20:30. Used by the Accueil
 * hero ("Ce soir · 20:30") and, later, the evening reminder.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@rituel:eveningTime';
const DEFAULT = '20:30';

export async function getRitualTime(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v && /^\d{2}:\d{2}$/.test(v) ? v : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export async function setRitualTime(hhmm: string): Promise<void> {
  try {
    if (/^\d{2}:\d{2}$/.test(hhmm)) await AsyncStorage.setItem(KEY, hhmm);
  } catch {
    // non-fatal
  }
}

export const DEFAULT_RITUAL_TIME = DEFAULT;
