import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../auth/AuthProvider';
import apiClient from '../api/apiClient';

export function usePushTokenSync() {
  const { session } = useAuth();
  const lastRegistered = useRef<string | null>(null);

  useEffect(() => {
    lastRegistered.current = null;
    if (!session.token || !Device.isDevice) return;
    let disposed = false;
    const sync = async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted && permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) return;
        const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (disposed || !token || token === lastRegistered.current) return;
        await apiClient.post('/users/push-token/register', { token });
        lastRegistered.current = token;
      } catch {
        // Retry on the next foreground event.
      }
    };
    void sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => { disposed = true; subscription.remove(); };
  }, [session.token]);
}
