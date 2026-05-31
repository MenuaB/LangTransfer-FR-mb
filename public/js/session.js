import { SCENARIOS, availableScenarios } from './scenarios.js';

export function trackIds(tracks) { return Object.keys(tracks).map(Number).sort((a, b) => a - b); }
export function clampUnlockedTrack(value, tracks) {
  const ids = trackIds(tracks);
  const max = ids.at(-1) || 1;
  return Math.max(1, Math.min(max, Number(value) || 1));
}

function refsForUnlocked(exercises, unlockedTrack) {
  const refs = [];
  for (let track = 1; track <= unlockedTrack; track += 1) {
    (exercises[String(track)] || []).forEach((_, index) => refs.push({ track, index }));
  }
  return refs;
}

function pickSpread(refs, count, offset = 0) {
  if (!refs.length || count <= 0) return [];
  const step = Math.max(1, Math.floor(refs.length / count));
  return Array.from({ length: Math.min(count, refs.length) }, (_, i) => refs[(offset + i * step) % refs.length]);
}

function exerciseAt(exercises, ref) { return exercises[String(ref.track)]?.[ref.index] || null; }
function trackAt(tracks, track) { return tracks[String(track)] || {}; }
function answerFor(ex) { return ex?.fr || ''; }
function conceptList(track, ex) { return ex?.concepts || track?.concepts || []; }
function defaultSteps(track, ex) {
  return ex?.steps?.length ? ex.steps : [
    'Say the English idea out loud once.',
    'Choose the French structure from the track note.',
    'Assemble the French sentence before typing.'
  ].filter(Boolean);
}
function defaultWritingNotes(ex) {
  if (ex?.writing?.length) return ex.writing;
  const notes = [];
  if (/[éèêàùûîôçœ]/i.test(ex?.fr || '')) notes.push('Check accents carefully; they are part of written French.');
  if ((ex?.fr || '').includes("'")) notes.push('Watch apostrophes and contractions before vowels.');
  if (!notes.length) notes.push('Type the full sentence, including small structure words.');
  return notes;
}

function makeExerciseCard(type, ref, tracks, exercises) {
  const ex = exerciseAt(exercises, ref);
  const track = trackAt(tracks, ref.track);
  const labels = {
    build: ['Build', 'Speak first, then type the sentence.'],
    dictation: ['Dictation', 'Hear French, then write exactly what you hear.'],
    speak: ['Speaking', 'Produce the French aloud before checking.']
  };
  const [section, instruction] = labels[type] || ['Practice', 'Practice the sentence.'];
  return {
    id: `${type}:t${ref.track}_${ref.index}`,
    type,
    section,
    instruction,
    track: ref.track,
    index: ref.index,
    sourceId: `t${ref.track}_${ref.index}`,
    prompt: ex?.en || '',
    answer: answerFor(ex),
    meaning: ex?.en || '',
    context: track.context || '',
    grammar: track.grammar || '',
    steps: defaultSteps(track, ex),
    writing: defaultWritingNotes(ex),
    concepts: conceptList(track, ex)
  };
}

function makeScenarioCards(unlockedTrack, scenarios = SCENARIOS) {
  return availableScenarios(unlockedTrack, scenarios).slice(0, 1).flatMap(scenario => scenario.turns.map((turn, index) => ({
    id: `scenario:${scenario.id}:${index}`,
    type: 'scenario',
    section: 'Scenario',
    instruction: 'Treat this as one turn in a small dialogue.',
    track: scenario.requiredTrack,
    index,
    sourceId: `scenario:${scenario.id}:${index}`,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    prompt: turn.en,
    answer: turn.fr,
    meaning: turn.en,
    context: turn.note || '',
    steps: turn.note ? [turn.note] : [],
    writing: ['Type the full turn after saying it aloud.'],
    concepts: []
  })));
}

export function makeReviewCards(reviewIds = []) {
  return reviewIds.map(id => ({
    id: `review:${id}`,
    type: 'review',
    section: 'Review',
    instruction: 'Recall the pattern or sentence, then grade retention.',
    reviewId: id,
    sourceId: id
  }));
}

export function buildDailySession({ tracks, exercises, reviewIds = [], unlockedTrack = 1, goalMinutes = 20, scenarios = SCENARIOS } = {}) {
  const unlocked = clampUnlockedTrack(unlockedTrack, tracks || {});
  const refs = refsForUnlocked(exercises || {}, unlocked);
  const target = Math.max(8, Math.min(24, Math.round(Number(goalMinutes) || 20)));
  const reviewCount = Math.min(4, reviewIds.length, target);
  const review = makeReviewCards(reviewIds.slice(0, reviewCount));
  const scenario = makeScenarioCards(unlocked, scenarios).slice(0, Math.min(3, Math.max(0, target - review.length)));
  const remaining = Math.max(0, target - review.length - scenario.length);
  const buildCount = Math.ceil(remaining * 0.48);
  const dictationCount = Math.ceil(remaining * 0.3);
  const speakCount = Math.max(0, remaining - buildCount - dictationCount);
  const build = pickSpread(refs, buildCount, 0).map(ref => makeExerciseCard('build', ref, tracks, exercises));
  const dictation = pickSpread(refs, dictationCount, 3).map(ref => makeExerciseCard('dictation', ref, tracks, exercises));
  const speak = pickSpread(refs, speakCount, 7).map(ref => makeExerciseCard('speak', ref, tracks, exercises));
  return {
    id: `daily:u${unlocked}:g${target}`,
    kind: 'daily',
    title: '20-minute practice',
    unlockedTrack: unlocked,
    goalMinutes: target,
    cards: [...review, ...build, ...dictation, ...speak, ...scenario]
  };
}

export function buildTrackSession({ tracks, exercises, track, goalMinutes = 12 } = {}) {
  const refs = (exercises?.[String(track)] || []).map((_, index) => ({ track, index }));
  const target = Math.max(6, Math.min(16, Math.round(Number(goalMinutes) || 12)));
  const build = pickSpread(refs, Math.ceil(target * 0.5), 0).map(ref => makeExerciseCard('build', ref, tracks, exercises));
  const dictation = pickSpread(refs, Math.ceil(target * 0.3), 2).map(ref => makeExerciseCard('dictation', ref, tracks, exercises));
  const speak = pickSpread(refs, target - build.length - dictation.length, 4).map(ref => makeExerciseCard('speak', ref, tracks, exercises));
  return {
    id: `track:${track}:g${target}`,
    kind: 'track',
    title: `Track ${track} practice`,
    unlockedTrack: track,
    goalMinutes: target,
    cards: [...build, ...dictation, ...speak]
  };
}

export function buildScenarioSession(scenario) {
  return {
    id: `scenario:${scenario.id}`,
    kind: 'scenario',
    title: scenario.title,
    unlockedTrack: scenario.requiredTrack,
    goalMinutes: 8,
    cards: makeScenarioCards(scenario.requiredTrack, [scenario])
  };
}
