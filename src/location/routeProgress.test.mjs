import assert from 'node:assert/strict';
import {
  bearingDegrees,
  formatDistanceMeters,
  getRemainingDistanceMeters,
  getRemainingRoute,
  getRouteProgress,
  haversineMeters,
} from './routeProgress.ts';

const at = (latitude, longitude) => ({ latitude, longitude });
// Points roughly 111 m apart going north along one meridian.
const path = [at(33.700, 73.0), at(33.701, 73.0), at(33.702, 73.0), at(33.703, 73.0)];

assert.ok(Math.abs(haversineMeters(path[0], path[1]) - 111.2) < 1);

const close = (a, b) => Math.abs(a.latitude - b.latitude) < 1e-9 && Math.abs(a.longitude - b.longitude) < 1e-9;

// Rider has passed the first two vertices: the line starts on the road under the rider.
const rider = at(33.7015, 73.0);
const remaining = getRemainingRoute(path, rider);
assert.ok(close(remaining[0], rider));
assert.deepEqual(remaining.slice(1), [path[2], path[3]]);

// Just past a vertex (closer to the next one) must not skip that next vertex.
const nearNext = getRemainingRoute(path, at(33.7019, 73.0));
assert.deepEqual(nearNext.slice(1), [path[2], path[3]]);

// Off the road by a few metres snaps the marker onto the right segment.
const offRoad = getRouteProgress(path, at(33.7025, 73.00005));
assert.deepEqual(offRoad.remaining.slice(1), [path[3]]);
assert.ok(close(offRoad.marker, at(33.7025, 73.0)));

// Far off the road the marker stays on the fix and a stub joins it to the route.
const detached = getRouteProgress(path, at(33.7015, 73.001));
assert.deepEqual(detached.marker, at(33.7015, 73.001));
assert.equal(detached.remaining.length, 4);

// Remaining distance follows the route, not the straight line to the destination.
const detour = [at(33.700, 73.000), at(33.700, 73.001), at(33.701, 73.001)];
const along = getRemainingDistanceMeters(detour, detour[0], detour[2]);
assert.ok(along > haversineMeters(detour[0], detour[2]) * 1.2);

// No route yet: straight-line fallback.
assert.ok(Math.abs(getRemainingDistanceMeters(undefined, path[0], path[1]) - 111.2) < 1);
assert.ok(Math.abs(getRemainingDistanceMeters([], path[0], path[1]) - 111.2) < 1);

assert.ok(Math.abs(bearingDegrees(path[0], path[1])) < 0.01);
assert.ok(Math.abs(bearingDegrees(at(0, 0), at(0, 1)) - 90) < 0.01);

assert.equal(formatDistanceMeters(4), '10 m');
assert.equal(formatDistanceMeters(347), '350 m');
assert.equal(formatDistanceMeters(1530), '1.5 km');
assert.equal(formatDistanceMeters(12_400), '12 km');
console.log('routeProgress ok');
