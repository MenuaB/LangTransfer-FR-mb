import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreAnswer } from '../public/js/scoring.js';

test('accepts exact answers', () => {
  assert.equal(scoreAnswer('Je veux le café.', 'Je veux le café.').status, 'ok');
});

test('flags accent-only differences without hiding the issue', () => {
  const result = scoreAnswer('Je veux le cafe.', 'Je veux le café.');
  assert.equal(result.status, 'near');
  assert.match(result.label, /Accent/);
});

test('can make accents strict', () => {
  assert.equal(scoreAnswer('Je veux le cafe.', 'Je veux le café.', { strictAccents: true }).status, 'bad');
});

test('does not accept shuffled words as correct', () => {
  const result = scoreAnswer('veux je le café', 'Je veux le café.');
  assert.equal(result.status, 'bad');
  assert.match(result.label, /Word order/);
});

test('flags missing small structure words', () => {
  const result = scoreAnswer('Je veux café', 'Je veux le café.');
  assert.equal(result.status, 'bad');
  assert.match(result.label, /Missing/);
});

test('accepts structured alternate answers', () => {
  const result = scoreAnswer('Tu es où ?', { fr: 'Où es-tu ?', alternates: ['Tu es où ?'] });
  assert.equal(result.status, 'ok');
});
