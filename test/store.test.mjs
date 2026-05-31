import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStoreData } from '../public/js/store.js';

test('validateStoreData accepts minimal exported progress', () => {
  const data = validateStoreData({ deck: ['p1'], preferences: { autoplay: true } });
  assert.deepEqual(data.deck, ['p1']);
  assert.equal(data.preferences.autoplay, true);
  assert.equal(data.preferences.strictAccents, false);
  assert.equal(data.preferences.sessionMix, 'balanced');
  assert.equal(data.unlockedTrack, 1);
  assert.equal(data.dailyGoalMinutes, 20);
  assert.deepEqual(data.sessionHistory, []);
});

test('validateStoreData rejects malformed imports', () => {
  assert.throws(() => validateStoreData({ deck: {} }), /Deck must be an array/);
  assert.throws(() => validateStoreData([]), /JSON object/);
  assert.throws(() => validateStoreData({ unlockedTrack: 0 }), /Unlocked track/);
});
