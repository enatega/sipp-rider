import type { AddressDetails } from '../api/addressDetailsTypes';
export type RiderOrderItem = {
  productId: string | null;
  name: string | null;
  image: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  selectedOptions: string | null;
};

export type RiderOrderDetail = {
  orderId: string | null;
  orderCode: string | null;
  status: string | null;
  statusLabel: string | null;
  riderStatus: string | null;
  riderStatusLabel: string | null;
  orderType: string | null;
  storeId: string | null;
  storeUserId: string | null;
  storeName: string | null;
  storeImage: string | null;
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
  customerUserId: string | null;
  pickupLatitude: number | null;
  pickupLongitude: number | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  customerName: string | null;
  customerPhone: string | null;
  customerId: string | null;
  chatBoxId: string | null;
  customerRiderChatBoxId: string | null;
  items: RiderOrderItem[];
  createdAt: string | null;
  canAssignMe: boolean | null;
  canUpdateStatus: boolean | null;
  nextAllowedStatuses: string[];
  /** Time left to cancel a self-assignment, measured by the server at response time. */
  assignmentCancelRemainingMs: number | null;
  eta?: import('./riderHomeTypes').RiderOrderEta | null;
  /** Present once the order is on its way; says when the rider may mark it delivered. */
  deliveryUnlock?: RiderDeliveryUnlock | null;
};

export type RiderDeliveryUnlock = {
  isUnlocked: boolean;
  reason: 'near_dropoff' | 'travel_time_elapsed' | 'unverifiable' | null;
  radiusMeters: number;
  distanceToDropoffMeters: number | null;
  unlocksAt: string | null;
  /** Measured by the server at response time, so device clock skew can't move the unlock. */
  secondsUntilUnlock: number | null;
};

export type RiderOrderDetailEnvelope = {
  data?: RiderOrderDetail | RiderOrderDetailEnvelope;
};
