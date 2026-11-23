import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { buildNavigationTheme } from './navigationTheme';
import { useRiderOrderSocketSync } from '../hooks/useRiderOrderSocketSync';
import { useRiderNewOrderAlarm } from '../hooks/useRiderNewOrderAlarm';
import { flushPendingOrderNotification, notificationNavigationRef } from './notificationNavigation';

export default function RootNavigator() {
  const { theme } = useAppTheme();
  const { isAuthenticated, isReady } = useAuth();
  useRiderOrderSocketSync();
  useRiderNewOrderAlarm();

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
        <ActivityIndicator color={theme.colors.brandInk} />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={notificationNavigationRef}
      theme={buildNavigationTheme(theme)}
      onReady={flushPendingOrderNotification}
      onStateChange={flushPendingOrderNotification}
    >
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
