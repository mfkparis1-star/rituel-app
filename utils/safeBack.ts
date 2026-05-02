import { router } from 'expo-router';

/**
 * Crash-safe back navigation.
 *
 * Phase 14.5 — fixes router.back() crash when navigation stack is empty
 * (deep link, hot reload, direct tab open).
 *
 * - If a previous route exists, calls router.back()
 * - Otherwise navigates to fallback (default: home tab)
 */
export function safeBack(fallback: string = '/(tabs)/index') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}