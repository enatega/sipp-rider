import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

type OrderAlertRingNative = {
  start(title: string, body: string): void;
  stop(): void;
  isRinging(): boolean;
};

// Android only. Absent on iOS and in builds made before the native module existed.
const native = Platform.OS === 'android'
  ? requireOptionalNativeModule<OrderAlertRingNative>('OrderAlertRing')
  : null;

/** Loops the new-order beep from a foreground service while the app is in the background. */
export const orderAlertRing = {
  start: (title: string, body = '') => native?.start(title, body),
  stop: () => native?.stop(),
  isRinging: () => native?.isRinging() ?? false,
};
