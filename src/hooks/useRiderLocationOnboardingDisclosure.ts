import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getRiderDeliveryLocationPermissionStatus,
  requestRiderDeliveryLocationPermissions,
} from '../location/riderBackgroundLocationTask';

const DISCLOSURE_SHOWN_STORAGE_KEY = 'sip-rider-location-disclosure-shown';

/**
 * Shows the prominent location disclosure once, as soon as an approved rider
 * reaches the home screen, so consent is collected before any location
 * permission prompt rather than only at the first order pickup.
 * Declining ("Not now") is respected; the disclosure is shown again at pickup.
 */
export function useRiderLocationOnboardingDisclosure(enabled: boolean) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;

    let isCancelled = false;
    void (async () => {
      const [shown, permission] = await Promise.all([
        AsyncStorage.getItem(DISCLOSURE_SHOWN_STORAGE_KEY),
        getRiderDeliveryLocationPermissionStatus(),
      ]);
      if (!isCancelled && !shown && !permission.granted) setVisible(true);
    })().catch((error) => {
      console.warn('[rider][location] unable to evaluate onboarding disclosure', error);
    });

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  const markShown = useCallback(async () => {
    setVisible(false);
    await AsyncStorage.setItem(DISCLOSURE_SHOWN_STORAGE_KEY, '1').catch(() => undefined);
  }, []);

  const onContinue = useCallback(async () => {
    await markShown();
    await requestRiderDeliveryLocationPermissions().catch((error) => {
      console.warn('[rider][location] onboarding permission request unavailable', error);
    });
  }, [markShown]);

  return { visible, onContinue, onNotNow: markShown };
}
