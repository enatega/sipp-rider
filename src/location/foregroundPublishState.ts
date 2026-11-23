// Foreground tracking (socket, only while the order screen is mounted) and the background task
// (REST, runs whenever the OS delivers a fix) can both report the same movement. This lets the
// task stay quiet only while the foreground publisher is demonstrably doing the job.
const FOREGROUND_PUBLISH_FRESH_MS = 15_000;

let lastForegroundPublishAt = 0;

export function markForegroundLocationPublished(now: number = Date.now()) {
  lastForegroundPublishAt = now;
}

export function wasForegroundLocationPublishedRecently(now: number = Date.now()) {
  return now - lastForegroundPublishAt < FOREGROUND_PUBLISH_FRESH_MS;
}

// Both publishers share one ordering: a fix is sent only if it was taken after the newest fix
// already sent by either path. This stops a cached last-known position, a fix held during a
// socket reconnect, or a slow overlapping task run from moving the customer's pin backwards.
let newestSentFixAt = 0;

/** Reserves `fixTimestamp` for sending; false when an equal or newer fix already went out. */
export function claimLocationFix(fixTimestamp: number) {
  if (!Number.isFinite(fixTimestamp) || fixTimestamp <= newestSentFixAt) return false;
  newestSentFixAt = fixTimestamp;
  return true;
}
