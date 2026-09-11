import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderHomeService } from '../api/riderHomeService';
import {
  AssignOrderResponse,
  UpdateRiderOrderStatusPayload,
  UpdateRiderOrderStatusResponse,
} from '../api/riderHomeTypes';
import { riderHomeKeys } from '../api/queryKeys';
import { riderOrderDetailService } from '../api/riderOrderDetailService';
import { applyAssignedSummaryCounts, removeOrderFromNewOrdersCache } from './riderHomeCache';

export function useAssignOrderMutation() {
  return useClaimOrderMutation(riderHomeService.assignOrderToCurrentRider);
}

export function useAcceptOrderOfferMutation() {
  return useClaimOrderMutation(riderHomeService.acceptOrderOffer);
}

function useClaimOrderMutation(mutationFn: (orderId: string) => Promise<AssignOrderResponse>) {
  const queryClient = useQueryClient();

  return useMutation<AssignOrderResponse, ApiError, string>({
    mutationFn,
    onSuccess: async (response, orderId) => {
      const assignedOrderId = response?.orderId ?? orderId;
      if (assignedOrderId) {
        removeOrderFromNewOrdersCache(queryClient, assignedOrderId);
        applyAssignedSummaryCounts(queryClient);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.ordersAll() }),
      ]);
    },
  });
}

export function useDeclineOrderOfferMutation() {
  return useMutation<void, ApiError, string>({
    mutationFn: riderHomeService.declineOrderOffer,
  });
}

export function useUpdateRiderOrderStatusMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateRiderOrderStatusResponse,
    ApiError,
    UpdateRiderOrderStatusPayload
  >({
    mutationFn: (payload) => riderOrderDetailService.updateOrderStatus(orderId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.ordersAll() }),
        queryClient.invalidateQueries({ queryKey: riderHomeKeys.orderDetail(orderId) }),
      ]);
    },
  });
}
