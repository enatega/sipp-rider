import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { deliveryProblemService, DeliveryProblemReason } from '../api/deliveryProblemService';
import { riderHomeKeys } from '../api/queryKeys';
export function useDeliveryProblem(orderId: string, enabled = true) {
  const { session } = useAuth();
  const client = useQueryClient();
  const queryKey = riderHomeKeys.deliveryProblem(session.user?.id ?? '', orderId);
  const query = useQuery({ queryKey, queryFn: () => deliveryProblemService.get(orderId), retry: false, staleTime: 0, enabled: enabled && Boolean(session.user?.id) });
  const mutation = useMutation({ mutationFn: (body: { reason: DeliveryProblemReason; details: string }) => deliveryProblemService.submit(orderId, body),
    retry: false, onSuccess: (data) => client.setQueryData(queryKey, data) });
  const visited = useRef(false);
  useFocusEffect(useCallback(() => {
    if (!visited.current) { visited.current = true; return; }
    if (enabled) void client.invalidateQueries({ queryKey, refetchType: 'active' });
  }, [enabled, orderId, session.user?.id, client]));
  return { query, mutation };
}
