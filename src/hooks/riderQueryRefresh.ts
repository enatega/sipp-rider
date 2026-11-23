import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { riderHomeKeys } from '../api/queryKeys';
import type { RiderOrderTab } from '../api/riderHomeTypes';

type Batch = { keys: Map<string, QueryKey>; timer: ReturnType<typeof setTimeout> };
const batches = new WeakMap<QueryClient, Batch>();

/** Socket, push and mutation callbacks often describe the same server change. */
export function scheduleRiderQueryRefresh(client: QueryClient, keys: QueryKey[]) {
  let batch = batches.get(client);
  if (!batch) {
    batch = { keys: new Map(), timer: setTimeout(() => {
      const current = batches.get(client);
      batches.delete(client);
      if (!current) return;
      const requests = [...current.keys.values()];
      const roots = requests.filter(key => !requests.some(other => other.length < key.length
        && other.every((part, index) => part === key[index])));
      for (const key of roots) {
        void client.invalidateQueries({ queryKey: key }, { cancelRefetch: false });
      }
    }, 200) };
    batches.set(client, batch);
  }
  for (const key of keys) batch.keys.set(JSON.stringify(key), key);
}

export function scheduleRiderOrderRefresh(client: QueryClient, options: {
  tabs?: RiderOrderTab[]; orderId?: string; summary?: boolean;
} = {}) {
  const keys: QueryKey[] = options.summary === false ? [] : [riderHomeKeys.summary()];
  if (options.tabs) keys.push(...options.tabs.map(tab => [...riderHomeKeys.ordersAll(), tab]));
  else keys.push(riderHomeKeys.ordersAll());
  // The route changes with the order status (store -> customer before pickup, rider -> customer after).
  if (options.orderId) keys.push(riderHomeKeys.orderDetail(options.orderId), riderHomeKeys.orderRoute(options.orderId));
  scheduleRiderQueryRefresh(client, keys);
}
