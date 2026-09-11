export type BrandColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

const baseLightColors = {
  black: '#000000',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  primary: '#90E36D',
  secondary: '#6B5BFF',
  tertiary: '#F3F4F6',
  text: '#111827',
  mutedText: '#6B7280',
  border: '#D1D5DB',
  white: '#FFFFFF',
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  blue500: '#3B82F6',
  blue400: '#5392F7',
  emerald900: '#065F46',
  emerald500: '#10B981',
  emerald100: '#D1FAE5',
  amber800: '#92400E',
  amber100: '#FEF3C7',
  red800: '#991B1B',
  red500: '#EF4444',
  red100: '#FEE2E2',
  indigo600: '#4F46E5',
  loginBackground: '#F5F5F5',
  mapRoute: '#4F9D2F',
  zinc800: '#27272A',
  splashBackground: '#020B2B',
  modalBackdrop: 'rgba(17, 24, 39, 0.28)',
  sky100: '#E0F2FE',
  sky600: '#0284C7',
  green600: '#059669',
  green50: '#ECFDF5',
  gray150: '#E5E7EB',
  gray250: '#D1D5DB',
  lime500: '#72D13D',
  lime600: '#67C933',
  shadow: 'rgba(17, 24, 39, 0.12)',
};

const baseDarkColors: typeof baseLightColors = {
  black: '#000000',
  background: '#0F1117',
  surface: '#161A23',
  primary: '#90E36D',
  secondary: '#8B7BFF',
  tertiary: '#111827',
  text: '#F9FAFB',
  mutedText: '#9CA3AF',
  border: '#424244',
  white: '#FFFFFF',
  gray900: '#F9FAFB',
  gray800: '#111827',
  gray700: '#D1D5DB',
  gray600: '#9CA3AF',
  gray500: '#9CA3AF',
  gray400: '#6B7280',
  gray300: '#374151',
  gray200: '#1F2937',
  gray100: '#111827',
  gray50: '#0B1220',
  blue500: '#3B82F6',
  blue400: '#5392F7',
  emerald900: '#065F46',
  emerald500: '#10B981',
  emerald100: '#D1FAE5',
  amber800: '#92400E',
  amber100: '#FEF3C7',
  red800: '#991B1B',
  red500: '#EF4444',
  red100: '#FEE2E2',
  indigo600: '#4F46E5',
  loginBackground: '#F5F5F5',
  mapRoute: '#4F9D2F',
  zinc800: '#27272A',
  splashBackground: '#020B2B',
  modalBackdrop: 'rgba(17, 24, 39, 0.28)',
  sky100: '#082F49',
  sky600: '#38BDF8',
  green600: '#34D399',
  green50: '#052E24',
  gray150: '#1F2937',
  gray250: '#374151',
  lime500: '#72D13D',
  lime600: '#67C933',
  shadow: 'rgba(2, 6, 23, 0.45)',
};

export const defaultBrandColors: BrandColors = {
  primary: baseLightColors.primary,
  secondary: baseLightColors.secondary,
  tertiary: baseLightColors.tertiary,
};

export const applyBrandColors = <
  TColors extends typeof baseLightColors | typeof baseDarkColors,
>(
  colors: TColors,
  brandColors: BrandColors = defaultBrandColors
) => ({
  ...colors,
  primary: brandColors.primary,
  secondary: brandColors.secondary,
  tertiary: brandColors.tertiary,
  lime500: brandColors.primary,
  lime600: brandColors.primary,
});

export const lightColors = applyBrandColors(baseLightColors);
export const darkColors = applyBrandColors(baseDarkColors, {
  primary: baseDarkColors.primary,
  secondary: baseDarkColors.secondary,
  tertiary: baseDarkColors.tertiary,
});

export type ThemeColors = typeof lightColors;
