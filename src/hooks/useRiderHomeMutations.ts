import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderHomeService } from '../api/riderHomeService';
import {
  AssignOrderResponse,
  RiderHomeOrder,
  UpdateRiderOrderStatusPayload,
  UpdateRiderOrderStatusResponse,
} from '../api/riderHomeTypes';
import { riderHomeKeys } from '../api/queryKeys';
import { riderOrderDetailService } from '../api/riderOrderDetailService';
import type { RiderOrderDetail } from '../api/riderOrderDetailTypes';
import { applyAssignedSummaryCounts, applyDeliveredSummaryCounts, getCachedRiderOrder, moveOrderBetweenRiderTabs, updateCachedRiderOrderStatus } from './riderHomeCache';

export function useAssignOrderMutation() {
  return useClaimOrderMutation(riderHomeService.assignOrderToCurrentRider);
}

function useClaimOrderMutation(mutationFn: (orderId: string) => Promise<AssignOrderResponse>) {
  const queryClient = useQueryClient();

  return useMutation<AssignOrderResponse, ApiError, string, RiderHomeOrder | undefined>({
    mutationFn,
    onMutate: (orderId) => getCachedRiderOrder(queryClient, 'new', orderId),
    onSuccess: (response, orderId, cachedOrder) => {
      const assignedOrderId = response?.orderId ?? orderId;
      if (assignedOrderId) {
        const moved = moveOrderBetweenRiderTabs(queryClient, 'new', 'processing', assignedOrderId, {
          canAssignMe: false,
          riderStatus: 'assigned',
          riderStatusLabel: null,
        }, cachedOrder);
        if (moved) applyAssignedSummaryCounts(queryClient);
      }

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: [...riderHomeKeys.ordersAll(), 'new'] }),
        queryClient.invalidateQueries({ queryKey: [...riderHomeKeys.ordersAll(), 'processing'] }),
      ]);
    },
  });
}

export function useUpdateRiderOrderStatusMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateRiderOrderStatusResponse,
    ApiError,
    UpdateRiderOrderStatusPayload,
    RiderHomeOrder | undefined
  >({
    mutationFn: (payload) => riderOrderDetailService.updateOrderStatus(orderId, payload),
    onMutate: () => getCachedRiderOrder(queryClient, 'processing', orderId),
    onSuccess: (response, payload, cachedOrder) => {
      updateCachedRiderOrderStatus(queryClient, orderId, response.status, response.riderStatus ?? payload.status);
      queryClient.setQueryData<RiderOrderDetail>(riderHomeKeys.orderDetail(orderId), (current) => current ? {
        ...current,
        status: response.status ?? current.status,
        riderStatus: response.riderStatus ?? payload.status,
        riderStatusLabel: response.riderStatusLabel ?? null,
      } : current);
      if (payload.status === 'delivered' || response.status === 'delivered' || response.riderStatus === 'delivered') {
        const moved = moveOrderBetweenRiderTabs(queryClient, 'processing', 'delivered', orderId, {
          status: 'delivered',
          statusLabel: null,
          riderStatus: 'delivered',
          riderStatusLabel: null,
        }, cachedOrder);
        if (moved) applyDeliveredSummaryCounts(queryClient);
      }
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: [...riderHomeKeys.ordersAll(), 'processing'] }),
        ...(payload.status === 'delivered' || response.status === 'delivered' || response.riderStatus === 'delivered'
          ? [queryClient.invalidateQueries({ queryKey: [...riderHomeKeys.ordersAll(), 'delivered'] })]
          : []),
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.orderDetail(orderId) }),
      ]);
    },
  });
}
