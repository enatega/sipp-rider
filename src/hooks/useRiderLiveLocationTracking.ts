import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from 'react-native-maps';
import { useAuth } from '../auth/AuthProvider';
import { riderOrdersSocketClient } from '../socket/riderOrdersSocket';
import {
  startRiderBackgroundLocation,
  stopRiderBackgroundLocation,
} from '../location/riderBackgroundLocationTask';
import { markForegroundLocationPublished } from '../location/foregroundPublishState';

type Options = {
  customerUserId?: string | null;
  enabled: boolean;
  orderId: string;
  stopWhenDisabled: boolean;
  permissionRevision?: number;
};

export type RiderLocation = LatLng & { heading?: number };

// GPS is free: only Google Maps web-service calls cost money, and the server decides those.
// `High` uses the GPS chip; `Balanced` (~100 m, Wi-Fi/cell) left the customer's marker parked.
const MIN_UPDATE_DISTANCE_METERS = 10;
const MIN_UPDATE_INTERVAL_MS = 5_000;

export function useRiderLiveLocationTracking({
  customerUserId,
  enabled,
  orderId,
  stopWhenDisabled,
  permissionRevision,
}: Options) {
  const { session } = useAuth();
  const riderUserId = session.user?.id ?? null;
  const [location, setLocation] = useState<RiderLocation | null>(null);
  const lastPublishedAtRef = useRef(0);
  const newestShownFixAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || !orderId || !session.token) {
      if (stopWhenDisabled || !session.token) {
        void stopRiderBackgroundLocation(session.token ? orderId : undefined).catch((error) => {
          console.warn('[rider][location] unable to stop background tracking', error);
        });
      }
      return;
    }

    void startRiderBackgroundLocation(orderId).catch((error) => {
      // Foreground tracking below remains available if background permission
      // is declined or unavailable in the current build.
      console.warn('[rider][location] background tracking unavailable', error);
    });
  }, [enabled, orderId, permissionRevision, session.token, stopWhenDisabled]);

  useEffect(() => {
    if (!enabled || !customerUserId || !riderUserId || !session.token) {
      return undefined;
    }

    let isCancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    // A fix that arrives inside the publish interval is held, not dropped: otherwise the last
    // move before the rider stops (a red light, the drop-off) may never reach the customer.
    let heldFix: Location.LocationObject | null = null;
    let heldFixTimer: ReturnType<typeof setTimeout> | null = null;

    const send = (fix: Location.LocationObject) => {
      const now = Date.now();
      const { latitude, longitude, heading, speed, accuracy } = fix.coords;
      const didPublish = riderOrdersSocketClient.publishLocation({
        // The server ignores low-accuracy fixes when deciding whether the rider left the route.
        ...(typeof accuracy === 'number' && Number.isFinite(accuracy) ? { accuracy } : {}),
        customerUserId,
        heading: heading ?? undefined,
        latitude,
        longitude,
        orderId,
        riderUserId,
        speed: speed ?? undefined,
        timestamp: fix.timestamp,
      });

      if (didPublish) {
        lastPublishedAtRef.current = now;
        markForegroundLocationPublished(now);
      }
    };

    const sendHeldFix = () => {
      heldFixTimer = null;
      const fix = heldFix;
      heldFix = null;
      if (fix && !isCancelled) send(fix);
    };

    const publish = (nextLocation: Location.LocationObject) => {
      if (isCancelled) return;
      // The cached last-known fix and the first watch fix can resolve in either order, and the
      // OS may replay a cached fix. Never move the rider's own pin back to an older position.
      if (nextLocation.timestamp < newestShownFixAtRef.current) return;
      newestShownFixAtRef.current = nextLocation.timestamp;

      const { latitude, longitude, heading } = nextLocation.coords;
      // The OS reports a negative or NaN heading while it cannot tell which way the device points.
      const validHeading = typeof heading === 'number' && Number.isFinite(heading) && heading >= 0 ? heading : undefined;
      setLocation({ latitude, longitude, heading: validHeading });

      const waitMs = MIN_UPDATE_INTERVAL_MS - (Date.now() - lastPublishedAtRef.current);
      if (waitMs > 0) {
        heldFix = nextLocation;
        heldFixTimer ??= setTimeout(sendHeldFix, waitMs);
        return;
      }

      heldFix = null;
      if (heldFixTimer) {
        clearTimeout(heldFixTimer);
        heldFixTimer = null;
      }
      send(nextLocation);
    };

    const startTracking = async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED || isCancelled) return;

      const lastKnownLocation = await Location.getLastKnownPositionAsync({
        maxAge: 30_000,
        requiredAccuracy: 100,
      });
      if (lastKnownLocation) publish(lastKnownLocation);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: MIN_UPDATE_DISTANCE_METERS,
          timeInterval: MIN_UPDATE_INTERVAL_MS,
        },
        publish,
      );
    };

    void startTracking().catch((error) => {
      console.warn('[rider][location] foreground tracking unavailable', error);
    });

    return () => {
      isCancelled = true;
      if (heldFixTimer) clearTimeout(heldFixTimer);
      subscription?.remove();
    };
  }, [customerUserId, enabled, orderId, permissionRevision, riderUserId, session.token]);

  return location;
}
