import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

export const notificationNavigationRef = createNavigationContainerRef<MainStackParamList>();

type PendingNotification =
  | { kind: 'detail'; orderId: string }
  | { kind: 'offer'; orderId: string; orderCode?: string };

let pendingNotification: PendingNotification | null = null;

function validOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
}

export function queueOrderNotificationNavigation(value: unknown) {
  if (!validOrderId(value)) return;
  pendingNotification = { kind: 'detail', orderId: value };
  flushPendingOrderNotification();
}

export function queueOfferNotificationNavigation(value: unknown, orderCode?: unknown) {
  if (!validOrderId(value)) return;
  pendingNotification = {
    kind: 'offer',
    orderId: value,
    orderCode: typeof orderCode === 'string' ? orderCode : undefined,
  };
  flushPendingOrderNotification();
}

export function flushPendingOrderNotification() {
  if (!pendingNotification || !notificationNavigationRef.isReady()) return;
  const mainReady = notificationNavigationRef.getRootState()?.routes.some((route) =>
    route.name === 'Home' || route.name === 'ProcessingOrderDetail',
  );
  if (!mainReady) return;
  const pending = pendingNotification;
  pendingNotification = null;
  if (pending.kind === 'offer') {
    notificationNavigationRef.navigate('Home', {
      screen: 'HomeTab',
      params: { focusedOffer: { orderId: pending.orderId, orderCode: pending.orderCode } },
    });
  } else {
    notificationNavigationRef.navigate('ProcessingOrderDetail', { orderId: pending.orderId });
  }
}
