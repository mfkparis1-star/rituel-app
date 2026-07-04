import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  type Lang,
  DEFAULT_LANG,
  SUPPORTED_LANGS,
  normalizeDeviceLocale,
  t as translateRaw,
} from '../utils/i18n';

const STORAGE_KEY = '@rituel:lang';

/**
 * Language is resolved ONCE, in a single provider, and shared by every
 * screen through context. This kills two bugs that came from each of the
 * 24 useLanguage() callers resolving independently:
 *   1. the French flash on launch (every caller started at DEFAULT_LANG)
 *   2. mixed FR/TR text (callers resolved at different times, out of sync)
 *
 * Initial value is read SYNCHRONOUSLY from the device locale, so the very
 * first paint is already in the right language — no 'fr' fallback frame.
 * A stored manual choice (AsyncStorage) is loaded right after and wins.
 */
function readDeviceLangSync(): Lang {
  try {
    const locales = Localization.getLocales();
    const device = locales[0]?.languageTag ?? locales[0]?.languageCode ?? null;
    return normalizeDeviceLocale(device) ?? DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

type LanguageContextValue = {
  lang: Lang;
  t: (key: string) => string;
  setLanguage: (next: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Synchronous device-locale start: first paint is already correct.
  const [lang, setLang] = useState<Lang>(readDeviceLangSync);

  // After mount, a manual stored choice (if any) overrides the device guess.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && SUPPORTED_LANGS.includes(stored as Lang) && mounted) {
          setLang(stored as Lang);
        }
      } catch {
        // keep device-derived value
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setLanguage = useCallback((next: Lang) => {
    setLang(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    lang,
    t: (key: string) => translateRaw(key, lang),
    setLanguage,
  }), [lang, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage — same API as before ({ lang, t, setLanguage }), now backed
 * by the shared provider so every screen sees the exact same language.
 * Falls back to a device-derived read if used outside the provider (should
 * not happen in-app; keeps tests and edge renders from crashing).
 */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  const lang = readDeviceLangSync();
  return {
    lang,
    t: (key: string) => translateRaw(key, lang),
    setLanguage: () => {},
  };
}
