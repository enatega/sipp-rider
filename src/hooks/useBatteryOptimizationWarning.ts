import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

type BatteryModule = { isBatteryOptimizationEnabledAsync: () => Promise<boolean> };

// Loaded lazily: an over-the-air update can reach a binary built before expo-battery
// was added, and a top-level import would crash it at startup.
function loadBatteryModule(): BatteryModule | null {
  try {
    return require('expo-battery') as BatteryModule;
  } catch {
    return null;
  }
}

async function isBatteryOptimizationEnabled() {
  const battery = loadBatteryModule();
  if (!battery) return false;
  try {
    return await battery.isBatteryOptimizationEnabledAsync();
  } catch {
    return false;
  }
}

/**
 * Android battery optimization (and OEM savers on Xiaomi, Oppo, Vivo, Samsung) can stop the
 * background location service mid-delivery, freezing the rider on the customer's map.
 * Reports when the app is still optimized so the rider can switch it to "Unrestricted".
 */
export function useBatteryOptimizationWarning(enabled: boolean) {
  const [isOptimized, setIsOptimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isSupported = Platform.OS === 'android' && enabled;

  useEffect(() => {
    if (!isSupported) {
      setIsOptimized(false);
      return undefined;
    }

    let isCancelled = false;
    const check = () => {
      void isBatteryOptimizationEnabled().then((optimized) => {
        if (!isCancelled) setIsOptimized(optimized);
      });
    };

    check();
    // The rider changes this in system settings, so re-check when they come back.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    return () => {
      isCancelled = true;
      subscription.remove();
    };
  }, [isSupported]);

  const openSettings = useCallback(() => {
    // App info leads to Battery > Unrestricted on Android 12+ and to the OEM battery page on
    // Xiaomi/Oppo/Vivo, which the generic optimization list does not cover.
    void Linking.openSettings().catch((error) => {
      console.warn('[rider][battery] unable to open app settings', error);
    });
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  return { visible: isSupported && isOptimized && !dismissed, openSettings, dismiss };
}
