// On Android the background task now receives a fix every ~10s even while the rider stands still,
// so the customer can tell a stopped rider from a dead phone. Sending every one of them would be
// wasteful: report movement as it happens, and otherwise only a periodic "still here" heartbeat.
export const BACKGROUND_MIN_MOVE_METERS = 15;
export const BACKGROUND_HEARTBEAT_MS = 30_000;

/**
 * @param movedMeters distance from the last sent fix; null when nothing was sent for this order yet
 * @param elapsedMs time since the last sent fix, by the fixes' own timestamps
 */
export function shouldSendBackgroundFix(movedMeters: number | null, elapsedMs: number) {
  if (movedMeters === null) return true;
  return movedMeters >= BACKGROUND_MIN_MOVE_METERS || elapsedMs >= BACKGROUND_HEARTBEAT_MS;
}
