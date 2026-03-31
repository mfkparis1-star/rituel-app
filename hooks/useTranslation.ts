import { getLocales } from 'expo-localization';
import en from '../locales/en';
import fr from '../locales/fr';

type Translations = typeof fr;

const translations: Record<string, Translations> = { fr, en };

export function useTranslation() {
  const locale = getLocales()[0]?.languageCode || 'fr';
  const lang = locale.startsWith('fr') ? 'fr' : 'en';
  const t = translations[lang] || fr;
  return { t, lang };
}