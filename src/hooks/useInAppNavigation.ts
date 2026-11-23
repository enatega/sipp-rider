import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type MapView from 'react-native-maps';
import { bearingDegrees, haversineMeters } from '../location/routeProgress';
import type { RiderLocation } from './useRiderLiveLocationTracking';

const NAV_ZOOM = 17;
const NAV_PITCH = 35;
const CAMERA_ANIMATION_MS = 700;
const EXIT_ANIMATION_MS = 300;
// Below this the GPS jitter is larger than the movement, so a derived bearing would just spin the map.
const MIN_BEARING_MOVE_METERS = 8;

type Options = {
  mapRef: RefObject<MapView | null>;
  position: RiderLocation | null;
  /** Navigation only makes sense while the order is being delivered and a position is known. */
  available: boolean;
};

/** In-app map navigation: a camera that follows the rider, with an explicit way to leave and re-join. */
export function useInAppNavigation({ mapRef, position, available }: Options) {
  const [active, setActive] = useState(false);
  const [following, setFollowing] = useState(true);
  const previousPositionRef = useRef<RiderLocation | null>(null);
  const lastHeadingRef = useRef(0);
  const isNavigating = active && available;

  useEffect(() => {
    if (!isNavigating || !following || !position) return;

    let heading = position.heading;
    const previous = previousPositionRef.current;
    if (heading === undefined && previous && haversineMeters(previous, position) >= MIN_BEARING_MOVE_METERS) {
      heading = bearingDegrees(previous, position);
    }
    if (heading !== undefined) lastHeadingRef.current = heading;
    previousPositionRef.current = position;

    mapRef.current?.animateCamera(
      { center: position, heading: lastHeadingRef.current, pitch: NAV_PITCH, zoom: NAV_ZOOM },
      { duration: CAMERA_ANIMATION_MS },
    );
  }, [following, isNavigating, mapRef, position]);

  const start = useCallback(() => {
    previousPositionRef.current = null;
    setFollowing(true);
    setActive(true);
  }, []);

  const exit = useCallback(() => {
    setActive(false);
    mapRef.current?.animateCamera({ pitch: 0, heading: 0 }, { duration: EXIT_ANIMATION_MS });
  }, [mapRef]);

  const recenter = useCallback(() => setFollowing(true), []);
  // A drag means the rider wants to look around; stop fighting their hand.
  const onMapDrag = useCallback(() => {
    if (isNavigating) setFollowing(false);
  }, [isNavigating]);

  return { isNavigating, isFollowing: following, start, exit, recenter, onMapDrag };
}
