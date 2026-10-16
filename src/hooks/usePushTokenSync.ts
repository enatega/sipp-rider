import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../auth/AuthProvider';
import apiClient from '../api/apiClient';
import { ensureRiderNotificationChannels } from './useExpoPushToken';
import { pushTokenStorage } from '../api/pushTokenStorage';

export function usePushTokenSync() {
  const { session } = useAuth();
  const lastRegistered = useRef<string | null>(null);
  const lastRegisteredAt = useRef(0);

  useEffect(() => {
    lastRegistered.current = null;
    lastRegisteredAt.current = 0;
    if (!session.token || !Device.isDevice) return;
    let disposed = false;
    const sync = async () => {
      try {
        const hasOrderBeepChannel = await ensureRiderNotificationChannels();
        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted && permission.ios?.status !== Notifications.IosAuthorizationStatus.PROVISIONAL) return;
        const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (disposed || !token || (token === lastRegistered.current && Date.now() - lastRegisteredAt.current < 24 * 60 * 60 * 1000)) return;
        let beepCapabilityConfirmed = false;
        const registered = await pushTokenStorage.register(
          token,
          async () => {
            const result = await apiClient.post<{ registered: boolean; soundCapability?: string }>(
              '/users/push-token/register',
              {
                token,
                orderAlertSoundV1: true,
                riderOrderAlertSoundV2: true,
                riderOrderAlertSoundV3: true,
                riderOrderAlertSoundV4: hasOrderBeepChannel,
              },
            );
            beepCapabilityConfirmed = result.soundCapability === 'rider-v4';
            console.info('[rider][push] sound registration', {
              channelReady: hasOrderBeepChannel,
              serverCapability: result.soundCapability ?? 'unknown',
            });
          },
        );
        if (registered && beepCapabilityConfirmed) {
          lastRegistered.current = token;
          lastRegisteredAt.current = Date.now();
        } else if (registered) {
          console.warn('[rider][push] server did not confirm the five-second order channel; registration will retry on next app resume');
        }
      } catch (error) {
        console.warn('[rider][push] sound registration failed; retrying on next app resume', error);
      }
    };
    void sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => { disposed = true; subscription.remove(); };
  }, [session.token]);
}
