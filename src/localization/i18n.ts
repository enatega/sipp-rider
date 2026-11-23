import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { translations } from './translations';

const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
const LANGUAGE_STORAGE_KEY = 'deliveries_rider_app_language';

const normalizeLanguage = (languageTag: string) => {
  const short = languageTag?.split('-')?.[0];

  return SUPPORTED_LANGUAGES.includes(short as (typeof SUPPORTED_LANGUAGES)[number])
    ? short
    : 'en';
};

const deviceLocale = Localization.getLocales?.()?.[0]?.languageTag ?? 'en';
const defaultLanguage = normalizeLanguage(deviceLocale);

void i18n
  .use(initReactI18next)
  .init({
    lng: defaultLanguage,
    fallbackLng: 'en',
    resources: {
      en: translations.en,
      es: translations.es,
    },
    ns: ['app'],
    defaultNS: 'app',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  })
  .then(async () => {
    const saved = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY);

    if (saved && SUPPORTED_LANGUAGES.includes(saved as (typeof SUPPORTED_LANGUAGES)[number])) {
      await i18n.changeLanguage(saved);
    }
  });

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Maps a backend rider_language ("es", "es-ES", "en-US", ...) to an app language. */
export function toAppLanguage(riderLanguage: string): SupportedLanguage {
  return riderLanguage.toLowerCase().startsWith('es') ? 'es' : 'en';
}

/** Switches the app language and keeps it for the next launch. */
export async function changeAppLanguage(language: SupportedLanguage) {
  await i18n.changeLanguage(language);
  await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;
