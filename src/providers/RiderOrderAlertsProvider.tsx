import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { riderHomeKeys } from '../api/queryKeys';
import type { RiderOrderAvailablePayload } from '../socket/riderOrdersSocket';
import { alertForNewRiderOrder, stopRiderOrderAlerts } from '../sound/orderAlertCoordinator';
import { queueOfferNotificationNavigation, queueOrderNotificationNavigation } from '../navigation/notificationNavigation';

export type RiderOrderAlert =
  | ({ kind: 'offer'; expiresAt: number } & Omit<RiderOrderAvailablePayload, 'expiresAt'>)
  | {
      kind: 'assignment';
      orderId: string;
      orderCode: string;
      storeName: string | null;
    };

type AssignmentInput = {
  orderId: string;
  orderCode?: string | null;
  storeName?: string | null;
  occurredAt?: string;
};

type RiderOrderAlertsContextValue = {
  alerts: RiderOrderAlert[];
  receiveOffer: (offer: RiderOrderAvailablePayload) => void;
  receiveAssignment: (assignment: AssignmentInput) => void;
  closeOffer: (orderId: string) => void;
  dismissAssignment: (orderId: string) => void;
  clearAlerts: () => void;
};

const RiderOrderAlertsContext = createContext<RiderOrderAlertsContextValue | null>(null);

function notificationDataToOffer(
  data: Record<string, unknown>,
): RiderOrderAvailablePayload | null {
  const orderId = typeof data.orderId === 'string' ? data.orderId : '';
  if (!orderId) return null;

  return {
    orderId,
    orderCode:
      typeof data.orderCode === 'string' && data.orderCode
        ? data.orderCode
        : orderId.split('-')[0].toUpperCase(),
    storeId: typeof data.storeId === 'string' ? data.storeId : '',
    storeName: typeof data.storeName === 'string' ? data.storeName : 'Store',
    pickupAddress:
      typeof data.pickupAddress === 'string' && data.pickupAddress
        ? data.pickupAddress
        : null,
    orderAmount: Number(data.orderAmount || 0),
    zoneId: typeof data.zoneId === 'string' ? data.zoneId : '',
    status: 'accepted',
    updatedAt: typeof data.sentAt === 'string' ? data.sentAt : '',
    sentAt: typeof data.sentAt === 'string' ? data.sentAt : '',
    expiresAt:
      typeof data.expiresAt === 'string'
        ? data.expiresAt
        : new Date(Date.now() + 60_000).toISOString(),
  };
}

