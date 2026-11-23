import assert from 'node:assert/strict';
import { validateWithdraw } from './withdrawValidation.ts';

assert.equal(validateWithdraw(10, 100, false), null);
assert.equal(validateWithdraw(0, 100, false), 'invalid');
assert.equal(validateWithdraw(101, 100, false), 'insufficient');
assert.equal(validateWithdraw(10, 100, true), 'pending');
assert.equal(validateWithdraw(1234.57, 1234.57, false), null);
assert.equal(validateWithdraw(0.1 + 0.2, 0.3, false), null);
assert.equal(validateWithdraw(1234.58, 1234.57, false), 'insufficient');
assert.equal(validateWithdraw(10.555, 100, false), 'invalid');
