import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useProfile } from './useProfile';
import {
  type Lang,
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  normalizeDeviceLocale,
  t as translateRaw,
} from '../utils/i18n';

const STORAGE_KEY = '@rituel:lang';

/**
 * useLanguage — single source of truth for active locale.
 *
 * Resolution on mount: AsyncStorage -> profile.language ->
 * device locale -> 'fr'. setLanguage(next) persists to
 * AsyncStorage and updates immediately. We do not write to
 * profile.language from here — explicit save action belongs
 * to the Settings screen (Phase 19.x).
 */
export function useLanguage() {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG);
  const { profile } = useProfile();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGS.includes(stored as Lang)) {
          if (mounted) setLang(stored as Lang);
          return;
        }
      } catch {
        // fall through
      }
      const fromProfile = profile?.language ? normalizeDeviceLocale(profile.language) : null;
      if (fromProfile && mounted) {
        setLang(fromProfile);
        return;
      }
      try {
        const locales = Localization.getLocales();
        const device = locales[0]?.languageTag ?? locales[0]?.languageCode ?? null;
        const norm = normalizeDeviceLocale(device);
        if (norm && mounted) setLang(norm);
      } catch {
        // stick to default
      }
    })();
    return () => { mounted = false; };
  }, [profile?.language]);

  const setLanguage = useCallback(async (next: Lang) => {
    setLang(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // non-fatal
    }
  }, []);

  const t = useCallback((key: string) => translateRaw(key, lang), [lang]);

  return { lang, t, setLanguage };
}
