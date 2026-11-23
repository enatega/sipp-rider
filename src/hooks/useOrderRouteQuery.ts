import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderHomeKeys } from '../api/queryKeys';
import { riderOrderDetailService } from '../api/riderOrderDetailService';
import type { OrderRoute, OrderRouteCoordinate } from '../api/orderRouteTypes';

const MAX_RENDERED_ROUTE_POINTS = 160;

function toRenderedPath(route: OrderRoute | null): OrderRouteCoordinate[] | null {
  if (!route) return null;
  const points = route.path.map(([latitude, longitude]) => ({ latitude, longitude }));
  if (points.length <= MAX_RENDERED_ROUTE_POINTS) return points;

  const lastIndex = points.length - 1;
  return Array.from({ length: MAX_RENDERED_ROUTE_POINTS }, (_, index) =>
    points[Math.round((index / (MAX_RENDERED_ROUTE_POINTS - 1)) * lastIndex)],
  );
}

/**
 * The server owns one route per order and pushes replacements over `order-route-updated`, so this
 * never refetches on its own; it is invalidated on reconnect, foreground and order status changes.
 */
export function useOrderRouteQuery(orderId: string | undefined, enabled = true) {
  return useQuery<OrderRoute | null, ApiError, OrderRouteCoordinate[] | null>({
    queryKey: riderHomeKeys.orderRoute(orderId ?? ''),
    queryFn: () => riderOrderDetailService.getOrderRoute(orderId ?? ''),
    enabled: enabled && Boolean(orderId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
    select: toRenderedPath,
  });
}

/** Applies a pushed route unless the cache already holds the same or a newer version. */
export function applyOrderRouteUpdate(queryClient: QueryClient, route: OrderRoute) {
  queryClient.setQueryData<OrderRoute | null>(riderHomeKeys.orderRoute(route.orderId), (current) =>
    current && current.version >= route.version ? current : route,
  );
}
