import apiClient from './apiClient';
import { RiderOrderDetail, RiderOrderDetailEnvelope } from './riderOrderDetailTypes';
import {
  UpdateRiderOrderStatusPayload,
  UpdateRiderOrderStatusResponse,
} from './riderHomeTypes';
import type { OrderRoute, OrderRouteResponse } from './orderRouteTypes';

const RIDER_HOME_BASE = '/apps/deliveries/rider/home';

const EMPTY_ORDER_DETAIL: RiderOrderDetail = {
  orderId: null,
  orderCode: null,
  status: null,
  statusLabel: null,
  riderStatus: null,
  riderStatusLabel: null,
  orderType: null,
  storeId: null,
  storeUserId: null,
  storeName: null,
  storeImage: null,
  pickupAddress: null,
  deliveryAddress: null,
  deliveryAddressDetails: null,
  deliveryAddressExtras: null,
  orderAmount: null,
  distanceKm: null,
  paymentMethod: null,
  paymentStatus: null,
  customerComment: null,
  courierNote: null,
  leaveAtDoor: null,
  customerUserId: null,
  pickupLatitude: null,
  pickupLongitude: null,
  deliveryLatitude: null,
  deliveryLongitude: null,
  customerName: null,
  customerPhone: null,
  customerId: null,
  chatBoxId: null,
  customerRiderChatBoxId: null,
  items: [],
  createdAt: null,
  canAssignMe: null,
  canUpdateStatus: null,
  nextAllowedStatuses: [],
  assignmentCancelRemainingMs: null,
  eta: null,
  deliveryUnlock: null,
};

function normalizeOrderDetail(
  payload: RiderOrderDetail | RiderOrderDetailEnvelope | null | undefined,
): RiderOrderDetail {
  const root = payload ?? {};
  const level1 = (root as RiderOrderDetailEnvelope).data ?? root;
  const level2 = (level1 as RiderOrderDetailEnvelope).data ?? level1;
  const candidate = level2 as Partial<RiderOrderDetail>;

  return {
    ...EMPTY_ORDER_DETAIL,
    ...candidate,
    items: Array.isArray(candidate.items) ? candidate.items : [],
    nextAllowedStatuses: Array.isArray(candidate.nextAllowedStatuses)
      ? candidate.nextAllowedStatuses.filter((status): status is string => typeof status === 'string')
      : [],
  };
}

export const riderOrderDetailService = {
  getOrderDetail: async (orderId: string) => {
    const response = await apiClient.get<RiderOrderDetail | RiderOrderDetailEnvelope>(
      `${RIDER_HOME_BASE}/orders/${orderId}`,
    );

    return normalizeOrderDetail(response);
  },

  getOrderRoute: async (orderId: string): Promise<OrderRoute | null> => {
    const response = await apiClient.get<OrderRouteResponse | { data?: OrderRouteResponse }>(
      `${RIDER_HOME_BASE}/orders/${orderId}/route`,
    );
    const body = (response as { data?: OrderRouteResponse }).data ?? (response as OrderRouteResponse);
    const route = body?.route;
    return route && Array.isArray(route.path) ? route : null;
  },

  updateOrderStatus: async (orderId: string, payload: UpdateRiderOrderStatusPayload) => {
    return apiClient.patch<UpdateRiderOrderStatusResponse>(
      `${RIDER_HOME_BASE}/orders/${orderId}/status`,
      payload,
    );
  },
};
