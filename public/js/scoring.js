export function stripAccents(text) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
export function normalize(text, { keepAccents = false } = {}) {
  const base = keepAccents ? text : stripAccents(text);
  return base.toLowerCase().replace(/[?!.,;:«»“”‘’—-]/g, '').replace(/\s+/g, ' ').trim();
}
export function answerOptions(answer) {
  if (Array.isArray(answer)) return answer.filter(Boolean);
  if (answer && typeof answer === 'object') {
    return [answer.fr, ...(answer.answers || []), ...(answer.alternates || [])].filter(Boolean);
  }
  return [answer].filter(Boolean);
}
export function canonicalAnswer(answer) { return answerOptions(answer)[0] || ''; }
export function levenshtein(a, b) {
  if (!a.length) return b.length; if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const cur = Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    for (let j = 1; j <= b.length; j++) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    prev.splice(0, prev.length, ...cur);
  }
  return prev[b.length];
}
function tokens(text) { return normalize(text).split(' ').filter(Boolean); }
function sameTokenBag(a, b) { const x = tokens(a).sort().join(' '); const y = tokens(b).sort().join(' '); return x === y && normalize(a) !== normalize(b); }
function missingSmallWord(input, answer) {
  const small = ['le','la','les','un','une','des','du','de','ne','pas','me','te','se','nous','vous','lui','leur','y','en','ce','ça'];
  const u = new Set(tokens(input)); const a = new Set(tokens(answer)); return small.find(w => a.has(w) && !u.has(w));
}
export function scoreAnswer(input, answer, prefs = {}) {
  const raw = input.trim(); if (!raw) return { status: 'skip', label: 'Skipped', message: 'Try producing an answer before revealing.' };
  const options = answerOptions(answer);
  const canonical = canonicalAnswer(answer);
  const exact = options.some(option => raw === option);
  if (exact) return { status: 'ok', label: 'Correct', message: 'Exact match.' };
  const accentlessInput = normalize(input);
  const accentedInput = normalize(input, { keepAccents: true });
  const accentlessMatch = options.find(option => normalize(option) === accentlessInput);
  const accentedMatch = options.find(option => normalize(option, { keepAccents: true }) === accentedInput);
  if (accentlessMatch && !accentedMatch) {
    return { status: prefs.strictAccents ? 'bad' : 'near', label: 'Accent issue', message: 'Meaning is right, but check the accents.' };
  }
  if (accentedMatch || accentlessMatch) return { status: 'ok', label: 'Correct', message: 'Punctuation/capitalization ignored.' };
  if (options.some(option => sameTokenBag(input, option))) return { status: 'bad', label: 'Word order', message: 'The words are right, but French word order is part of the pattern.' };
  const missing = missingSmallWord(input, canonical);
  if (missing) return { status: 'bad', label: 'Missing structure word', message: `Check the small word “${missing}”; articles and pronouns matter in French.` };
  const nearest = options.map(option => normalize(option)).sort((a, b) => levenshtein(accentlessInput, a) - levenshtein(accentlessInput, b))[0] || canonical;
  const dist = levenshtein(accentlessInput, nearest);
  if (dist <= Math.max(2, Math.floor(nearest.length * 0.06))) return { status: 'near', label: 'Small typo', message: 'Very close. Compare the spelling carefully.' };
  if (dist <= Math.max(6, Math.floor(nearest.length * 0.14))) return { status: 'near', label: 'Close', message: 'The structure is close, but compare each phrase.' };
  return { status: 'bad', label: 'Needs work', message: 'Reveal, think through the pattern, then try a variation.' };
}
