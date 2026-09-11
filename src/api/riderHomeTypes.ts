export type RiderHomeSummary = {
  newOrders: number;
  processingOrders: number;
  deliveredOrders: number;
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
  pickupAddress: string | null;
  deliveryAddress: string | null;
  orderAmount: number | null;
  distanceKm: number | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  customerComment: string | null;
  courierNote: string | null;
  createdAt: string | null;
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

export type AssignOrderResponse = {
  message?: string;
  orderId?: string;
  riderId?: string;
  status?: string;
  orderStatus?: string;
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
};

export type UpdateRiderOrderStatusResponse = {
  message?: string;
  orderId?: string;
  status?: string;
  riderStatus?: string;
  riderStatusLabel?: string;
};
