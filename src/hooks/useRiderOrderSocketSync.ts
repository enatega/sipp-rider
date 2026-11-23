import { stopRiderBackgroundLocation } from '../location/riderBackgroundLocationTask';
import { notificationNavigationRef } from '../navigation/notificationNavigation';
import { scheduleRiderOrderRefresh, scheduleRiderQueryRefresh } from './riderQueryRefresh';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuth } from '../auth/AuthProvider';
import { riderHomeKeys, supportChatKeys } from '../api/queryKeys';
import type { RiderOrderDetail } from '../api/riderOrderDetailTypes';
import {
  riderOrdersSocketClient,
  type RiderOrderAvailablePayload,
  type RiderOrderStatusUpdatedPayload,
  type RiderStatusUpdatedPayload,
} from '../socket/riderOrdersSocket';
import { applyAssignedSummaryCounts, removeOrderFromNewOrdersCache, removeOrderFromProcessingCache } from './riderHomeCache';
import { useRiderOrderAlerts } from '../providers/RiderOrderAlertsProvider';
import { applyOrderRouteUpdate } from './useOrderRouteQuery';

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
      scheduleRiderOrderRefresh(queryClient, { orderId });
    };

    const unsubscribeOrderStatus = riderOrdersSocketClient.subscribeOrderStatusUpdated(
      (payload: RiderOrderStatusUpdatedPayload) => {
        console.log("[rider][socket] order-status-updated received", payload);
        if (!payload?.orderId) return;
        if (payload.status === 'rider_assigned' || payload.assignmentType === 'manual') {
          if (removeOrderFromNewOrdersCache(queryClient, payload.orderId)) {
            applyAssignedSummaryCounts(queryClient);
          }
          if (payload.assignmentType === 'manual') {
            receiveAssignment({ orderId: payload.orderId, occurredAt: payload.updatedAt });
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
              eta: payload.eta ?? current.eta,
            };
          },
        );
        invalidateRiderOrderCaches(payload.orderId);
      },
    );

    const unsubscribeRiderStatus = riderOrdersSocketClient.subscribeRiderStatusUpdated(
      (payload: RiderStatusUpdatedPayload) => {
        console.log("[rider][socket] rider-status-updated received", payload);
        if (!payload?.orderId) return;
        const completed = payload.riderStatus === 'delivered';
        scheduleRiderOrderRefresh(queryClient, {
          tabs: completed ? ['processing', 'delivered'] : ['processing'],
          orderId: payload.orderId,
          summary: completed,
        });
      },
    );

    const unsubscribeRiderOrderAvailable = riderOrdersSocketClient.subscribeRiderOrderAvailable(
      (payload: RiderOrderAvailablePayload) => {
        console.log("[rider][socket] rider-order-available received", payload);
        if (!payload?.orderId) return;
        if (payload.status === 'rider_assigned' || payload.assignmentType === 'manual') {
          removeOrderFromNewOrdersCache(queryClient, payload.orderId);
          closeOffer(payload.orderId);
        } else {
          receiveOffer(payload);
        }
        invalidateRiderOrderCaches(payload.orderId);
      },
    );

    const unsubscribeOrderRoute = riderOrdersSocketClient.subscribeOrderRouteUpdated((payload) => {
      if (!payload?.orderId || !Array.isArray(payload.path) || typeof payload.version !== 'number') return;
      applyOrderRouteUpdate(queryClient, payload);
    });

    // Route pushes sent while the socket was down are lost, so re-read the server's route on (re)connect.
    const unsubscribeConnection = riderOrdersSocketClient.subscribeConnection(() => {
      scheduleRiderQueryRefresh(queryClient, [riderHomeKeys.orderRoutes()]);
    });

    const unsubscribeRevoked = riderOrdersSocketClient.subscribeAssignmentRevoked(({ orderId }) => {
      removeOrderFromProcessingCache(queryClient, orderId);
      closeOffer(orderId);
      void stopRiderBackgroundLocation(orderId);
      void queryClient.cancelQueries({ queryKey: riderHomeKeys.orderDetail(orderId) });
      queryClient.removeQueries({ queryKey: riderHomeKeys.orderDetail(orderId) });
      void queryClient.cancelQueries({ queryKey: riderHomeKeys.orderRoute(orderId) });
      queryClient.removeQueries({ queryKey: riderHomeKeys.orderRoute(orderId) });
      const current = notificationNavigationRef.getCurrentRoute();
      if (['ProcessingOrderDetail', 'OrderChat'].includes(current?.name ?? '') &&
          (current?.params as { orderId?: string } | undefined)?.orderId === orderId) {
        notificationNavigationRef.navigate('Home');
      }
      scheduleRiderOrderRefresh(queryClient, { tabs: ['processing'], summary: true });
    });
    const unsubscribeIssues = riderOrdersSocketClient.subscribeDeliveryIssue((event) => {
      scheduleRiderQueryRefresh(queryClient, [event.orderId ? riderHomeKeys.deliveryProblem(userId ?? '', event.orderId) : ['riderHome', 'deliveryProblem', userId ?? '']]);
    });

    const unsubscribeChat = riderOrdersSocketClient.subscribeChatMessage(() => {
      scheduleRiderQueryRefresh(queryClient, [supportChatKeys.unread()]);
    });
    const unsubscribeChatRead = riderOrdersSocketClient.subscribeOrderChatRead(() => {
      scheduleRiderQueryRefresh(queryClient, [supportChatKeys.unread()]);
    });
    const unsubscribeNotifications = riderOrdersSocketClient.subscribeNotificationCreated(() => {
      scheduleRiderQueryRefresh(queryClient, [['rider-notifications'], ['rider-notification-count']]);
    });

    return () => {
      unsubscribeOrderStatus();
      unsubscribeRiderStatus();
      unsubscribeRiderOrderAvailable();
      unsubscribeChat();
      unsubscribeChatRead();
      unsubscribeNotifications();
      unsubscribeRevoked();
      unsubscribeIssues();
      unsubscribeOrderRoute();
      unsubscribeConnection();
    };
  }, [closeOffer, isAuthenticated, queryClient, receiveAssignment, receiveOffer, token, userId]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return undefined;
    }

    let appState = AppState.currentState;
    const appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const wasActive = appState === 'active';
      appState = nextState;

      if (!wasActive && nextState === 'active') {
        riderOrdersSocketClient.connect();
        scheduleRiderQueryRefresh(queryClient, [riderHomeKeys.all, supportChatKeys.all,
          ['rider-notifications'], ['rider-notification-count']]);
      }
    });

    let previouslyReachable: boolean | null = null;
    const netInfoSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected == null) return;
      const isReachable = Boolean(state.isConnected && state.isInternetReachable !== false);
      const reconnected = previouslyReachable === false && isReachable;
      previouslyReachable = isReachable;
      if (!reconnected || appState !== 'active') return;
      riderOrdersSocketClient.connect();
      scheduleRiderQueryRefresh(queryClient, [riderHomeKeys.all, supportChatKeys.all,
        ['rider-notifications'], ['rider-notification-count']]);
    });

    return () => {
      appStateSubscription.remove();
      netInfoSubscription();
    };
  }, [isAuthenticated, queryClient, token]);
}
