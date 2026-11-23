import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { earningsService } from '../api/earningsService';
import type {
  RiderEarningsActivitiesResponse,
  RiderEarningsActivityDeliveriesResponse,
} from '../api/earningsTypes';
import { earningsKeys } from '../api/queryKeys';

export function useRiderEarningsActivitiesQuery(page: number, limit: number, startDate?: string, endDate?: string) {
  return useQuery<RiderEarningsActivitiesResponse, ApiError>({
    queryKey: earningsKeys.activities(page, limit, startDate, endDate),
    queryFn: () => earningsService.getRiderEarningsActivities({ page, limit, startDate, endDate }),
    staleTime: 30_000,
  });
}

export function useRiderEarningsActivityPages(limit: number, startDate?: string, endDate?: string) {
  return useInfiniteQuery<RiderEarningsActivitiesResponse, ApiError>({
    queryKey: [...earningsKeys.all, 'activityPages', limit, startDate, endDate],
    queryFn: ({ pageParam }) => earningsService.getRiderEarningsActivities({
      page: Number(pageParam), limit, startDate, endDate,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasNextPage ? lastPage.page + 1 : undefined,
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
