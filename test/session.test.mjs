import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailySession, buildScenarioSession, buildTrackSession, clampUnlockedTrack } from '../public/js/session.js';

const tracks = {
  1: { title: 'One', context: 'Context one', grammar: 'Grammar one' },
  2: { title: 'Two', context: 'Context two', grammar: 'Grammar two' },
  3: { title: 'Three', context: 'Context three', grammar: 'Grammar three' }
};
const exercises = {
  1: [{ en: 'A', fr: 'Un.' }, { en: 'B', fr: 'Deux.' }],
  2: [{ en: 'C', fr: 'Trois.' }, { en: 'D', fr: 'Quatre.' }],
  3: [{ en: 'E', fr: 'Cinq.' }]
};

test('clampUnlockedTrack stays within available tracks', () => {
  assert.equal(clampUnlockedTrack(99, tracks), 3);
  assert.equal(clampUnlockedTrack(0, tracks), 1);
});

test('daily session respects unlockedTrack', () => {
  const session = buildDailySession({ tracks, exercises, unlockedTrack: 2, goalMinutes: 10 });
  assert(session.cards.length >= 8);
  assert(session.cards.every(card => !card.track || card.track <= 2));
});

test('daily session includes build dictation and speaking cards', () => {
  const session = buildDailySession({ tracks, exercises, reviewIds: ['p1'], unlockedTrack: 3, goalMinutes: 12 });
  const types = new Set(session.cards.map(card => card.type));
  assert(types.has('review'));
  assert(types.has('build'));
  assert(types.has('dictation'));
  assert(types.has('speak'));
  assert(session.cards.every(card => card.id && card.sourceId));
});

test('track session generates stable exercise cards', () => {
  const session = buildTrackSession({ tracks, exercises, track: 2, goalMinutes: 8 });
  assert(session.cards.every(card => card.track === 2));
  assert(session.cards.some(card => card.id === 'build:t2_0'));
});

test('scenario session uses deterministic turn cards', () => {
  const scenario = { id: 'mini', title: 'Mini', requiredTrack: 1, turns: [{ en: 'Hello', fr: 'Bonjour.' }] };
  const session = buildScenarioSession(scenario);
  assert.equal(session.cards[0].id, 'scenario:mini:0');
  assert.equal(session.cards[0].type, 'scenario');
});
