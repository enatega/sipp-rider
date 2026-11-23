import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RiderAppSettingsApiResponse } from '../api/appSettingsTypes';
import { defaultBrandColors, type BrandColors } from './colors';

const THEME_CACHE_KEY = 'deliveries_rider_app_theme_cache';

type StoredThemeCache = {
  colors: BrandColors;
  updatedAt: string | null;
};

const HEX_COLOR_PATTERN = /^#([0-9A-F]{3}|[0-9A-F]{6})$/i;

const isHexColor = (value: string | null | undefined): value is string =>
  Boolean(value && HEX_COLOR_PATTERN.test(value));

export const getBrandColorsFromSettings = (
  settings?: Pick<
    RiderAppSettingsApiResponse,
    'primary_color' | 'secondary_color' | 'tertiary_color'
  > | null
): BrandColors => ({
  primary: isHexColor(settings?.primary_color)
    ? settings.primary_color
    : defaultBrandColors.primary,
  secondary: isHexColor(settings?.secondary_color)
    ? settings.secondary_color
    : defaultBrandColors.secondary,
  tertiary: isHexColor(settings?.tertiary_color)
    ? settings.tertiary_color
    : defaultBrandColors.tertiary,
});

export const themeCache = {
  async get(): Promise<StoredThemeCache | null> {
    const rawValue = await AsyncStorage.getItem(THEME_CACHE_KEY);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as Partial<StoredThemeCache>;
      if (!parsed.colors) {
        return null;
      }

      return {
        colors: getBrandColorsFromSettings({
          primary_color: parsed.colors.primary,
          secondary_color: parsed.colors.secondary,
          tertiary_color: parsed.colors.tertiary,
        }),
        updatedAt: parsed.updatedAt ?? null,
      };
    } catch {
      return null;
    }
  },

  async set(payload: StoredThemeCache) {
    await AsyncStorage.setItem(THEME_CACHE_KEY, JSON.stringify(payload));
  },
};
