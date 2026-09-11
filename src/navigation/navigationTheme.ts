import { DarkTheme, DefaultTheme, Theme as NavigationTheme } from '@react-navigation/native';
import { Theme } from '../theme/theme';

export function buildNavigationTheme(theme: Theme): NavigationTheme {
  if (theme.isDark) {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        primary: theme.colors.primary,
      },
    };
  }

  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };
}
