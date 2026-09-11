import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { riderHomeKeys } from '../api/queryKeys';
import type { RiderHomeOrder, RiderHomeSummary } from '../api/riderHomeTypes';

type RiderOrdersPage = {
  items: RiderHomeOrder[];
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
};

function removeOrderFromPages(
  current: InfiniteData<RiderOrdersPage> | undefined,
  orderId: string,
): InfiniteData<RiderOrdersPage> | undefined {
  if (!current) return current;

  let changed = false;
  const pages = current.pages.map((page) => {
    const items = page.items.filter((item) => item.orderId !== orderId);
    if (items.length !== page.items.length) {
      changed = true;
      return { ...page, items };
    }

    return page;
  });

  return changed ? { ...current, pages } : current;
}

export function removeOrderFromNewOrdersCache(queryClient: QueryClient, orderId: string) {
  const newOrderQueries = queryClient.getQueriesData<InfiniteData<RiderOrdersPage>>({
    queryKey: riderHomeKeys.ordersAll(),
  });

  newOrderQueries.forEach(([queryKey, data]) => {
    const tab = queryKey[2];
    if (tab !== 'new') return;
    const next = removeOrderFromPages(data, orderId);
    if (next !== data) {
      queryClient.setQueryData(queryKey, next);
    }
  });
}

export function applyAssignedSummaryCounts(queryClient: QueryClient) {
  queryClient.setQueryData<RiderHomeSummary>(riderHomeKeys.summary(), (current) => {
    if (!current) return current;

    return {
      ...current,
      newOrders: Math.max(0, (current.newOrders ?? 0) - 1),
      processingOrders: Math.max(0, (current.processingOrders ?? 0) + 1),
    };
  });
}
