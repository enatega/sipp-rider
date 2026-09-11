import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { SupportedLanguage } from './i18n';
import { Namespace } from './translations';

type LocalizationContextValue = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
};

const LocalizationContext = createContext<LocalizationContextValue>({
  language: 'en',
  setLanguage: async () => {},
});

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();

  const language = (i18nInstance.language as SupportedLanguage) ?? 'en';

  const value = useMemo(
    () => ({
      language,
      setLanguage: async (lang: SupportedLanguage) => {
        await i18n.changeLanguage(lang);
      },
    }),
    [language]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useTranslations(namespace: Namespace) {
  return useTranslation(namespace);
}

export function useLocalization() {
  return useContext(LocalizationContext);
}
