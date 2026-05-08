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
