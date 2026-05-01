/**
 * Light analytics event tracking.
 * Phase 11: paywall events only. Phase 14 will expand if needed.
 *
 * Dev: console.log only.
 * Prod: TODO wire to PostHog/Amplitude.
 */
export type EventName =
  | 'paywall_viewed'
  | 'paywall_cta_clicked'
  | 'purchase_success'
  | 'purchase_failed'
  | 'restore_clicked'
  | 'restore_success'
  | 'restore_failed';

export function trackEvent(name: EventName, payload?: Record<string, any>): void {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, payload || '');
  }
}
