import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RiderAppSettingsApiResponse } from '../api/appSettingsTypes';
import { defaultBrandColors, type BrandColors } from './colors';

const THEME_CACHE_KEY = 'deliveries_rider_app_theme_cache';

type StoredThemeCache = {
  colors: BrandColors;
  updatedAt: string | null;
};

// The Pohanch palette is fixed in the app: server-driven colours (legacy defaults such as a purple primary
// with white button text) would break the yellow-fill / ink-content contrast rules, so they are ignored.
export const getBrandColorsFromSettings = (
  _settings?: Pick<
    RiderAppSettingsApiResponse,
    'primary_color' | 'secondary_color' | 'tertiary_color'
  > | null
): BrandColors => ({ ...defaultBrandColors });

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
