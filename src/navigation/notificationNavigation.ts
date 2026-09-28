import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

export const notificationNavigationRef = createNavigationContainerRef<MainStackParamList>();

let pendingOrderId: string | null = null;

export function queueOrderNotificationNavigation(value: unknown) {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) return;
  pendingOrderId = value;
  flushPendingOrderNotification();
}

export function flushPendingOrderNotification() {
  if (!pendingOrderId || !notificationNavigationRef.isReady()) return;
  const mainReady = notificationNavigationRef.getRootState()?.routes.some((route) =>
    route.name === 'Home' || route.name === 'ProcessingOrderDetail',
  );
  if (!mainReady) return;
  const orderId = pendingOrderId;
  pendingOrderId = null;
  notificationNavigationRef.navigate('ProcessingOrderDetail', { orderId });
}
