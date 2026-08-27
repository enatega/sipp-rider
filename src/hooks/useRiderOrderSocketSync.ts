import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../auth/AuthProvider';
import { riderHomeKeys } from '../api/queryKeys';
import type { RiderOrderDetail } from '../api/riderOrderDetailTypes';
import {
  riderOrdersSocketClient,
  type RiderOrderAvailablePayload,
  type RiderOrderStatusUpdatedPayload,
  type RiderStatusUpdatedPayload,
} from '../socket/riderOrdersSocket';
import { riderHomeService } from '../api/riderHomeService';
import type { RiderHomeSummary } from '../api/riderHomeTypes';
import { newOrderBeepManager } from '../sound/newOrderBeep';
import { applyAssignedSummaryCounts, removeOrderFromNewOrdersCache } from './riderHomeCache';

export function useRiderOrderSocketSync() {
  const queryClient = useQueryClient();
  const { session, isAuthenticated } = useAuth();

  const token = session.token ?? null;
  const userId = session.user?.id ?? null;

  const syncNewOrderBeepFromSummary = async () => {
    const summary = await queryClient.fetchQuery<RiderHomeSummary>({
      queryKey: riderHomeKeys.summary(),
      queryFn: riderHomeService.getSummary,
      staleTime: 0,
    });

    if ((summary.newOrders ?? 0) > 0) {
      await newOrderBeepManager.start();
      return;
    }

    await newOrderBeepManager.stop();
  };

  useEffect(() => {
    riderOrdersSocketClient.updateSession({ token, userId });

    if (!isAuthenticated || !token) {
      riderOrdersSocketClient.disconnect();
      void newOrderBeepManager.stop();
      return;
    }

    riderOrdersSocketClient.connect();

    return () => {
      riderOrdersSocketClient.disconnect();
      void newOrderBeepManager.stop();
    };
  }, [isAuthenticated, token, userId]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    void syncNewOrderBeepFromSummary();

    const invalidateRiderOrderCaches = (orderId?: string) => {
      queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() });
      queryClient.invalidateQueries({ queryKey: riderHomeKeys.ordersAll() });
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.orderDetail(orderId) });
      }
    };

    const unsubscribeOrderStatus = riderOrdersSocketClient.subscribeOrderStatusUpdated(
      (payload: RiderOrderStatusUpdatedPayload) => {
        console.log("[rider][socket] order-status-updated received", payload);
        if (!payload?.orderId) return;
        if (payload.status === 'rider_assigned') {
          removeOrderFromNewOrdersCache(queryClient, payload.orderId);
          applyAssignedSummaryCounts(queryClient);
        }

        queryClient.setQueryData<RiderOrderDetail>(
          riderHomeKeys.orderDetail(payload.orderId),
          (current) => {
            if (!current) return current;
            return {
              ...current,
              status: payload.status ?? current.status,
              riderStatus: payload.riderStatus ?? current.riderStatus,
            };
          },
        );
        queryClient.refetchQueries({ queryKey: riderHomeKeys.orderDetail(payload.orderId) });

        invalidateRiderOrderCaches(payload.orderId);
        void syncNewOrderBeepFromSummary();
      },
    );

    const unsubscribeRiderStatus = riderOrdersSocketClient.subscribeRiderStatusUpdated(
      (payload: RiderStatusUpdatedPayload) => {
        console.log("[rider][socket] rider-status-updated received", payload);
        if (!payload?.orderId) return;
        invalidateRiderOrderCaches(payload.orderId);
        void syncNewOrderBeepFromSummary();
      },
    );

    const unsubscribeRiderOrderAvailable = riderOrdersSocketClient.subscribeRiderOrderAvailable(
      (payload: RiderOrderAvailablePayload) => {
        console.log("[rider][socket] rider-order-available received", payload);
        if (!payload?.orderId) return;
        if (payload.status === 'rider_assigned') {
          removeOrderFromNewOrdersCache(queryClient, payload.orderId);
        }
        invalidateRiderOrderCaches(payload.orderId);
        void syncNewOrderBeepFromSummary();
      },
    );

    return () => {
      unsubscribeOrderStatus();
      unsubscribeRiderStatus();
      unsubscribeRiderOrderAvailable();
    };
  }, [isAuthenticated, queryClient, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    let appState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const wasActive = appState === 'active';
      appState = nextState;

      if (wasActive && nextState !== 'active') {
        riderOrdersSocketClient.disconnect();
        return;
      }

      if (nextState === 'active') {
        riderOrdersSocketClient.connect();
        void syncNewOrderBeepFromSummary();
      }
    });

    const netInfoSubscription = NetInfo.addEventListener((state) => {
      const isReachable = state.isConnected && state.isInternetReachable !== false;
      if (!isReachable || appState !== 'active') return;
      riderOrdersSocketClient.connect();
      void syncNewOrderBeepFromSummary();
    });

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, [isAuthenticated, token]);
}
