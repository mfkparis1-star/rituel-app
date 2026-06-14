/**
 * Lune — the gentle weekly ritual streak.
 *
 * A day "counts" when the evening ritual is completed (guided session
 * finished, or all steps checked). Stored as a per-day stamp in
 * AsyncStorage: @rituel:done:YYYY-MM-DD = "1". No punishment, no reset
 * — a missed day simply doesn't light up. 5+ days = full moon week.
 *
 * Pure-ish: only touches AsyncStorage, no network, no DB.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@rituel:done:';

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Mark a given day (default today) as ritual-completed. Idempotent. */
export async function markRitualDone(date: Date = new Date()): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + ymd(date), '1');
  } catch {
    // non-fatal
  }
}

/** Is the given day (default today) already marked done? */
export async function isRitualDone(date: Date = new Date()): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(PREFIX + ymd(date));
    return v === '1';
  } catch {
    return false;
  }
}

/**
 * Returns a Monday-based boolean[7] for the current week: true where
 * the ritual was completed. Aligned with WeekStrip's day order.
 */
export async function weekLune(): Promise<boolean[]> {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIdx);
  monday.setHours(0, 0, 0, 0);

  const keys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return PREFIX + ymd(d);
  });

  try {
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.map(([, v]) => v === '1');
  } catch {
    return [false, false, false, false, false, false, false];
  }
}

/** Count of completed days this week (0–7). */
export function luneCount(week: boolean[]): number {
  return week.filter(Boolean).length;
}

/**
 * Consecutive-week streak: how many weeks in a row (this week back)
 * have at least one completed ritual. The current week counts as soon
 * as it has one stamp. A fully empty week breaks the streak. Gentle,
 * not punishing — it only ever celebrates continuity.
 */
export async function weekStreak(maxWeeks = 52): Promise<number> {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7; // 0 = Monday
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - todayIdx);
  thisMonday.setHours(0, 0, 0, 0);

  try {
    let streak = 0;
    for (let w = 0; w < maxWeeks; w++) {
      const monday = new Date(thisMonday);
      monday.setDate(thisMonday.getDate() - w * 7);
      const keys = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return PREFIX + ymd(d);
      });
      const pairs = await AsyncStorage.multiGet(keys);
      const hasAny = pairs.some(([, v]) => v === '1');
      if (hasAny) {
        streak++;
      } else {
        // current week (w === 0) with no stamp yet shouldn't break a
        // past streak — skip it; any past empty week ends the streak.
        if (w === 0) continue;
        break;
      }
    }
    return streak;
  } catch {
    return 0;
  }
}
