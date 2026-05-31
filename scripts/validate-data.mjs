import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const tracks = JSON.parse(await readFile('public/data/tracks.json', 'utf8'));
const exercises = JSON.parse(await readFile('public/data/exercises.json', 'utf8'));
const trackIds = Object.keys(tracks).map(Number).sort((a, b) => a - b);
const exerciseIds = Object.keys(exercises).map(Number).sort((a, b) => a - b);

assert(trackIds.length > 0, 'Course must contain at least one track.');
assert.deepEqual(exerciseIds, trackIds, 'Exercise track ids must exactly match track ids.');
trackIds.forEach((id, offset) => assert.equal(id, offset + 1, `Track ids must be contiguous from 1; expected ${offset + 1}, got ${id}.`));

for (const id of trackIds) {
  const track = tracks[id];
  assert.equal(typeof track.title, 'string', `Track ${id} needs a title.`);
  assert(track.title.trim(), `Track ${id} title cannot be empty.`);
  assert.equal(typeof track.context, 'string', `Track ${id} needs context.`);
  assert(track.context.trim(), `Track ${id} context cannot be empty.`);
  assert.equal(typeof track.grammar, 'string', `Track ${id} needs grammar.`);
  assert(track.grammar.trim(), `Track ${id} grammar cannot be empty.`);
  assert(Array.isArray(track.words) && track.words.length > 0, `Track ${id} needs words.`);
  assert(Array.isArray(track.sentences) && track.sentences.length > 0, `Track ${id} needs sentences.`);
  for (const [idx, pair] of track.words.entries()) {
    assert(Array.isArray(pair) && pair.length === 2 && pair.every(v => typeof v === 'string' && v.trim()), `Track ${id} word ${idx} must be [fr,en].`);
  }
  for (const [idx, pair] of track.sentences.entries()) {
    assert(Array.isArray(pair) && pair.length === 2 && pair.every(v => typeof v === 'string' && v.trim()), `Track ${id} sentence ${idx} must be [fr,en].`);
  }
  assert(Array.isArray(exercises[id]) && exercises[id].length >= 8, `Track ${id} needs at least 8 exercises.`);
  const seen = new Set();
  for (const [idx, ex] of exercises[id].entries()) {
    assert.equal(typeof ex.en, 'string', `Exercise ${id}.${idx} needs English prompt.`);
    assert.equal(typeof ex.fr, 'string', `Exercise ${id}.${idx} needs French answer.`);
    assert(ex.en.trim() && ex.fr.trim(), `Exercise ${id}.${idx} cannot contain empty prompts.`);
    assert(!seen.has(ex.fr), `Track ${id} has duplicate French answer: ${ex.fr}`);
    seen.add(ex.fr);
    if ('c' in ex) assert.equal(typeof ex.c, 'boolean', `Exercise ${id}.${idx} c must be boolean.`);
    if ('hint' in ex) assert.equal(typeof ex.hint, 'string', `Exercise ${id}.${idx} hint must be a string.`);
  }
}

console.log(`Validated ${trackIds.length} tracks and ${trackIds.reduce((sum, id) => sum + exercises[id].length, 0)} exercises.`);
