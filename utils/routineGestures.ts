/**
 * routineGestures — maps a product category to a default duration
 * and a gesture-hint i18n key. Pure, data-driven; unknown or null
 * categories return no hint (UI hides the second line gracefully).
 *
 * Categories are normalized (lowercased, accent-insensitive) so
 * 'Sérum', 'serum', 'SÉRUM' all match. Keys live under
 * home.categories.* (canonical label) and home.gestures.* (hint).
 */

const NORMALIZE = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// canonical category id -> { defaultDuration, hintKey }
const MAP: Record<string, { duration: string; hint: string }> = {
  nettoyant: { duration: '60s', hint: 'home.gestures.nettoyant' },
  tonique: { duration: '30s', hint: 'home.gestures.tonique' },
  serum: { duration: '30s', hint: 'home.gestures.serum' },
  hydratant: { duration: '60s', hint: 'home.gestures.hydratant' },
  contour: { duration: '30s', hint: 'home.gestures.contour' },
  huile: { duration: '60s', hint: 'home.gestures.huile' },
  masque: { duration: '120s', hint: 'home.gestures.masque' },
  spf: { duration: '60s', hint: 'home.gestures.spf' },
  corps: { duration: '90s', hint: 'home.gestures.corps' },
};

export type CategoryInfo = {
  /** canonical id, e.g. 'serum'; null if unknown */
  id: string | null;
  /** default step duration string, e.g. '60s' */
  duration: string;
  /** i18n key for the gesture hint, or null if none */
  hintKey: string | null;
};

export function categoryInfo(category: string | null | undefined): CategoryInfo {
  if (!category) return { id: null, duration: '60s', hintKey: null };
  const id = NORMALIZE(category);
  const entry = MAP[id];
  if (!entry) return { id: null, duration: '60s', hintKey: null };
  return { id, duration: entry.duration, hintKey: entry.hint };
}
