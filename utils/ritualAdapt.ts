/**
 * ritualAdapt — given today's check-in mood and the evening steps,
 * decide which steps stay and which are softened for tonight.
 *
 * Pure & offline. No AI, no DB writes. "Soften" never deletes a
 * step — it just flags actives to rest on low-energy days. The
 * headline + per-step intent come from i18n via the returned keys.
 */
import type { CheckinEmoji } from './checkins';

// categories considered "active" (skipped on tough days)
const ACTIVE = new Set(['serum', 'masque']);

const NORM = (s: string | null | undefined) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export type AdaptedStep<T> = {
  step: T;
  softened: boolean;
};

export type Adaptation<T> = {
  /** i18n key for the headline, under home.adapt.headline.* */
  headlineKey: string;
  /** whether anything was softened (false => full ritual kept) */
  changed: boolean;
  steps: AdaptedStep<T>[];
};

// moods that lighten the ritual
const LIGHTEN: Record<CheckinEmoji, boolean> = {
  glowing: false,
  good: false,
  neutral: false,
  tired: true,
  rough: true,
};

export function adaptRitual<T extends { category: string | null }>(
  emoji: CheckinEmoji,
  steps: T[]
): Adaptation<T> {
  const lighten = LIGHTEN[emoji];
  const adapted = steps.map((step) => ({
    step,
    softened: lighten && ACTIVE.has(NORM(step.category)),
  }));
  const changed = adapted.some((a) => a.softened);
  return {
    headlineKey: `home.adapt.headline.${emoji}`,
    changed,
    steps: adapted,
  };
}
