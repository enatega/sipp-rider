import { isEndedRiderOrder, updateAndReconcileRiderStatus } from './riderStatusReconciliation';
import { scheduleRiderOrderRefresh } from './riderQueryRefresh';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderHomeService } from '../api/riderHomeService';
import {
  AssignOrderResponse,
  CancelAssignmentResponse,
  RiderHomeOrder,
  UpdateRiderOrderStatusPayload,
  UpdateRiderOrderStatusResponse,
} from '../api/riderHomeTypes';
import { riderHomeKeys } from '../api/queryKeys';
import type { RiderOrderDetail } from '../api/riderOrderDetailTypes';
import { applyAssignedSummaryCounts, applyDeliveredSummaryCounts, getCachedRiderOrder, moveOrderBetweenRiderTabs, removeOrderFromProcessingCache, updateCachedRiderOrderStatus } from './riderHomeCache';

export function useAssignOrderMutation() {
  return useClaimOrderMutation(riderHomeService.assignOrderToCurrentRider);
}

function useClaimOrderMutation(mutationFn: (orderId: string) => Promise<AssignOrderResponse>) {
  const queryClient = useQueryClient();

  return useMutation<AssignOrderResponse, ApiError, string, RiderHomeOrder | undefined>({
    // HomeScreen watches this key to switch to the Pickup tab after a successful claim.
    mutationKey: riderHomeKeys.assignMe(),
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

      scheduleRiderOrderRefresh(queryClient, { tabs: ['new', 'processing'] });
    },
  });
}

/** Releases a just-claimed order; the server only allows this inside the short cancel window. */
export function useCancelAssignmentMutation(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation<CancelAssignmentResponse, ApiError>({
    mutationFn: () => riderHomeService.cancelOrderAssignment(orderId),
    retry: false,
    onSuccess: () => {
      removeOrderFromProcessingCache(queryClient, orderId);
      scheduleRiderOrderRefresh(queryClient, { tabs: ['new', 'processing'] });
    },
    // The window may have closed while the request was in flight; resync the countdown.
    onError: () => scheduleRiderOrderRefresh(queryClient, { orderId, tabs: [] }),
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
    mutationFn: (payload) => updateAndReconcileRiderStatus(queryClient, orderId, payload),
    retry: false,
    onMutate: () => getCachedRiderOrder(queryClient, 'processing', orderId),
    onSuccess: (response, payload, cachedOrder) => {
      updateCachedRiderOrderStatus(queryClient, orderId, response.status, response.riderStatus ?? payload.status);
      queryClient.setQueryData<RiderOrderDetail>(riderHomeKeys.orderDetail(orderId), (current) => current ? {
        ...current,
        status: isEndedRiderOrder(current.status) ? current.status : response.status ?? current.status,
        riderStatus: isEndedRiderOrder(current.status) ? current.riderStatus : response.riderStatus ?? payload.status,
        ...(isEndedRiderOrder(response.status) || isEndedRiderOrder(current.status) ? { canUpdateStatus: false, nextAllowedStatuses: [] } : {}),
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
      const delivered = payload.status === 'delivered' || response.status === 'delivered' || response.riderStatus === 'delivered';
      scheduleRiderOrderRefresh(queryClient, {
        tabs: delivered ? ['processing', 'delivered'] : ['processing'],
        orderId,
        summary: delivered,
      });
    },
  });
}
