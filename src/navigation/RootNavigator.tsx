import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { buildNavigationTheme } from './navigationTheme';
import { useRiderOrderSocketSync } from '../hooks/useRiderOrderSocketSync';

export default function RootNavigator() {
  const { theme } = useAppTheme();
  const { isAuthenticated, isReady } = useAuth();
  useRiderOrderSocketSync();

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

  return (
    <NavigationContainer theme={buildNavigationTheme(theme)}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
