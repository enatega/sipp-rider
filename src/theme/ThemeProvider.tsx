import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';
import { appSettingsService } from '../api/appSettingsService';
import { defaultBrandColors } from './colors';
import { buildTheme, Theme } from './theme';
import { getBrandColorsFromSettings, themeCache } from './themeCache';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  themeMode: ThemeMode;
  isReady: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_STORAGE_KEY = 'deliveries_rider_app_theme_mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [brandColors, setBrandColors] = useState(defaultBrandColors);
  const [isReady, setIsReady] = useState(false);
  const themeMode: ThemeMode = 'light';
  const setThemeMode = async (_mode: ThemeMode) => { };
  const theme = useMemo(() => buildTheme('light', brandColors), [brandColors]);

  useEffect(() => {
    let isMounted = true;

    const hydrateTheme = async () => {
      let cachedUpdatedAt: string | null = null;

      try {
        const cachedTheme = await themeCache.get();
        cachedUpdatedAt = cachedTheme?.updatedAt ?? null;
        if (cachedTheme?.colors && isMounted) {
          setBrandColors(cachedTheme.colors);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }

      try {
        const settings = await appSettingsService.getRiderAppSettings();
        const nextColors = getBrandColorsFromSettings(settings);

        if (isMounted) {
          setBrandColors((currentColors) => {
            if (
              currentColors.primary === nextColors.primary &&
              currentColors.secondary === nextColors.secondary &&
              currentColors.tertiary === nextColors.tertiary
            ) {
              return currentColors;
            }

            return nextColors;
          });
        }

        if (settings.updated_at !== cachedUpdatedAt) {
          await themeCache.set({
            colors: nextColors,
            updatedAt: settings.updated_at ?? null,
          });
        }
      } catch (error) {
        console.warn('[THEME SETTINGS]', 'Failed to refresh rider app theme.', error);
      }
    };

    void hydrateTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isReady,
      setThemeMode,
    }),
    [theme, themeMode, isReady]
  );

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }

  return context;
}
