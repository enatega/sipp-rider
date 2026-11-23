import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { riderHomeService } from '../api/riderHomeService';
import { ApiError } from '../api/apiClient';
import { AppState, Platform } from 'react-native';
import { BACKGROUND_MIN_MOVE_METERS, shouldSendBackgroundFix } from './backgroundSendPolicy';
import { claimLocationFix, wasForegroundLocationPublishedRecently } from './foregroundPublishState';
import { haversineMeters } from './routeProgress';

export const RIDER_LIVE_LOCATION_TASK = 'sip-rider-live-order-location';
const ACTIVE_ORDER_STORAGE_KEY = 'sip-rider-active-tracking-order';
// Persisted, not in memory: a killed app runs each task in a headless runtime that may restart.
const LAST_SENT_FIX_STORAGE_KEY = 'sip-rider-bg-last-sent-fix';
// Bump when the startLocationUpdatesAsync options change, so a task registered by an older build
// is restarted with the new options instead of being reused as-is.
const TRACKING_OPTIONS_VERSION = '4';
const TRACKING_OPTIONS_VERSION_STORAGE_KEY = 'sip-rider-bg-tracking-options-version';

type SentFix = { orderId: string; latitude: number; longitude: number; timestamp: number };

async function readLastSentFix(orderId: string): Promise<SentFix | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_SENT_FIX_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SentFix) : null;
    return parsed?.orderId === orderId ? parsed : null;
  } catch {
    return null;
  }
}

type BackgroundLocationTaskData = {
  locations?: Location.LocationObject[];
};

// Printed in every build: the killed-app path can only be checked on a device, through
// `adb logcat | grep bg-location`. Headless runs log to logcat, not to Metro.
function logBackgroundLocation(message: string, details?: Record<string, unknown>) {
  console.log(`[rider][bg-location] ${message}`, details ?? {});
}

// Seeing this line without the app on screen means Android started a headless runtime to run the
// task. If fixes stop after a kill and this never appears, the task never ran.
logBackgroundLocation('task module loaded', { appState: AppState.currentState });

if (!TaskManager.isTaskDefined(RIDER_LIVE_LOCATION_TASK)) {
  TaskManager.defineTask<BackgroundLocationTaskData>(
    RIDER_LIVE_LOCATION_TASK,
    async ({ data, error }) => {
      logBackgroundLocation('task fired', {
        appState: AppState.currentState,
        fixes: data?.locations?.length ?? 0,
        error: error?.message ?? null,
      });
      if (error) {
        logBackgroundLocation('skipped: OS reported a location error', { error: error.message });
        return;
      }
      if (!data?.locations?.length) {
        logBackgroundLocation('skipped: no fixes in this batch');
        return;
      }
      // The app being open is not enough to stay quiet: the foreground publisher only runs while
      // the order screen is mounted, so on Home or in chat nothing else would reach the customer.
      if (wasForegroundLocationPublishedRecently()) {
        logBackgroundLocation('skipped: order screen sent a fix over the socket in the last 15s');
        return;
      }

      const orderId = await AsyncStorage.getItem(ACTIVE_ORDER_STORAGE_KEY);
      if (!orderId) {
        logBackgroundLocation('skipped: no active order stored');
        return;
      }

      // A deferred batch is not guaranteed to be sorted; report its newest fix. Claiming it before
      // the request means an overlapping, slower task run cannot send an older fix after it.
      const location = data.locations.reduce((newest, candidate) => (
        candidate.timestamp > newest.timestamp ? candidate : newest
      ));
      const { latitude, longitude, heading, speed, accuracy } = location.coords;
      const lastSent = await readLastSentFix(orderId);
      const movedMeters = lastSent ? haversineMeters(lastSent, { latitude, longitude }) : null;
      const sinceLastSentMs = lastSent ? location.timestamp - lastSent.timestamp : null;
      const fixDetails = {
        orderId,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        timestamp: location.timestamp,
        fixAgeMs: Date.now() - location.timestamp,
        movedMeters: movedMeters === null ? null : Math.round(movedMeters),
        sinceLastSentMs,
      };
      if (!shouldSendBackgroundFix(movedMeters, sinceLastSentMs ?? 0)) {
        logBackgroundLocation('skipped: rider has not moved and the heartbeat is not due', fixDetails);
        return;
      }
      if (!claimLocationFix(location.timestamp)) {
        logBackgroundLocation('skipped: an equal or newer fix was already sent', fixDetails);
        return;
      }

      const startedAt = Date.now();
      try {
        const response = await riderHomeService.updateLiveLocation(orderId, {
          ...(typeof accuracy === 'number' && Number.isFinite(accuracy) ? { accuracy } : {}),
          heading: heading ?? undefined,
          latitude,
          longitude,
          speed: speed ?? undefined,
          timestamp: location.timestamp,
        });
        await AsyncStorage.setItem(
          LAST_SENT_FIX_STORAGE_KEY,
          JSON.stringify({ orderId, latitude, longitude, timestamp: location.timestamp } satisfies SentFix),
        ).catch(() => undefined);
        logBackgroundLocation(
          movedMeters !== null && movedMeters < BACKGROUND_MIN_MOVE_METERS ? 'sent (heartbeat)' : 'sent',
          {
            ...fixDetails,
            durationMs: Date.now() - startedAt,
            ignoredByServer: (response as { ignored?: boolean } | undefined)?.ignored === true,
          },
        );
      } catch (taskError) {
        const status = taskError instanceof ApiError ? taskError.status : null;
        if (status !== null && [400, 401, 403, 404].includes(status)) {
          logBackgroundLocation('failed: server rejected the fix, stopping tracking', {
            ...fixDetails,
            status,
            message: (taskError as Error).message,
          });
          await stopRiderBackgroundLocation();
          return;
        }

        // Background execution must finish cleanly. The next OS location event
        // retries naturally, while expired sessions are handled on foreground.
        logBackgroundLocation('failed: will retry with the next fix', {
          ...fixDetails,
          status,
          durationMs: Date.now() - startedAt,
          message: (taskError as Error)?.message ?? String(taskError),
        });
      }
    },
  );
}

