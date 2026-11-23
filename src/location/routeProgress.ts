export type RoutePoint = { latitude: number; longitude: number };

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMeters(a: RoutePoint, b: RoutePoint) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing (0-360) from `from` to `to`. */
export function bearingDegrees(from: RoutePoint, to: RoutePoint) {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export type RouteProgress = {
  /** What is still ahead of the rider, starting where the marker is drawn. */
  remaining: RoutePoint[];
  /** Where to draw the rider: on the road when the fix is close to it, the raw fix otherwise. */
  marker: RoutePoint;
  segmentIndex: number;
  offsetMeters: number;
};

/** A fix within this distance of the route is drawn on the road (GPS drift, building shadows). */
export const SNAP_TO_ROUTE_METERS = 35;

/** Closest point to `point` on the segment a-b and its distance (flat-earth, fine at city scale). */
function projectOntoSegment(point: RoutePoint, a: RoutePoint, b: RoutePoint) {
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_METERS;
  const metersPerDegLng = metersPerDegLat * Math.cos(toRadians(point.latitude));
  const ax = (a.longitude - point.longitude) * metersPerDegLng;
  const ay = (a.latitude - point.latitude) * metersPerDegLat;
  const bx = (b.longitude - point.longitude) * metersPerDegLng;
  const by = (b.latitude - point.latitude) * metersPerDegLat;
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared));
  return {
    point: {
      latitude: a.latitude + t * (b.latitude - a.latitude),
      longitude: a.longitude + t * (b.longitude - a.longitude),
    },
    distanceMeters: Math.hypot(ax + t * dx, ay + t * dy),
  };
}

/**
 * Where `position` is along `path`: the nearest segment, the point on the road under the rider,
 * and the route still ahead starting from that point. Local geometry only, no Maps requests.
 */
export function getRouteProgress(path: RoutePoint[], position: RoutePoint): RouteProgress | null {
  if (path.length < 2) return null;

  let segmentIndex = 0;
  let nearest = projectOntoSegment(position, path[0], path[1]);
  for (let index = 1; index < path.length - 1; index += 1) {
    const candidate = projectOntoSegment(position, path[index], path[index + 1]);
    if (candidate.distanceMeters < nearest.distanceMeters) {
      nearest = candidate;
      segmentIndex = index;
    }
  }

  const ahead = path.slice(segmentIndex + 1);
  const isOnRoute = nearest.distanceMeters <= SNAP_TO_ROUTE_METERS;
  return {
    // Off the road, the stub from the fix to the route stays until the server sends a new route.
    remaining: isOnRoute ? [nearest.point, ...ahead] : [position, nearest.point, ...ahead],
    marker: isOnRoute ? nearest.point : position,
    segmentIndex,
    offsetMeters: nearest.distanceMeters,
  };
}

/** The part of `path` still ahead of `position`, so the line is consumed as the rider moves. */
export function getRemainingRoute(path: RoutePoint[], position: RoutePoint): RoutePoint[] {
  return getRouteProgress(path, position)?.remaining ?? path;
}

export function routeLengthMeters(path: RoutePoint[]) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    total += haversineMeters(path[index - 1], path[index]);
  }
  return total;
}

/** Metres left to the destination: along the road route when known, otherwise as the crow flies. */
export function getRemainingDistanceMeters(
  path: RoutePoint[] | undefined,
  position: RoutePoint,
  destination: RoutePoint,
) {
  if (path && path.length >= 2) return routeLengthMeters(getRemainingRoute(path, position));
  return haversineMeters(position, destination);
}

export function formatDistanceMeters(meters: number) {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}
