import type { QueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderHomeKeys } from '../api/queryKeys';
import { riderOrderDetailService } from '../api/riderOrderDetailService';
import type { RiderOrderDetail } from '../api/riderOrderDetailTypes';
import type { UpdateRiderOrderStatusPayload, UpdateRiderOrderStatusResponse } from '../api/riderHomeTypes';

export function isEndedRiderOrder(status: string | null | undefined) {
  return ['delivered', 'cancelled', 'rejected', 'failed'].includes(status ?? '');
}

export async function updateAndReconcileRiderStatus(
  client: QueryClient, orderId: string, payload: UpdateRiderOrderStatusPayload,
): Promise<UpdateRiderOrderStatusResponse> {
  try {
    return await riderOrderDetailService.updateOrderStatus(orderId, payload);
  } catch (cause) {
    const error = cause as ApiError;
    const key = riderHomeKeys.orderDetail(orderId);
    const confirmsUpdate = (detail?: RiderOrderDetail) => detail?.status === payload.status
      || (!isEndedRiderOrder(detail?.status) && detail?.riderStatus === payload.status);
    let confirmed = client.getQueryData<RiderOrderDetail>(key);
    // A socket snapshot can confirm a committed transition whose HTTP response was lost.
    if (!confirmsUpdate(confirmed) && (error.status === 0 || error.status === 408 || error.status >= 500
      || (error.status === 400 && /invalid status transition/i.test(error.message)))) {
      try {
        const detail = await riderOrderDetailService.getOrderDetail(orderId);
        client.setQueryData<RiderOrderDetail>(key, (current) =>
          isEndedRiderOrder(current?.status) && !isEndedRiderOrder(detail.status) ? current : detail);
        confirmed = client.getQueryData<RiderOrderDetail>(key);
      } catch {
        // Preserve the original failure. Never repeat a financial/status mutation automatically.
      }
    }
    if (!confirmsUpdate(confirmed)) throw cause;
    return { orderId, status: confirmed?.status ?? undefined,
      riderStatus: confirmed?.riderStatus ?? undefined,
      riderStatusLabel: confirmed?.riderStatusLabel ?? undefined };
  }
}
