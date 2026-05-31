import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, schedule } from '../public/js/srs.js';

test('localDate returns YYYY-MM-DD', () => {
  assert.match(localDate(), /^\d{4}-\d{2}-\d{2}$/);
});

test('again remains due today', () => {
  assert.equal(schedule({ interval: 4, reps: 2 }, 1).due, localDate(0));
});

test('good new card is due tomorrow', () => {
  const next = schedule({}, 3);
  assert.equal(next.interval, 1);
  assert.equal(next.due, localDate(1));
});
