import { el, clear, byId, button, navButton } from './dom.js';
import { store } from './store.js';
import { canonicalAnswer, scoreAnswer } from './scoring.js';
import { parseReviewId, srs } from './srs.js';
import { speak, canRecognize, recognizeFrench } from './speech.js';

const state = { tracks: {}, exercises: {}, currentTrack: 1, mode: 'guided', answers: {}, activeInput: null, review: null, focusBeforeModal: null };
const app = byId('app');
const maxTrack = () => Math.max(...Object.keys(state.tracks).map(Number));
const trackIds = () => Object.keys(state.tracks).map(Number).sort((a,b)=>a-b);
const path = () => location.hash.replace(/^#/, '') || '/';
const go = p => { location.hash = `#${p}`; };

function setStatus(text) { byId('topbar-status').textContent = text; }
function screen(...children) { clear(app).append(el('section', { class: 'screen' }, children)); app.focus(); }
function trackTitle(t) { return state.tracks[String(t)]?.title || `Track ${t}`; }
function safeGrammar(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowed = new Set(['EM', 'STRONG', 'B', 'I', 'BR']);
  template.content.querySelectorAll('*').forEach(node => {
    if (!allowed.has(node.tagName)) node.replaceWith(document.createTextNode(node.textContent || ''));
    else [...node.attributes].forEach(attr => node.removeAttribute(attr.name));
  });
  return template.innerHTML;
}
function progressFor(t) { const p = store.getProgress(t); const total = state.exercises[String(t)]?.length || 0; return total && p ? Math.round(Object.keys(p.answers || {}).length / total * 100) : 0; }
function bestFor(t) { return store.getBest(t); }
function prefs() { return store.getPreferences(); }
function exerciseAnswer(ex) { return ex.answers || ex.alternates ? { fr: ex.fr, answers: ex.answers, alternates: ex.alternates } : ex.fr; }
function reviewDetails(id) {
  const parsed = parseReviewId(id);
  if (parsed.type === 'pattern') {
    const track = state.tracks[String(parsed.track)];
    return {
      ...parsed,
      meta: `Track ${parsed.track} pattern`,
      prompt: `Explain the transfer pattern: ${track?.title || `Track ${parsed.track}`}`,
      answer: track?.grammar || track?.context || 'Pattern unavailable.',
      answerHtml: track?.grammar ? safeGrammar(track.grammar) : null,
      hint: track?.context || ''
    };
  }
  if (parsed.type === 'sentence') {
    const ex = state.exercises[String(parsed.track)]?.[parsed.index];
    return {
      ...parsed,
      meta: `Track ${parsed.track} sentence`,
      prompt: ex?.en || 'Missing exercise',
      answer: ex?.fr || id,
      hint: ex?.hint || state.tracks[String(parsed.track)]?.context || ''
    };
  }
  return { ...parsed, meta: 'Unknown card', prompt: id, answer: 'Missing review item.', hint: '' };
}

function renderHome() {
  setStatus(`${trackIds().length} tracks`);
  const data = store.load(); const stats = srs.stats();
  const last = Math.max(1, ...Object.keys({ ...data.history, ...data.progress }).map(Number).filter(Boolean));
  const cards = trackIds().map(t => {
    const track = state.tracks[String(t)]; const best = bestFor(t); const pct = progressFor(t);
    return el('button', { class: 'card', onclick: () => go(`/track/${t}`) }, [
      el('span', { class: 'track-num', text: `Track ${t}` }),
      el('span', { class: 'card-title', text: track.title }),
      el('span', { class: 'muted', text: track.context }),
      el('div', { class: 'progress-bar', 'aria-label': `${pct}% in-progress` }, el('span', { style: `width:${pct}%` })),
      el('small', { class: 'muted', text: best ? `Best ${best.pct}%` : pct ? 'In progress' : 'Not started' })
    ]);
  });
  screen(
    el('div', { class: 'hero' }, [
      el('h1', { text: 'French by transfer, not memorization' }),
      el('p', { text: 'Work through short guided prompts: think first, say or type your answer, reveal the French, then notice the reusable pattern. Your progress stays in this browser.' }),
      el('div', { class: 'stats' }, [
        el('span', { class: 'stat', text: `${Object.keys(data.history).length} tracks practised` }),
        el('span', { class: 'stat', text: `${stats.total} deck cards` }),
        el('span', { class: 'stat', text: `${stats.due} due today` })
      ]),
      el('div', { class: 'toolbar' }, [navButton(`Continue track ${last}`, `/track/${last}`, { class: 'primary' }), navButton(`Review ${stats.due} due`, '/review', { class: 'secondary', disabled: stats.due === 0 }), navButton('Open deck', '/deck', { class: 'secondary' })])
    ]),
    el('div', { class: 'grid' }, cards)
  );
}

function renderLesson(t) {
  state.currentTrack = t; const track = state.tracks[String(t)]; if (!track) return renderNotFound();
  setStatus(`Track ${t} / ${trackIds().length}`);
  screen(
    el('div', { class: 'toolbar' }, [navButton('← All tracks', '/', { class: 'secondary' }), navButton('Guided practice →', `/track/${t}/practice`, { class: 'primary' }), navButton('History', `/results/${t}`, { class: 'secondary' })]),
    el('article', { class: 'lesson-header' }, [
      el('span', { class: 'track-num', text: `Track ${t}` }), el('h1', { class: 'lesson-title', text: track.title }), el('p', { class: 'callout', text: track.context })
    ]),
    el('h2', { class: 'section-title', text: 'Transfer principle' }), el('div', { class: 'panel callout', html: safeGrammar(track.grammar) }),
    el('h2', { class: 'section-title', text: 'Useful building blocks' }), el('div', { class: 'word-grid' }, track.words.map(([fr,en]) => el('span', { class: 'word' }, [el('strong', { text: fr }), el('span', { text: en })]))),
    el('h2', { class: 'section-title', text: 'Core sentences' }), el('table', { class: 'sentences' }, el('tbody', {}, track.sentences.map(([fr,en]) => el('tr', {}, [el('td', { text: fr }), el('td', { text: en })])))),
    el('div', { class: 'toolbar' }, [t > 1 ? navButton('← Previous', `/track/${t-1}`, { class: 'secondary' }) : null, t < maxTrack() ? navButton('Next →', `/track/${t+1}`, { class: 'secondary' }) : null])
  );
}

function modeTabs(t) { return el('div', { class: 'mode-tabs', role: 'toolbar', 'aria-label': 'Practice modes' }, [
  button('Guided', { class: 'chip-button', 'aria-pressed': state.mode === 'guided', onclick: () => { state.mode='guided'; renderPractice(t); } }),
  button('Type', { class: 'chip-button', 'aria-pressed': state.mode === 'type', onclick: () => { state.mode='type'; renderPractice(t); } }),
  button('Listen', { class: 'chip-button', 'aria-pressed': state.mode === 'listen', onclick: () => { state.mode='listen'; renderPractice(t); } }),
  button('Shadow', { class: 'chip-button', 'aria-pressed': state.mode === 'shadow', onclick: () => { state.mode='shadow'; renderPractice(t); } })
]); }

function renderPractice(t) {
  state.currentTrack = t; const exercises = state.exercises[String(t)] || []; const saved = store.getProgress(t); state.answers = saved?.answers || {};
  setStatus(`Track ${t} practice`);
  const list = exercises.map((ex, i) => exerciseCard(t, ex, i));
  screen(
    el('div', { class: 'toolbar' }, [navButton('← Lesson', `/track/${t}`, { class: 'secondary' }), modeTabs(t), button('+ Add pattern review', { class: 'secondary', onclick: () => { srs.addTrack(t, exercises, state.answers, state.tracks[String(t)]); renderPractice(t); } })]),
    el('h1', { class: 'lesson-title', text: `Track ${t}: ${trackTitle(t)}` }),
    el('p', { class: 'muted', text: state.mode === 'guided' ? 'Pause before revealing. The goal is to reason from patterns, not memorize isolated answers.' : modeHelp() }),
    charBar(), ...list, completionPanel(t, exercises)
  );
}
function modeHelp(){ return state.mode === 'listen' ? 'Hear the French first, type what you hear, then reveal the meaning and pattern.' : state.mode === 'shadow' ? 'Listen, repeat aloud, then reveal meaning and pattern to complete the card.' : 'Translate the English prompt into French.'; }
function charBar(){ return el('div', { class: 'charbar', 'aria-label': 'French characters' }, ['é','è','ê','ë','à','â','î','ï','ô','ù','û','ü','ç','œ','É','À'].map(ch => button(ch, { onclick: () => { const input = state.activeInput; if (!input) return; const s=input.selectionStart; input.setRangeText(ch, s, input.selectionEnd, 'end'); input.focus(); } }))); }
function exerciseCard(t, ex, i) {
  const saved = state.answers[i]; const revealed = Boolean(saved); const input = el('input', { value: saved?.input || '', placeholder: 'Type French here…', autocomplete: 'off', spellcheck: 'false', onfocus: e => { state.activeInput = e.target; }, onkeydown: e => { if (e.key === 'Enter') reveal(); } });
  const feedback = el('div', { class: `feedback ${saved?.status || ''}`, text: saved ? `${saved.label}: ${saved.message}` : '' });
  const card = el('article', { class: `${state.mode === 'guided' ? 'guided-card' : 'exercise'} ${revealed ? 'revealed' : ''}` });
  function reveal() {
    const result = state.mode === 'shadow'
      ? { status: 'ok', label: 'Shadowed', message: 'Repeated aloud, then checked the meaning.' }
      : scoreAnswer(input.value, exerciseAnswer(ex), prefs());
    state.answers[i] = { ...result, input: state.mode === 'shadow' ? '[shadow]' : input.value, ts: Date.now() };
    store.saveProgress(t, { answers: state.answers, updated: Date.now() });
    if (prefs().autoplay) speak(ex.fr, 'fr-FR');
    renderPractice(t);
  }
  const promptText = state.mode === 'listen' ? 'Listen first, then type the French you hear.' : state.mode === 'shadow' ? 'Listen and repeat the French aloud.' : ex.en;
  const audioButtons = state.mode === 'listen' || state.mode === 'shadow'
    ? [button('Hear FR', { class: 'primary', onclick: () => speak(ex.fr, 'fr-FR') })]
    : [button('Hear EN', { class: 'secondary', onclick: () => speak(ex.en, 'en-GB') }), button('Hear FR', { class: 'secondary', onclick: () => speak(ex.fr, 'fr-FR') })];
  const controls = state.mode === 'shadow'
    ? el('div', { class: 'toolbar' }, [button('Reveal meaning', { class: 'primary', onclick: reveal })])
    : el('div', { class: 'input-row' }, [input, canRecognize() ? button('Mic', { class: 'secondary', onclick: () => recognizeFrench(text => { input.value = text; }, () => {}) }) : null, button('Reveal', { class: 'primary', onclick: reveal })]);
  const answerChildren = [
    el('strong', { text: canonicalAnswer(exerciseAnswer(ex)) }),
    state.mode === 'listen' || state.mode === 'shadow' ? el('p', { text: ex.en }) : null,
    el('p', { class: 'hint', text: ex.hint || state.tracks[String(t)]?.context || 'Notice how this sentence reuses the track pattern.' }),
    button(srs.has(`t${t}_${i}`) ? 'In review' : 'Review this sentence', { class: 'secondary', disabled: srs.has(`t${t}_${i}`), onclick: () => { srs.add(`t${t}_${i}`, { type: 'sentence', track: t, index: i, status: saved?.status }); renderPractice(t); } })
  ];
  card.append(
    el('div', { class: 'prompt' }, [el('span', { text: promptText }), ex.c ? el('span', { class: 'badge', text: 'challenge' }) : null]),
    el('div', { class: 'toolbar' }, audioButtons),
    state.mode === 'shadow' ? el('p', { class: 'hint', text: 'Say it before revealing. This mode records completion, not spelling accuracy.' }) : null,
    controls,
    feedback,
    el('div', { class: 'answer' }, answerChildren)
  );
  return card;
}
function completionPanel(t, exercises) {
  const done = Object.keys(state.answers).length; const ok = Object.values(state.answers).filter(a => a.status === 'ok').length; const pct = exercises.length ? Math.round(ok / exercises.length * 100) : 0;
  if (done < exercises.length) return el('p', { class: 'muted', text: `${done} / ${exercises.length} revealed` });
  return el('div', { class: 'panel callout' }, [el('h2', { text: `Session complete: ${pct}%` }), el('p', { text: `${ok} exact/correct answers. Close answers are useful signals—review the pattern before moving on.` }), button('Save attempt', { class: 'primary', onclick: () => { store.addAttempt(t, { ts: Date.now(), pct, ok, total: exercises.length, answers: state.answers }); store.clearProgress(t); go(`/results/${t}`); } })]);
}

function renderReview() {
  const due = srs.due(); if (!due.length) return screen(el('div', { class: 'hero' }, [el('h1', { text: 'No cards due' }), navButton('Back home', '/', { class: 'primary' })]));
  state.review ||= { cards: due, pos: 0, again: [] }; const id = state.review.cards[state.review.pos]; if (!id) { state.review = null; return renderReview(); }
  const details = reviewDetails(id);
  let revealed = false; const answer = el('div', { class: 'answer' }, [details.answerHtml ? el('div', { html: details.answerHtml }) : el('strong', { text: details.answer }), details.hint ? el('p', { class: 'hint', text: details.hint }) : null]); const card = el('article', { class: 'review-card' });
  const reveal = () => { revealed = true; card.classList.add('revealed'); };
  const grade = g => { srs.grade(id, g); if (g <= 1) state.review.cards.push(id); state.review.pos += 1; renderReview(); };
  card.append(el('span', { class: 'track-num', text: details.meta }), el('p', { class: 'prompt', text: details.prompt }), button('Reveal', { class: 'primary', onclick: reveal }), answer, el('div', { class: 'review-buttons' }, [button('Again', { class: 'danger', onclick: () => grade(1) }), button('Good', { class: 'secondary', onclick: () => grade(3) }), button('Easy', { class: 'secondary', onclick: () => grade(4) })]));
  screen(el('div', { class: 'toolbar' }, [navButton('← Home', '/', { class: 'secondary' }), el('span', { class: 'muted', text: `${state.review.pos + 1} / ${state.review.cards.length}` })]), card);
}

function renderDeck() {
  setStatus('Deck'); const { deck, cards } = srs.all(); const stats = srs.stats();
  screen(el('div', { class: 'toolbar' }, [navButton('← Home', '/', { class: 'secondary' }), stats.due ? navButton(`Review ${stats.due}`, '/review', { class: 'primary' }) : null]), el('h1', { class: 'lesson-title', text: 'Pattern review' }), el('p', { class: 'muted', text: 'Use review to revisit transfer patterns and trouble spots, not to memorize the course sentence by sentence.' }), el('div', { class: 'deck-list' }, deck.map(id => { const details = reviewDetails(id); return el('article', { class: 'deck-card' }, [el('div', { class: 'deck-meta', text: `${details.meta} · due ${cards[id]?.due || 'today'}` }), el('strong', { text: details.answerHtml ? details.prompt : details.answer }), el('p', { text: details.answerHtml ? details.hint : details.prompt }), button('Remove', { class: 'secondary', onclick: () => { srs.remove(id); renderDeck(); } })]); })));
}
function renderResults(t) { const h = store.getHistory(t); screen(el('div', { class: 'toolbar' }, [navButton('← Lesson', `/track/${t}`, { class: 'secondary' })]), el('h1', { class: 'lesson-title', text: `History: Track ${t}` }), h.length ? el('div', { class: 'deck-list' }, h.map(a => el('article', { class: 'deck-card' }, [el('strong', { text: `${a.pct}%` }), el('p', { class: 'muted', text: new Date(a.ts).toLocaleString() })]))) : el('p', { class: 'muted', text: 'No saved attempts yet.' })); }
function renderNotFound(){ screen(el('div', { class: 'hero' }, [el('h1', { text: 'Not found' }), navButton('Back home', '/', { class: 'primary' })])); }

function route() { const p = path(); const mTrack = p.match(/^\/track\/(\d+)$/); const mPractice = p.match(/^\/track\/(\d+)\/practice$/); const mResults = p.match(/^\/results\/(\d+)$/); if (mTrack) renderLesson(Number(mTrack[1])); else if (mPractice) renderPractice(Number(mPractice[1])); else if (p === '/review') renderReview(); else if (p === '/deck') renderDeck(); else renderHome(); }
function wireGlobalEvents() {
  document.addEventListener('click', e => { const target = e.target.closest('[data-nav]'); if (target) go(target.dataset.nav); });
  addEventListener('hashchange', () => { state.review = path() === '/review' ? state.review : null; route(); });
  byId('settings-open').addEventListener('click', openSettings); byId('settings-close').addEventListener('click', closeSettings); byId('settings-modal').addEventListener('click', e => { if (e.target.id === 'settings-modal') closeSettings(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSettings(); });
  byId('export-progress').addEventListener('click', () => { const blob = new Blob([store.export()], { type: 'application/json' }); const a = el('a', { href: URL.createObjectURL(blob), download: 'lt-french-progress.json' }); a.click(); URL.revokeObjectURL(a.href); });
  byId('import-progress').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; if (store.import(await file.text())) { closeSettings(); route(); } else alert('Could not import progress. Choose a valid LT French progress JSON file.'); e.target.value = ''; });
  byId('reset-track').addEventListener('click', () => { if (confirm(`Reset Track ${state.currentTrack} in-progress answers?`)) { store.clearProgress(state.currentTrack); closeSettings(); route(); } });
  byId('reset-all').addEventListener('click', () => { if (confirm('Delete all local progress, history, and deck data?')) { store.resetAll(); closeSettings(); route(); } });
  byId('pref-autoplay').addEventListener('change', e => store.setPreference('autoplay', e.target.checked)); byId('pref-strict-accents').addEventListener('change', e => store.setPreference('strictAccents', e.target.checked));
}
function openSettings(){ state.focusBeforeModal = document.activeElement; const sum = store.summary(); byId('storage-summary').textContent = `About ${sum.kb} KB stored locally · ${sum.tracks} tracks with history · ${sum.deck} deck cards.`; const p = prefs(); byId('pref-autoplay').checked = p.autoplay; byId('pref-strict-accents').checked = p.strictAccents; byId('settings-modal').classList.remove('hidden'); byId('settings-close').focus(); }
function closeSettings(){ byId('settings-modal').classList.add('hidden'); state.focusBeforeModal?.focus?.(); }
async function init(){ wireGlobalEvents(); try { const [tracks, exercises] = await Promise.all([fetch('data/tracks.json').then(r => r.json()), fetch('data/exercises.json').then(r => r.json())]); state.tracks = tracks; state.exercises = exercises; route(); } catch (error) { console.error(error); screen(el('div', { class: 'hero' }, [el('h1', { text: 'Could not load course data' }), el('p', { text: 'Check that data/tracks.json and data/exercises.json are available.' })])); } }
init();
