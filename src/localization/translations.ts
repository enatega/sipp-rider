import enApp from './en';
import esApp from './es';

export const translations = {
  en: {
    app: enApp,
  },
  es: {
    app: esApp,
  },
} as const;

export type Language = keyof typeof translations;
export type Namespace = keyof typeof translations.en;
