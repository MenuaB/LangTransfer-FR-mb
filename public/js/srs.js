import { store } from './store.js';
export function localDate(days = 0) { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() + days); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
export function parseReviewId(id) {
  const sentence = id.match(/^t(\d+)_(\d+)$/);
  if (sentence) return { type: 'sentence', track: Number(sentence[1]), index: Number(sentence[2]) };
  const pattern = id.match(/^p(\d+)$/);
  if (pattern) return { type: 'pattern', track: Number(pattern[1]) };
  return { type: 'unknown', track: 0, index: 0 };
}
export function schedule(card = {}, grade = 3) {
  let { interval = 0, ease = 2.5, reps = 0, lapses = 0 } = card;
  if (grade <= 1) { lapses += 1; reps = 0; interval = 0; }
  else if (grade === 2) { interval = Math.max(1, Math.round((interval || 1) * 0.6)); ease = Math.max(1.3, ease - 0.15); }
  else { interval = reps === 0 ? 1 : reps === 1 ? 4 : Math.round(interval * ease); if (grade === 4) interval = Math.round(interval * 1.35); ease = Math.max(1.3, ease + (grade === 4 ? 0.08 : 0)); reps += 1; }
  return { interval, ease, reps, lapses, due: localDate(interval) };
}
export const srs = {
  all() { const d = store.load(); return { deck: d.deck, cards: d.srs }; },
  has(id) { return store.load().deck.includes(id); },
  add(id, meta = {}) { store.patch(d => { if (!d.deck.includes(id)) d.deck.push(id); d.srs[id] ||= { ...meta, interval: 0, ease: 2.5, reps: 0, lapses: 0, due: localDate(meta.status === 'bad' ? 0 : 1), added: localDate() }; }); },
  addTrack(track, exercises, scores = {}, trackData = {}) {
    this.add(`p${track}`, { type: 'pattern', track, title: trackData.title || `Track ${track}`, status: 'pattern' });
    exercises.forEach((_, i) => {
      const status = scores[i]?.status || scores[i];
      if (['bad', 'near', 'skip'].includes(status)) this.add(`t${track}_${i}`, { type: 'sentence', track, index: i, status });
    });
  },
  remove(id) { store.patch(d => { d.deck = d.deck.filter(x => x !== id); delete d.srs[id]; }); },
  due() { const today = localDate(); const { deck, cards } = this.all(); return deck.filter(id => cards[id]?.due <= today); },
  grade(id, grade) { store.patch(d => { d.srs[id] = { ...(d.srs[id] || {}), ...schedule(d.srs[id], grade), lastGrade: grade }; }); },
  stats() { const { deck, cards } = this.all(); const today = localDate(); return { total: deck.length, due: deck.filter(id => cards[id]?.due <= today).length, learned: deck.filter(id => (cards[id]?.reps || 0) > 1).length, newCards: deck.filter(id => !(cards[id]?.reps)).length }; }
};
