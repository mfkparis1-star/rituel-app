/**
 * Formatting helpers — French (fr-FR) locale.
 *
 * Pure functions. No side effects.
 */

/**
 * formatPriceFR — normalize a price into French euro format.
 *
 * Examples:
 *   "14.9"        -> "14,90 €"
 *   "39.95"       -> "39,95 €"
 *   "14"          -> "14,00 €"
 *   "49 €"        -> "49,00 €"
 *   "49,00 €"     -> "49,00 €"
 *   14.9          -> "14,90 €"
 *   null / "" / undefined -> ""
 *
 * On parse failure, returns the original string so we never display garbage.
 */
import { type Lang, t, localeToBcp47 } from './i18n';

export function formatPriceFR(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return '';
  const raw = typeof price === 'number' ? String(price) : price.trim();
  if (!raw) return '';

  // Strip everything except digits, comma, and dot.
  const cleaned = raw.replace(/[^0-9.,]/g, '').replace(',', '.');
  if (!cleaned) return raw;

  const value = parseFloat(cleaned);
  if (isNaN(value)) return raw;

  const fixed = value.toFixed(2);
  const fr = fixed.replace('.', ',');
  return `${fr} €`;
}

/**
 * formatDateFR — format ISO 8601 date string to French long date.
 *
 * Examples:
 *   "2027-05-08T13:30:00Z" -> "8 mai 2027"
 *   "2027-05-08"           -> "8 mai 2027"
 *   null / "" / undefined  -> ""
 *
 * On parse failure, returns empty string.
 */
export function formatDateFR(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * relativeTime — lang-aware relative timestamp.
 * Thresholds (behavior preserved across screens):
 *   <60s   -> just now
 *   <1h    -> N minutes ago
 *   <24h   -> N hours ago
 *   <7d    -> N days ago
 *   >=7d   -> locale short date (day + month)
 */
export function relativeTime(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return t('common.time.justNow', lang);
  if (sec < 3600) return t('common.time.minutesAgo', lang).replace('{n}', String(Math.floor(sec / 60)));
  if (sec < 86400) return t('common.time.hoursAgo', lang).replace('{n}', String(Math.floor(sec / 3600)));
  if (sec < 604800) return t('common.time.daysAgo', lang).replace('{n}', String(Math.floor(sec / 86400)));
  return d.toLocaleDateString(localeToBcp47(lang), { day: 'numeric', month: 'short' });
}

/**
 * formatDate — lang-aware long date (day + month + year).
 * Replaces formatDateFR for multilingual callers. formatDateFR kept for
 * backward compat (delegates to fr).
 */
export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(localeToBcp47(lang), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
