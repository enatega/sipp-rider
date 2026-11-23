import { useEffect } from 'react';
import { Platform, type AppStateStatus } from 'react-native';
import { orderAlertRing } from '../notifications/orderAlertRing';

const RECONCILE_MS = 10_000;

type Options = {
  appState: AppStateStatus;
  hasPendingOrders: boolean;
  title: string;
  /** Refetches the New orders list and resolves whether any order is still waiting. */
  refreshHasPending: () => Promise<boolean>;
};

/**
 * Android only: while backgrounded, a native foreground service loops the beep (it can also be
 * started by a new-order push before JS knows about the order). JS keeps the service honest by
 * stopping it as soon as the list is empty, so an order handled elsewhere does not ring on.
 */
export function useBackgroundOrderRing({ appState, hasPendingOrders, title, refreshHasPending }: Options) {
  const inBackground = Platform.OS === 'android' && appState !== 'active';

  useEffect(() => {
    if (!inBackground) return;
    if (hasPendingOrders) orderAlertRing.start(title);
    else orderAlertRing.stop();
  }, [inBackground, hasPendingOrders, title]);

  useEffect(() => {
    if (!inBackground) return;
    const interval = setInterval(() => {
      if (!orderAlertRing.isRinging()) return;
      void refreshHasPending().then((stillPending) => {
        if (!stillPending) orderAlertRing.stop();
      }).catch(() => undefined);
    }, RECONCILE_MS);
    return () => clearInterval(interval);
  }, [inBackground, refreshHasPending]);
}