export async function startRiderBackgroundLocation(orderId: string) {
  const isAvailable = await TaskManager.isAvailableAsync();
  if (!isAvailable) {
    logBackgroundLocation('not started: background tasks unavailable in this build (Expo Go?)', { orderId });
    return false;
  }

  const foregroundPermission = await Location.getForegroundPermissionsAsync();
  if (foregroundPermission.status !== Location.PermissionStatus.GRANTED) {
    logBackgroundLocation('not started: location permission not granted', { orderId, status: foregroundPermission.status });
    return false;
  }

  const permission = await Location.getBackgroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    // Without "Allow all the time" nothing is reported once the app is backgrounded or killed.
    logBackgroundLocation('not started: "Allow all the time" not granted', { orderId, status: permission.status });
    return false;
  }

  await AsyncStorage.setItem(ACTIVE_ORDER_STORAGE_KEY, orderId);

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    RIDER_LIVE_LOCATION_TASK,
  );
  const registeredOptionsVersion = isRegistered
    ? await AsyncStorage.getItem(TRACKING_OPTIONS_VERSION_STORAGE_KEY).catch(() => null)
    : null;
  if (isRegistered && registeredOptionsVersion === TRACKING_OPTIONS_VERSION) {
    logBackgroundLocation('already running', { orderId });
    return true;
  }
  // Calling start again on a registered task replaces its options.
  logBackgroundLocation(isRegistered ? 'restarting location updates with new options' : 'starting location updates', {
    orderId,
    optionsVersion: TRACKING_OPTIONS_VERSION,
  });

  // Android only reports a backgrounded batch once BOTH deferred thresholds are met, so a 15 m
  // deferred distance meant a stopped rider (traffic, a queue, the door) reported nothing at all.
  // With no distance thresholds the task gets a fix every ~10s and backgroundSendPolicy decides
  // what to send. iOS keeps the distance filter: its updates arrive about once a second otherwise.
  const isAndroid = Platform.OS === 'android';
  // `High` (GPS) for the length of one delivery: `Balanced` is ~100 m Wi-Fi/cell positioning,
  // which barely moves while riding and left the customer's marker parked at the store.
  await Location.startLocationUpdatesAsync(RIDER_LIVE_LOCATION_TASK, {
    accuracy: Location.Accuracy.High,
    activityType: Location.ActivityType.AutomotiveNavigation,
    deferredUpdatesDistance: isAndroid ? 0 : 15,
    deferredUpdatesInterval: 5_000,
    distanceInterval: isAndroid ? 0 : 15,
    foregroundService: {
      killServiceOnDestroy: false,
      notificationBody: 'Sharing your location for the active delivery.',
      notificationColor: '#111111',
      notificationTitle: 'Pohanch delivery in progress',
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    timeInterval: isAndroid ? 10_000 : 5_000,
  });
  await AsyncStorage.setItem(TRACKING_OPTIONS_VERSION_STORAGE_KEY, TRACKING_OPTIONS_VERSION).catch(() => undefined);

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

export async function stopRiderBackgroundLocation(expectedOrderId?: string) {
  if (expectedOrderId && await AsyncStorage.getItem(ACTIVE_ORDER_STORAGE_KEY) !== expectedOrderId) return;
  await AsyncStorage.multiRemove([ACTIVE_ORDER_STORAGE_KEY, LAST_SENT_FIX_STORAGE_KEY]);

  const isAvailable = await TaskManager.isAvailableAsync();
  if (!isAvailable) return;

  const isRegistered = await Location.hasStartedLocationUpdatesAsync(
    RIDER_LIVE_LOCATION_TASK,
  );
  if (isRegistered) {
    logBackgroundLocation('stopping location updates', { expectedOrderId: expectedOrderId ?? null });
    await Location.stopLocationUpdatesAsync(RIDER_LIVE_LOCATION_TASK);
  }
}
