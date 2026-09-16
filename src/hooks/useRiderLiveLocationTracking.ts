import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from 'react-native-maps';
import { useAuth } from '../auth/AuthProvider';
import { riderOrdersSocketClient } from '../socket/riderOrdersSocket';
import {
  startRiderBackgroundLocation,
  stopRiderBackgroundLocation,
} from '../location/riderBackgroundLocationTask';

type Options = {
  customerUserId?: string | null;
  enabled: boolean;
  orderId: string;
};

const MIN_UPDATE_DISTANCE_METERS = 15;
const MIN_UPDATE_INTERVAL_MS = 5_000;

export function useRiderLiveLocationTracking({
  customerUserId,
  enabled,
  orderId,
}: Options) {
  const { session } = useAuth();
  const riderUserId = session.user?.id ?? null;
  const [location, setLocation] = useState<LatLng | null>(null);
  const lastPublishedAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || !orderId || !session.token) {
      void stopRiderBackgroundLocation().catch((error) => {
        console.warn('[rider][location] unable to stop background tracking', error);
      });
      return;
    }

    void startRiderBackgroundLocation(orderId).catch((error) => {
      // Foreground tracking below remains available if background permission
      // is declined or unavailable in the current build.
      console.warn('[rider][location] background tracking unavailable', error);
    });
  }, [enabled, orderId, session.token]);

  useEffect(() => {
    if (!enabled || !customerUserId || !riderUserId || !session.token) {
      return undefined;
    }

    let isCancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    const publish = (nextLocation: Location.LocationObject) => {
      if (isCancelled) return;

      const { latitude, longitude, heading, speed } = nextLocation.coords;
      setLocation({ latitude, longitude });

      const now = Date.now();
      if (now - lastPublishedAtRef.current < MIN_UPDATE_INTERVAL_MS) return;

      const didPublish = riderOrdersSocketClient.publishLocation({
        customerUserId,
        heading: heading ?? undefined,
        latitude,
        longitude,
        orderId,
        riderUserId,
        speed: speed ?? undefined,
        timestamp: nextLocation.timestamp,
      });

      if (didPublish) {
        lastPublishedAtRef.current = now;
      }
    };

    const startTracking = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED || isCancelled) return;

      const lastKnownLocation = await Location.getLastKnownPositionAsync({
        maxAge: 30_000,
        requiredAccuracy: 100,
      });
      if (lastKnownLocation) publish(lastKnownLocation);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
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
      subscription?.remove();
    };
  }, [customerUserId, enabled, orderId, riderUserId, session.token]);

  return location;
}
