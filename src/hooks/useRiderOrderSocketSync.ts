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
import { applyAssignedSummaryCounts, removeOrderFromNewOrdersCache } from './riderHomeCache';
import { useRiderOrderAlerts } from '../providers/RiderOrderAlertsProvider';

export function useRiderOrderSocketSync() {
  const queryClient = useQueryClient();
  const { session, isAuthenticated } = useAuth();
  const {
    clearAlerts,
    closeOffer,
    receiveAssignment,
    receiveOffer,
  } = useRiderOrderAlerts();

  const token = session.token ?? null;
  const userId = session.user?.id ?? null;

  useEffect(() => {
    riderOrdersSocketClient.updateSession({ token, userId });

    if (!isAuthenticated || !token) {
      riderOrdersSocketClient.disconnect();
      clearAlerts();
      return;
    }

    riderOrdersSocketClient.connect();

    return () => {
      riderOrdersSocketClient.disconnect();
    };
  }, [clearAlerts, isAuthenticated, token, userId]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

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
          if (payload.assignmentType === 'manual') {
            receiveAssignment({ orderId: payload.orderId });
          } else {
            closeOffer(payload.orderId);
          }
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
      },
    );

    const unsubscribeRiderStatus = riderOrdersSocketClient.subscribeRiderStatusUpdated(
      (payload: RiderStatusUpdatedPayload) => {
        console.log("[rider][socket] rider-status-updated received", payload);
        if (!payload?.orderId) return;
        invalidateRiderOrderCaches(payload.orderId);
      },
    );

    const unsubscribeRiderOrderAvailable = riderOrdersSocketClient.subscribeRiderOrderAvailable(
      (payload: RiderOrderAvailablePayload) => {
        console.log("[rider][socket] rider-order-available received", payload);
        if (!payload?.orderId) return;
        if (payload.status === 'rider_assigned') {
          removeOrderFromNewOrdersCache(queryClient, payload.orderId);
          closeOffer(payload.orderId);
        } else {
          receiveOffer(payload);
        }
        invalidateRiderOrderCaches(payload.orderId);
      },
    );

    return () => {
      unsubscribeOrderStatus();
      unsubscribeRiderStatus();
      unsubscribeRiderOrderAvailable();
    };
  }, [closeOffer, isAuthenticated, queryClient, receiveAssignment, receiveOffer, token]);

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
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.all });
      }
    });

    const netInfoSubscription = NetInfo.addEventListener((state) => {
      const isReachable = state.isConnected && state.isInternetReachable !== false;
      if (!isReachable || appState !== 'active') return;
      riderOrdersSocketClient.connect();
      queryClient.invalidateQueries({ queryKey: riderHomeKeys.all });
    });

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, [isAuthenticated, queryClient, token]);
}
