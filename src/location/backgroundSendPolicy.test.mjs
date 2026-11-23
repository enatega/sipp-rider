import assert from 'node:assert/strict';
import { shouldSendBackgroundFix } from './backgroundSendPolicy.ts';

// First fix for an order always goes out.
assert.equal(shouldSendBackgroundFix(null, 0), true);
// Moving: every fix past 15 m is sent straight away.
assert.equal(shouldSendBackgroundFix(15, 2_000), true);
assert.equal(shouldSendBackgroundFix(40, 10_000), true);
// Standing still: Android delivers a fix every ~10s, only the 30s heartbeat is sent.
assert.equal(shouldSendBackgroundFix(3, 10_000), false);
assert.equal(shouldSendBackgroundFix(3, 29_999), false);
assert.equal(shouldSendBackgroundFix(3, 30_000), true);
console.log('backgroundSendPolicy ok');