export function RiderOrderAlertsProvider({ children }: React.PropsWithChildren) {
  const queryClient = useQueryClient();
  const { isAuthenticated, session } = useAuth();
  const [alerts, setAlerts] = useState<RiderOrderAlert[]>([]);
  const closedOfferIds = useRef(new Set<string>());
  const userId = session.user?.id ?? null;

  const invalidateOrders = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() });
    void queryClient.invalidateQueries({ queryKey: riderHomeKeys.ordersAll() });
  }, [queryClient]);

  const receiveOffer = useCallback((offer: RiderOrderAvailablePayload) => {
    const expiresAt = new Date(offer.expiresAt).getTime();
    if (
      offer.status !== 'accepted' ||
      closedOfferIds.current.has(offer.orderId) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return;
    }

    if (userId) void alertForNewRiderOrder({
      userId,
      orderId: offer.orderId,
      occurredAt: offer.sentAt || offer.updatedAt,
      expiresAt: offer.expiresAt,
    });

    setAlerts((current) => {
      if (current.some((alert) => alert.kind === 'offer' && alert.orderId === offer.orderId)) {
        return current;
      }
      return [...current, { ...offer, kind: 'offer', expiresAt }];
    });
    invalidateOrders();
  }, [invalidateOrders, userId]);

  const closeOffer = useCallback((orderId: string) => {
    closedOfferIds.current.add(orderId);
    setAlerts((current) =>
      current.filter((alert) => alert.kind !== 'offer' || alert.orderId !== orderId),
    );
  }, []);

  const receiveAssignment = useCallback((assignment: AssignmentInput) => {
    if (userId && assignment.occurredAt) void alertForNewRiderOrder({
      userId,
      orderId: assignment.orderId,
      occurredAt: assignment.occurredAt,
      kind: 'assignment',
    });
    closedOfferIds.current.add(assignment.orderId);
    setAlerts((current) => {
      const withoutOffer = current.filter(
        (alert) => alert.kind !== 'offer' || alert.orderId !== assignment.orderId,
      );
      const existingIndex = withoutOffer.findIndex(
        (alert) => alert.kind === 'assignment' && alert.orderId === assignment.orderId,
      );
      const nextAssignment: RiderOrderAlert = {
        kind: 'assignment',
        orderId: assignment.orderId,
        orderCode:
          assignment.orderCode || assignment.orderId.split('-')[0].toUpperCase(),
        storeName: assignment.storeName ?? null,
      };

      if (existingIndex < 0) return [...withoutOffer, nextAssignment];
      const next = [...withoutOffer];
      next[existingIndex] = nextAssignment;
      return next;
    });
    invalidateOrders();
  }, [invalidateOrders, userId]);

  const dismissAssignment = useCallback((orderId: string) => {
    setAlerts((current) =>
      current.filter(
        (alert) => alert.kind !== 'assignment' || alert.orderId !== orderId,
      ),
    );
  }, []);

  const clearAlerts = useCallback(() => {
    closedOfferIds.current.clear();
    stopRiderOrderAlerts();
    setAlerts([]);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) clearAlerts();
  }, [clearAlerts, isAuthenticated]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAlerts((current) => {
        let changed = false;
        const next = current.filter((alert) => {
          if (alert.kind !== 'offer' || alert.expiresAt > now) return true;
          closedOfferIds.current.add(alert.orderId);
          changed = true;
          return false;
        });
        return changed ? next : current;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopRiderOrderAlerts();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const refreshNotificationQueries = () => {
      void queryClient.invalidateQueries({ queryKey: ['rider-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['rider-notification-count'] });
    };
    const handleNotification = (notification: Notifications.Notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      refreshNotificationQueries();
      if (!notification.request.content.title?.trim() || !notification.request.content.body?.trim()) return;
      if (data.type === 'zone_order_available') {
        const offer = notificationDataToOffer(data);
        if (offer) receiveOffer(offer);
      } else if (data.type === 'rider_assignment') {
        const orderId = typeof data.orderId === 'string' ? data.orderId : '';
        if (!orderId) return;
        if (data.assignmentType === 'broadcast_claim') {
          closeOffer(orderId);
        } else {
          receiveAssignment({
            orderId,
            orderCode: typeof data.orderCode === 'string' ? data.orderCode : null,
            storeName: typeof data.storeName === 'string' ? data.storeName : null,
            occurredAt: typeof data.sentAt === 'string' ? data.sentAt : '',
          });
        }
      }
    };

    const received = Notifications.addNotificationReceivedListener(handleNotification);
    const opened = Notifications.addNotificationResponseReceivedListener((response) => {
      refreshNotificationQueries();
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data.type === 'zone_order_available') {
        if (typeof data.orderId === 'string') closeOffer(data.orderId);
        queueOfferNotificationNavigation(data.orderId, data.orderCode);
      } else if (data.assignmentType !== 'broadcast_claim') {
        if (typeof data.orderId === 'string') dismissAssignment(data.orderId);
        queueOrderNotificationNavigation(data.orderId);
      }
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      refreshNotificationQueries();
      const data = response.notification.request.content.data as Record<string, unknown>;
      if (data.type === 'zone_order_available') {
        if (typeof data.orderId === 'string') closeOffer(data.orderId);
        queueOfferNotificationNavigation(data.orderId, data.orderCode);
      } else if (data.assignmentType !== 'broadcast_claim') {
        if (typeof data.orderId === 'string') dismissAssignment(data.orderId);
        queueOrderNotificationNavigation(data.orderId);
      }
      void Notifications.clearLastNotificationResponseAsync();
    }).catch(() => undefined);

    return () => {
      received.remove();
      opened.remove();
    };
  }, [closeOffer, dismissAssignment, queryClient, receiveAssignment, receiveOffer]);

  const value = useMemo<RiderOrderAlertsContextValue>(
    () => ({
      alerts,
      receiveOffer,
      receiveAssignment,
      closeOffer,
      dismissAssignment,
      clearAlerts,
    }),
    [alerts, clearAlerts, closeOffer, dismissAssignment, receiveAssignment, receiveOffer],
  );

  return (
    <RiderOrderAlertsContext.Provider value={value}>
      {children}
    </RiderOrderAlertsContext.Provider>
  );
}

export function useRiderOrderAlerts() {
  const context = useContext(RiderOrderAlertsContext);
  if (!context) {
    throw new Error('useRiderOrderAlerts must be used within RiderOrderAlertsProvider');
  }
  return context;
}
