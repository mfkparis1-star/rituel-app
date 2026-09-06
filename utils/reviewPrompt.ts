/**
 * In-app review prompt — asks at a happy moment, politely.
 *
 * Rules:
 *  - only after the user has had >= 2 happy moments total
 *    (completed rituals + successful skin analyses)
 *  - at most ONCE per app version (Apple also rate-limits to
 *    3/year system-wide; the dialog may silently not appear)
 *  - never blocks or throws: every failure is swallowed, and the
 *    native module is lazy-required so an older binary without
 *    expo-store-review can't crash.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const K_COUNT = '@rituel:happyMoments';
const K_ASKED = '@rituel:reviewAskedVersion';

function appVersion(): string {
  try {
    const Constants = require('expo-constants').default;
    return Constants?.expoConfig?.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function noteHappyMoment(_kind: 'ritual' | 'analysis'): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(K_COUNT);
    const count = (parseInt(raw ?? '0', 10) || 0) + 1;
    await AsyncStorage.setItem(K_COUNT, String(count));
    if (count < 2) return;

    const version = appVersion();
    const asked = await AsyncStorage.getItem(K_ASKED);
    if (asked === version) return;

    const StoreReview = require('expo-store-review');
    if (await StoreReview.isAvailableAsync()) {
      await AsyncStorage.setItem(K_ASKED, version);
      // Small delay so the celebration screen settles first.
      setTimeout(() => { StoreReview.requestReview().catch(() => {}); }, 1200);
    }
  } catch {
    // never let review plumbing affect the app
  }
}
