import type { AddressDetails } from '../api/addressDetailsTypes';
export type RiderHomeSummary = {
  newOrders: number;
  processingOrders: number;
  deliveredOrders: number;
};

export type RiderOrderEta = {
  phase: 'pre_pickup' | 'post_pickup' | 'arrived' | 'unavailable';
  estimatedMinutes: number | null;
  remainingSeconds: number | null;
  distanceKm: number | null;
  source: string;
  calculatedAt: string;
};

export type RiderHomeOrder = {
  orderId: string | null;
  orderCode: string | null;
  status: string | null;
  statusLabel: string | null;
  riderStatus: string | null;
  riderStatusLabel: string | null;
  storeName: string | null;
  storeImage: string | null;
  customerName: string | null;
  customerImage: string | null;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  deliveryAddressDetails?: AddressDetails | null;
  deliveryAddressIsHistoricalFallback?: boolean;
  deliveryAddressExtras?: string | null;
  orderAmount: number | null;
  distanceKm: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  customerComment: string | null;
  courierNote: string | null;
  /** Null for orders placed before the drop-off preference was stored. */
  leaveAtDoor?: boolean | null;
  eta?: RiderOrderEta | null;
  createdAt: string | null;
  /** IANA zone of the store (e.g. "America/Costa_Rica"); order times are shown in it. */
  storeTimezone?: string | null;
  canAssignMe: boolean | null;
};

export type RiderOrdersQueryParams = {
  offset?: number;
  limit?: number;
  search?: string;
};

export type RiderOrdersListResponse = RiderHomeOrder[];

export type RiderHomeSummaryEnvelope = {
  data?: RiderHomeSummary;
};

export type RiderOrdersEnvelope = {
  data?: {
    items?: RiderHomeOrder[];
    isEnd?: boolean;
    nextOffset?: number | null;
  };
  items?: RiderHomeOrder[];
  isEnd?: boolean;
  nextOffset?: number | null;
};

export type RiderOrderTab = 'new' | 'processing' | 'delivered';

export type CancelAssignmentResponse = {
  message?: string;
  orderId?: string;
};

export type AssignOrderResponse = {
  message?: string;
  orderId?: string;
  riderId?: string;
  status?: string;
  orderStatus?: string;
};

export type ActiveOrderAssignmentConflict = {
  code: 'RIDER_HAS_ACTIVE_ORDER';
  message: string;
  activeOrderId: string;
  activeOrderCode: string;
};

export type RiderOrderUpdatableStatus =
  | 'heading_to_store'
  | 'arrived_at_store'
  | 'waiting_for_order'
  | 'picked_up'
  | 'out_for_delivery'
  | 'arrived'
  | 'delivered'
  | 'failed';

export type UpdateRiderOrderStatusPayload = {
  status: RiderOrderUpdatableStatus;
  /** The rider's current position, sent with `delivered` so the server can check the drop-off. */
  latitude?: number;
  longitude?: number;
};

export type UpdateRiderOrderStatusResponse = {
  message?: string;
  orderId?: string;
  status?: string;
  riderStatus?: string;
  riderStatusLabel?: string;
};
