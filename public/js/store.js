const KEY = 'lt_fr_v2';
const LEGACY_KEY = 'lt_fr_v1';
const DEFAULTS = { history: {}, progress: {}, deck: [], srs: {}, preferences: { autoplay: false, strictAccents: false } };

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function isObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
export function mergeDefaults(data) { return { ...clone(DEFAULTS), ...(data || {}), preferences: { ...DEFAULTS.preferences, ...(data?.preferences || {}) } }; }
export function validateStoreData(data) {
  if (!isObject(data)) throw new Error('Progress import must be a JSON object.');
  if ('history' in data && !isObject(data.history)) throw new Error('Progress history must be an object.');
  if ('progress' in data && !isObject(data.progress)) throw new Error('In-progress answers must be an object.');
  if ('deck' in data && !Array.isArray(data.deck)) throw new Error('Deck must be an array.');
  if ('srs' in data && !isObject(data.srs)) throw new Error('Review schedule must be an object.');
  if ('preferences' in data && !isObject(data.preferences)) throw new Error('Preferences must be an object.');
  return mergeDefaults(data);
}

export const store = {
  key: KEY,
  load() {
    try {
      const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
      return mergeDefaults(raw ? JSON.parse(raw) : {});
    } catch {
      return mergeDefaults({});
    }
  },
  save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(mergeDefaults(data))); return true; }
    catch (error) { console.error('Could not save progress', error); return false; }
  },
  patch(fn) { const data = this.load(); fn(data); return this.save(data); },
  resetAll() { localStorage.removeItem(KEY); localStorage.removeItem(LEGACY_KEY); },
  summary() { const raw = localStorage.getItem(KEY) || ''; const d = this.load(); return { kb: Math.round(raw.length / 102.4) / 10, tracks: Object.keys(d.history).length, deck: d.deck.length }; },
  export() { return JSON.stringify(this.load(), null, 2); },
  import(json) {
    try { return this.save(validateStoreData(JSON.parse(json))); }
    catch (error) { console.error('Could not import progress', error); return false; }
  },
  getProgress(t) { return this.load().progress[String(t)] || null; },
  saveProgress(t, progress) { return this.patch(d => { d.progress[String(t)] = progress; }); },
  clearProgress(t) { return this.patch(d => { delete d.progress[String(t)]; }); },
  addAttempt(t, attempt) { return this.patch(d => { const k = String(t); d.history[k] ||= []; d.history[k].unshift(attempt); d.history[k] = d.history[k].slice(0, 30); }); },
  getHistory(t) { return this.load().history[String(t)] || []; },
  getBest(t) { return this.getHistory(t).reduce((best, item) => item.pct > (best?.pct ?? -1) ? item : best, null); },
  getPreferences() { return this.load().preferences; },
  setPreference(key, value) { return this.patch(d => { d.preferences[key] = value; }); }
};
