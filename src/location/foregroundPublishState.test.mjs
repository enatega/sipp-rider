import assert from 'node:assert/strict';
import { claimLocationFix, markForegroundLocationPublished, wasForegroundLocationPublishedRecently } from './foregroundPublishState.ts';

// Nothing published yet: the background task must report.
assert.equal(wasForegroundLocationPublishedRecently(1_000_000), false);

markForegroundLocationPublished(1_000_000);
assert.equal(wasForegroundLocationPublishedRecently(1_005_000), true);
assert.equal(wasForegroundLocationPublishedRecently(1_014_999), true);
// Foreground went quiet (screen closed, socket down): the task takes over again.
assert.equal(wasForegroundLocationPublishedRecently(1_015_000), false);
console.log('foregroundPublishState ok');

// Out-of-order fixes: socket and background task share one ordering.
assert.equal(claimLocationFix(2_000_000), true);
assert.equal(claimLocationFix(2_010_000), true);
// A fix held during a reconnect (older than one already sent) is dropped.
assert.equal(claimLocationFix(2_005_000), false);
// The same fix reported by both publishers goes out once.
assert.equal(claimLocationFix(2_010_000), false);
assert.equal(claimLocationFix(Number.NaN), false);
assert.equal(claimLocationFix(2_015_000), true);
console.log('claimLocationFix ok');
