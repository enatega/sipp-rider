import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState } from 'react-native';
import { riderHomeService } from '../api/riderHomeService';
import { ApiError } from '../api/apiClient';

export const RIDER_LIVE_LOCATION_TASK = 'sip-rider-live-order-location';
const ACTIVE_ORDER_STORAGE_KEY = 'sip-rider-active-tracking-order';

type BackgroundLocationTaskData = {
  locations?: Location.LocationObject[];
};

if (!TaskManager.isTaskDefined(RIDER_LIVE_LOCATION_TASK)) {
  TaskManager.defineTask<BackgroundLocationTaskData>(
    RIDER_LIVE_LOCATION_TASK,
    async ({ data, error }) => {
      if (
        error
        || !data?.locations?.length
        || AppState.currentState === 'active'
      ) return;

      const orderId = await AsyncStorage.getItem(ACTIVE_ORDER_STORAGE_KEY);
      if (!orderId) return;

      const location = data.locations[data.locations.length - 1];
      const { latitude, longitude, heading, speed } = location.coords;

      try {
        await riderHomeService.updateLiveLocation(orderId, {
          heading: heading ?? undefined,
          latitude,
          longitude,
          speed: speed ?? undefined,
          timestamp: location.timestamp,
        });
      } catch (taskError) {
        if (
          taskError instanceof ApiError
          && [400, 401, 403, 404].includes(taskError.status)
        ) {
          await stopRiderBackgroundLocation();
          return;
        }

        // Background execution must finish cleanly. The next OS location event
        // retries naturally, while expired sessions are handled on foreground.
        console.warn('[rider][location] background update failed', taskError);
      }
    },
  );
}

export async function startRiderBackgroundLocation(orderId: string) {
  const isAvailable = await TaskManager.isAvailableAsync();
  if (!isAvailable) return false;

  const foregroundPermission = await Location.getForegroundPermissionsAsync();
  if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) return false;

  const permission = await Location.getBackgroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) return false;

  await AsyncStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, orderId);

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    RIDER_LIVE_LOCATION_TASK,
  );
  if (isRegistered) return true;

  await Location.startLocationUpdatesAsync(RIDER_LIVE_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    activityType: Location.ActivityType.AutomotiveNavigation,
    deferredUpdatesDistance: 15,
    deferredUpdatesInterval: 5_000,
    distanceInterval: 15,
    foregroundService: {
      killServiceOnDestroy: false,
      notificationBody: 'Sharing your location for the active delivery.',
      notificationColor: '#2196F3',
      notificationTitle: 'Sip delivery in progress',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    timeInterval: 5_000,
  });

  return true;
}

export async function requestRiderDeliveryLocationPermissions() {
  let foregroundPermission = await Location.getForegroundPermissionsAsync();
  if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) {
    if (foregroundPermission.canAskAgain) {
      foregroundPermission = await Location.requestForegroundPermissionsAsync();
    }
  }
  if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) {
    return { granted: false as const, canAskAgain: foregroundPermission.canAskAgain, level: 'foreground' as const };
  }

  let backgroundPermission = await Location.getBackgroundPermissionsAsync();
  if (backgroundPermission.status === Location.PermissionStatus.GRANTED) return { granted: true as const };

  if (backgroundPermission.canAskAgain) {
    backgroundPermission = await Location.requestBackgroundPermissionsAsync();
  }
  return backgroundPermission.status === Location.PermissionStatus.GRANTED
    ? { granted: true as const }
    : { granted: false as const, canAskAgain: backgroundPermission.canAskAgain, level: 'background' as const };
}

export async function getRiderDeliveryLocationPermissionStatus() {
  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    return { granted: false as const, canAskAgain: foreground.canAskAgain, level: 'foreground' as const };
  }
  const background = await Location.getBackgroundPermissionsAsync();
  return background.status === Location.PermissionStatus.GRANTED
    ? { granted: true as const }
    : { granted: false as const, canAskAgain: background.canAskAgain, level: 'background' as const };
}

export async function stopRiderBackgroundLocation() {
  await AsyncStorage.removeItem(ACTIVE_ORDER_STORAGE_KEY);

  const isAvailable = await TaskManager.isAvailableAsync();
  if (!isAvailable) return;

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    RIDER_LIVE_LOCATION_TASK,
  );
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(RIDER_LIVE_LOCATION_TASK);
  }
}
