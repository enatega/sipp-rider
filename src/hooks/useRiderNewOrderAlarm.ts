import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import { newOrderBeepManager } from '../sound/newOrderBeep';
import { useBackgroundOrderRing } from './useBackgroundOrderRing';
import { useRiderOrdersInfiniteQuery } from './useRiderHomeQueries';
import { useRiderProfileQuery } from './useRiderProfileQuery';

/**
 * Beeps continuously while an online rider has orders waiting in the New tab.
 * The loop is level-triggered from the shared New-tab query, so it also covers
 * orders already listed at launch and ends when the list empties (assigned,
 * cancelled) or the rider goes offline.
 */
export function useRiderNewOrderAlarm() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslations('app');
  const profile = useRiderProfileQuery(isAuthenticated);
  const isOnline = isAuthenticated && profile.data?.availabilityStatus === 'online';
  const orders = useRiderOrdersInfiniteQuery('new', '', isOnline);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const hasPendingOrders = Boolean(
    orders.data?.pages.some((page) => page.items.some((order) => order.canAssignMe)),
  );
  const shouldRing = isOnline && hasPendingOrders && appState === 'active';
  const { refetch } = orders;
  const refreshHasPending = useCallback(async () => {
    const result = await refetch();
    return result.data?.pages.some((page) => page.items.some((order) => order.canAssignMe)) ?? false;
  }, [refetch]);
  useBackgroundOrderRing({
    appState,
    hasPendingOrders: isOnline && hasPendingOrders,
    title: t('status_new_order'),
    refreshHasPending,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (shouldRing) void newOrderBeepManager.startLoop();
    else void newOrderBeepManager.stopLoop();
  }, [shouldRing]);

  useEffect(() => () => void newOrderBeepManager.stopLoop(), []);
}
