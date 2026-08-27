import assert from 'node:assert/strict';
import { validateWithdraw } from './withdrawValidation.ts';

assert.equal(validateWithdraw(10, 100, false), null);
assert.equal(validateWithdraw(0, 100, false), 'invalid');
assert.equal(validateWithdraw(101, 100, false), 'insufficient');
assert.equal(validateWithdraw(10, 100, true), 'pending');
