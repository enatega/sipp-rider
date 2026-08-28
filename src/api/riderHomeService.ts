import apiClient from './apiClient';
import {
  AssignOrderResponse,
  RiderHomeSummary,
  RiderHomeOrder,
  RiderHomeSummaryEnvelope,
  RiderOrdersEnvelope,
  RiderOrdersQueryParams,
} from './riderHomeTypes';

const RIDER_HOME_BASE = '/apps/deliveries/rider/home';

function normalizeSummaryResponse(
  payload: RiderHomeSummary | RiderHomeSummaryEnvelope | null | undefined,
): RiderHomeSummary {
  const summary = (payload as RiderHomeSummaryEnvelope)?.data ?? payload;

  return {
    newOrders: Number((summary as RiderHomeSummary | undefined)?.newOrders ?? 0),
    processingOrders: Number((summary as RiderHomeSummary | undefined)?.processingOrders ?? 0),
    deliveredOrders: Number((summary as RiderHomeSummary | undefined)?.deliveredOrders ?? 0),
  };
}

function normalizeOrdersResponse(
  payload: RiderOrdersEnvelope | unknown,
): { items: RiderHomeOrder[]; isEnd: boolean; nextOffset: number | null } {
  if (Array.isArray(payload)) {
    return { items: payload, isEnd: payload.length === 0, nextOffset: null };
  }

  const root = (payload as RiderOrdersEnvelope | null | undefined) ?? {};
  const level1 = (root.data as RiderOrdersEnvelope | undefined) ?? root;
  const level2 = (level1.data as RiderOrdersEnvelope | undefined) ?? level1;

  const items = Array.isArray(level2.items)
    ? (level2.items as RiderHomeOrder[])
    : Array.isArray(level1.items)
      ? (level1.items as RiderHomeOrder[])
      : Array.isArray(root.items)
        ? (root.items as RiderHomeOrder[])
        : [];

  const isEnd =
    typeof level2.isEnd === 'boolean'
      ? level2.isEnd
      : typeof level1.isEnd === 'boolean'
        ? level1.isEnd
        : typeof root.isEnd === 'boolean'
          ? root.isEnd
          : false;

  const nextOffsetValue =
    level2.nextOffset ?? level1.nextOffset ?? root.nextOffset ?? null;
  const nextOffset =
    typeof nextOffsetValue === 'number' || nextOffsetValue === null ? nextOffsetValue : null;

  return { items, isEnd, nextOffset };
}

export const riderHomeService = {
  getSummary: async () => {
    const response = await apiClient.get<RiderHomeSummary | RiderHomeSummaryEnvelope>(
      `${RIDER_HOME_BASE}/summary`,
    );
    return normalizeSummaryResponse(response);
  },

  getNewOrders: async (params: RiderOrdersQueryParams) => {
    const response = await apiClient.get<RiderOrdersEnvelope | unknown>(
      `${RIDER_HOME_BASE}/orders/new`,
      params,
    );
    return normalizeOrdersResponse(response);
  },

  getProcessingOrders: async (params: RiderOrdersQueryParams) => {
    const response = await apiClient.get<RiderOrdersEnvelope | unknown>(
      `${RIDER_HOME_BASE}/orders/processing`,
      params,
    );
    return normalizeOrdersResponse(response);
  },

  getDeliveredOrders: async (params: RiderOrdersQueryParams) => {
    const response = await apiClient.get<RiderOrdersEnvelope | unknown>(
      `${RIDER_HOME_BASE}/orders/delivered`,
      params,
    );
    return normalizeOrdersResponse(response);
  },

  assignOrderToCurrentRider: async (orderId: string) => {
    return apiClient.patch<AssignOrderResponse>(
      `${RIDER_HOME_BASE}/orders/${orderId}/assign-me`,
    );
  },

  acceptOrderOffer: async (orderId: string) => {
    return apiClient.patch<AssignOrderResponse>(
      `${RIDER_HOME_BASE}/orders/${orderId}/offers/accept`,
    );
  },

  declineOrderOffer: async (orderId: string) => {
    return apiClient.patch<void>(
      `${RIDER_HOME_BASE}/orders/${orderId}/offers/decline`,
    );
  },
};
