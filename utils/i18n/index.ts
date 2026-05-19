/**
 * Phase 19 — i18n core.
 *
 * Lightweight, build-free i18n. No native dependency, no extra
 * library — just typed locale dicts and a tiny t() resolver.
 *
 * Resolution order for active language:
 *   1. user override (set via setLanguage, persisted to AsyncStorage)
 *   2. profile.language (from useProfile, when authenticated)
 *   3. expo-localization device locale (mapped to fr/en/tr)
 *   4. 'fr' (default — Rituel's source of truth)
 *
 * Translation fallback chain:
 *   - if key missing in current locale, fall back to French
 *   - if key missing in French too, return the key itself
 *     (visible in dev so we know what to translate)
 */
import { fr, type LocaleDict } from './locales/fr';
import { en } from './locales/en';
import { tr } from './locales/tr';

export type Lang = 'fr' | 'en' | 'tr';

const DICTS: Record<Lang, LocaleDict> = { fr, en, tr };

export const SUPPORTED_LANGS: Lang[] = ['fr', 'en', 'tr'];

export const DEFAULT_LANG: Lang = 'fr';

/**
 * Resolve a nested key against a dict.
 * 'onboarding.slide1.headline' -> dict.onboarding.slide1.headline
 */
function resolveKey(dict: any, path: string): string | null {
  const parts = path.split('.');
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else {
      return null;
    }
  }
  return typeof cur === 'string' ? cur : null;
}

/**
 * Translate a key to a given language with fallback to French,
 * then to the key itself.
 */
export function t(key: string, lang: Lang = DEFAULT_LANG): string {
  const dict = DICTS[lang] ?? DICTS[DEFAULT_LANG];
  const direct = resolveKey(dict, key);
  if (direct !== null) return direct;
  if (lang !== DEFAULT_LANG) {
    const fallback = resolveKey(DICTS[DEFAULT_LANG], key);
    if (fallback !== null) return fallback;
  }
  return key;
}

/**
 * Map a device locale string (e.g. 'fr-FR', 'en_US', 'tr') to
 * a supported Lang. Returns null if no match.
 */
export function normalizeDeviceLocale(raw: string | null | undefined): Lang | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('tr')) return 'tr';
  return null;
}
