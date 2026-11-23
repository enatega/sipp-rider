import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderHomeKeys } from '../api/queryKeys';
import { riderOrderDetailService } from '../api/riderOrderDetailService';
import { RiderOrderDetail } from '../api/riderOrderDetailTypes';

export function useRiderOrderDetailQuery(
  orderId?: string,
  isEnabled = true,
) {
  return useQuery<RiderOrderDetail, ApiError>({
    queryKey: riderHomeKeys.orderDetail(orderId ?? ''),
    queryFn: () => riderOrderDetailService.getOrderDetail(orderId ?? ''),
    enabled: Boolean(orderId) && isEnabled,
    staleTime: 15_000,
  });
}
