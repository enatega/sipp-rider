import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { riderHomeService } from '../api/riderHomeService';
import { RiderHomeOrder, RiderOrderTab } from '../api/riderHomeTypes';
import type { ApiError } from '../api/apiClient';
import { riderHomeKeys } from '../api/queryKeys';

const DEFAULT_LIMIT = 10;

type InfinitePage = {
  items: RiderHomeOrder[];
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export function useRiderHomeSummaryQuery() {
  return useQuery({
    queryKey: riderHomeKeys.summary(),
    queryFn: riderHomeService.getSummary,
    staleTime: 30_000,
  });
}

export function useRiderOrdersInfiniteQuery(tab: RiderOrderTab, search = '') {
  const queryKey = riderHomeKeys.orders(tab, search);

  return useInfiniteQuery<InfinitePage, ApiError>({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = Number(pageParam ?? 0);
      const params = {
        offset,
        limit: DEFAULT_LIMIT,
        search: search.trim() || undefined,
      };

      const items =
        tab === 'new'
          ? await riderHomeService.getNewOrders(params)
          : tab === 'processing'
            ? await riderHomeService.getProcessingOrders(params)
            : await riderHomeService.getDeliveredOrders(params);

      return {
        items: items.items,
        offset,
        limit: DEFAULT_LIMIT,
        hasMore: items.nextOffset !== null || !items.isEnd,
        nextOffset: items.nextOffset,
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.nextOffset !== null
        ? lastPage.nextOffset
        : lastPage.hasMore
          ? lastPage.offset + lastPage.limit
          : undefined,
    staleTime: 15_000,
  });
}
