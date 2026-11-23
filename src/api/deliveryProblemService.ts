import apiClient from './apiClient';
export const deliveryProblemReasons = ['customer_unreachable', 'address_access', 'vehicle', 'safety', 'other'] as const;
export type DeliveryProblemReason = typeof deliveryProblemReasons[number];
export type DeliveryProblem = { ticketId: string; unreadCount?: number; chatBoxId?: string; reason?: string; orderId: string; status: string; description: string | null; createdAt: string };
export type DeliveryProblemResponse = { report: DeliveryProblem | null };
const path = (orderId: string) => `/apps/deliveries/rider/home/orders/${orderId}/delivery-problem`;
export const deliveryProblemService = {
  get: (orderId: string) => apiClient.get<DeliveryProblemResponse>(path(orderId)),
  submit: (orderId: string, body: { reason: DeliveryProblemReason; details: string }) => apiClient.post<DeliveryProblemResponse>(path(orderId), body),
};
