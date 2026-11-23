/** One server-owned road route per order; `path` points are `[latitude, longitude]`. */
export type OrderRoute = {
  orderId: string;
  version: number;
  path: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  fetchedAt: string;
};

export type OrderRouteResponse = {
  route: OrderRoute | null;
};

export type OrderRouteCoordinate = { latitude: number; longitude: number };
