import React, { useEffect } from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import QueryProvider from './src/providers/QueryProvider';
import { LocalizationProvider } from './src/localization/LocalizationProvider';
import { AuthProvider } from './src/auth/AuthProvider';
import IncomingOrderAlert from './src/components/IncomingOrderAlert';
import { RiderOrderAlertsProvider } from './src/providers/RiderOrderAlertsProvider';
import './src/localization/i18n';
import './src/location/riderBackgroundLocationTask';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getNavigationButtonStyle(backgroundColor: string) {
  const hex = backgroundColor.replace('#', '');
  const normalized = hex.length === 3
    ? hex.split('').map((value) => value + value).join('')
    : hex;

  if (normalized.length !== 6) {
    return 'light';
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.6 ? 'dark' : 'light';
}

function ThemedApp() {
  const { theme } = useAppTheme();
  const navigationBarColor = theme.colors.gray800;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const syncNavigationBar = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync(navigationBarColor);
        await NavigationBar.setButtonStyleAsync(
          getNavigationButtonStyle(navigationBarColor)
        );
      } catch (error) {
        console.warn('[NAVIGATION BAR]', 'Failed to sync Android navigation bar.', error);
      }
    };

    void syncNavigationBar();
  }, [navigationBarColor]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <RiderOrderAlertsProvider>
        <RootNavigator />
        <IncomingOrderAlert />
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      </RiderOrderAlertsProvider>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <QueryProvider>
          <LocalizationProvider>
            <AuthProvider>
              <ThemedApp />
            </AuthProvider>
          </LocalizationProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
