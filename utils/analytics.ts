/**
 * Analytics — thin wrapper over PostHog.
 *
 * The trackEvent API is unchanged so every existing call site keeps
 * working; we just route events to PostHog in addition to the dev log.
 * If PostHog isn't configured (no key) or fails to init, tracking is a
 * silent no-op — analytics must never break the app.
 */
import PostHog from 'posthog-react-native';

export type EventName =
  | 'paywall_viewed'
  | 'paywall_cta_clicked'
  | 'purchase_success'
  | 'purchase_failed'
  | 'restore_clicked'
  | 'restore_success'
  | 'restore_failed'
  | 'skin_quiz_ai_cta_tapped'
  | 'skin_profile_analysis_completed'
  // Skin analysis funnel
  | 'skin_analysis_completed'
  | 'skin_evolution_shown'
  // Ton Glow viral loop
  | 'glow_streak_shared'
  | 'onboarding_completed';

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

let _client: PostHog | null = null;

export function initAnalytics(): void {
  if (_client || !KEY) return;
  try {
    _client = new PostHog(KEY, { host: HOST });
  } catch {
    _client = null;
  }
}

export function trackEvent(name: EventName, payload?: Record<string, any>): void {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, payload || '');
  }
  try {
    _client?.capture(name, payload);
  } catch {
    // non-fatal
  }
}

/** Tie events to a stable user id after sign-in (anonymous before). */
export function identifyUser(userId: string): void {
  try {
    _client?.identify(userId);
  } catch {
    // non-fatal
  }
}

export function resetAnalytics(): void {
  try {
    _client?.reset();
  } catch {
    // non-fatal
  }
}
