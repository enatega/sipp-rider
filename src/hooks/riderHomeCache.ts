import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { riderHomeKeys } from '../api/queryKeys';
import type { RiderHomeOrder, RiderHomeSummary, RiderOrderTab } from '../api/riderHomeTypes';

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

  let removed = false;
  newOrderQueries.forEach(([queryKey, data]) => {
    const tab = queryKey[2];
    if (tab !== 'new') return;
    const next = removeOrderFromPages(data, orderId);
    if (next !== data) {
      queryClient.setQueryData(queryKey, next);
      removed = true;
    }
  });
  return removed;
}

export function getCachedRiderOrder(queryClient: QueryClient, tab: RiderOrderTab, orderId: string) {
  return queryClient.getQueriesData<InfiniteData<RiderOrdersPage>>({
    queryKey: riderHomeKeys.ordersAll(),
  }).filter(([key]) => key[2] === tab)
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.items) ?? [])
    .find((item) => item.orderId === orderId);
}

export function moveOrderBetweenRiderTabs(
  queryClient: QueryClient,
  sourceTab: RiderOrderTab,
  destinationTab: RiderOrderTab,
  orderId: string,
  changes: Partial<RiderHomeOrder>,
  fallbackOrder?: RiderHomeOrder,
) {
  const sourceQueries = queryClient.getQueriesData<InfiniteData<RiderOrdersPage>>({ queryKey: riderHomeKeys.ordersAll() });
  const sourceOrder = getCachedRiderOrder(queryClient, sourceTab, orderId) ?? fallbackOrder;
  if (!sourceOrder) return false;

  sourceQueries.forEach(([key, data]) => {
    if (key[2] !== sourceTab) return;
    const next = removeOrderFromPages(data, orderId);
    if (next !== data) queryClient.setQueryData(key, next);
  });

  const order = { ...sourceOrder, ...changes };
  const destinationKey = riderHomeKeys.orders(destinationTab, '');
  queryClient.setQueryData<InfiniteData<RiderOrdersPage>>(destinationKey, (current) => {
    if (!current) {
      return {
        pageParams: [0],
        pages: [{ items: [order], offset: 0, limit: 10, hasMore: false, nextOffset: null }],
      };
    }
    const pages = current.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.orderId !== orderId) }));
    pages[0] = { ...pages[0], items: [order, ...pages[0].items] };
    return { ...current, pages };
  });
  return true;
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

export function applyDeliveredSummaryCounts(queryClient: QueryClient) {
  queryClient.setQueryData<RiderHomeSummary>(riderHomeKeys.summary(), (current) => {
    if (!current) return current;
    return {
      ...current,
      processingOrders: Math.max(0, (current.processingOrders ?? 0) - 1),
      deliveredOrders: Math.max(0, (current.deliveredOrders ?? 0) + 1),
    };
  });
}
