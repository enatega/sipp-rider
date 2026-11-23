import type { RiderDeliveryUnlock } from '../api/riderOrderDetailTypes';
import { haversineMeters, type RoutePoint } from '../location/routeProgress';
import { useAssignmentCancelCountdown } from './useAssignmentCancelCountdown';

/**
 * Whether the rider may mark the order arrived or delivered. The server unlocks it once the rider is
 * within `radiusMeters` of the drop-off or the store-to-customer travel time has passed since
 * pickup, whichever comes first. Both are re-checked here against the live GPS fix and a
 * countdown so the button enables without waiting for a refetch.
 */
export function useDeliveryUnlock(
  unlock: RiderDeliveryUnlock | null | undefined,
  receivedAt: number,
  riderLocation: RoutePoint | null,
  dropoff: RoutePoint | null,
) {
  const remainingMs = unlock && !unlock.isUnlocked && unlock.secondsUntilUnlock !== null
    ? unlock.secondsUntilUnlock * 1000
    : null;
  const secondsUntilUnlock = useAssignmentCancelCountdown(remainingMs, receivedAt);

  if (!unlock) return { isUnlocked: true, secondsUntilUnlock: 0, distanceMeters: null, radiusMeters: 0 };

  const distanceMeters = riderLocation && dropoff
    ? Math.round(haversineMeters(riderLocation, dropoff))
    : unlock.distanceToDropoffMeters;
  const isNear = distanceMeters !== null && distanceMeters <= unlock.radiusMeters;
  const hasTimer = remainingMs !== null;

  return {
    isUnlocked: unlock.isUnlocked || isNear || (hasTimer && secondsUntilUnlock === 0),
    secondsUntilUnlock,
    distanceMeters,
    radiusMeters: unlock.radiusMeters,
  };
}
