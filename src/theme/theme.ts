import { applyBrandColors, BrandColors, darkColors, lightColors, ThemeColors } from './colors';
import { layout } from './layout';
import { typography } from './typography';

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  layout: typeof layout;
};

export const buildTheme = (
  scheme: 'light' | 'dark' | null,
  brandColors?: BrandColors
): Theme => {
  const isDark = scheme === 'dark';
  const baseColors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors: brandColors ? applyBrandColors(baseColors, brandColors) : baseColors,
    typography,
    layout,
  };
};
