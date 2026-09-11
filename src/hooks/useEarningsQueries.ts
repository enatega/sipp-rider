import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { earningsService } from '../api/earningsService';
import type {
  RiderEarningsActivitiesResponse,
  RiderEarningsActivityDeliveriesResponse,
} from '../api/earningsTypes';
import { earningsKeys } from '../api/queryKeys';

export function useRiderEarningsActivitiesQuery(page: number, limit: number) {
  return useQuery<RiderEarningsActivitiesResponse, ApiError>({
    queryKey: earningsKeys.activities(page, limit),
    queryFn: () => earningsService.getRiderEarningsActivities({ page, limit }),
    staleTime: 30_000,
  });
}

export function useRiderEarningsActivityDeliveriesQuery(activityDate?: string) {
  return useQuery<RiderEarningsActivityDeliveriesResponse, ApiError>({
    queryKey: earningsKeys.activityDeliveries(activityDate ?? ''),
    queryFn: () => earningsService.getRiderEarningsActivityDeliveries(activityDate ?? ''),
    enabled: Boolean(activityDate),
    staleTime: 30_000,
  });
}
