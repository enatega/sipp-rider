import enApp from './en';
import frApp from './fr';

export const translations = {
  en: {
    app: enApp,
  },
  fr: {
    app: frApp,
  },
} as const;

export type Language = keyof typeof translations;
export type Namespace = keyof typeof translations.en;
