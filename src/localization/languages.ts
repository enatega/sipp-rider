export type LanguageOption = {
  value: string; // sent as backend rider_language (e.g., "en-US", "es-ES")
  label: string;
  shortLabel: string;
  flag: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en-US', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { value: 'es-ES', label: 'Español', shortLabel: 'ES', flag: '🇪🇸' },
];
