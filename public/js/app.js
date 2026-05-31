import { el, clear, byId, button, navButton } from './dom.js';
import { go, parseRoute } from './router.js';
import { store } from './store.js';
import { canonicalAnswer, scoreAnswer } from './scoring.js';
import { parseReviewId, srs } from './srs.js';
import { speak, canRecognize, recognizeFrench } from './speech.js';
import { SCENARIOS, availableScenarios } from './scenarios.js';
import { buildDailySession, buildScenarioSession, buildTrackSession, clampUnlockedTrack, trackIds } from './session.js';
import { cardFrame, charBar, gradeButtons, sessionProgress } from './cards.js';

const state = {
  tracks: {},
  exercises: {},
  currentTrack: 1,
  activeSession: null,
  sessionPos: 0,
  revealed: false,
  showHints: false,
  inputValue: '',
  feedback: null,
  sessionResults: [],
  activeInput: null,
  focusBeforeModal: null
};

const app = byId('app');
const maxTrack = () => trackIds(state.tracks).at(-1) || 1;
const prefs = () => store.getPreferences();
const setStatus = text => { byId('topbar-status').textContent = text; };
const screen = (...children) => { clear(app).append(el('section', { class: 'screen' }, children)); app.focus(); };
const trackTitle = t => state.tracks[String(t)]?.title || `Track ${t}`;

function safeGrammar(html) {
  const template = document.createElement('template');
  template.innerHTML = html || '';
  const allowed = new Set(['EM', 'STRONG', 'B', 'I', 'BR']);
  template.content.querySelectorAll('*').forEach(node => {
    if (!allowed.has(node.tagName)) node.replaceWith(document.createTextNode(node.textContent || ''));
    else [...node.attributes].forEach(attr => node.removeAttribute(attr.name));
  });
  return template.innerHTML;
}

function exerciseAnswer(card) {
  return card.answers || card.alternates ? { fr: card.answer, answers: card.answers, alternates: card.alternates } : card.answer;
}

function reviewDetails(id) {
  const parsed = parseReviewId(id);
  if (parsed.type === 'pattern') {
    const track = state.tracks[String(parsed.track)];
    return {
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
      meta: `Track ${parsed.track} sentence`,
      prompt: ex?.en || 'Missing exercise',
      answer: ex?.fr || id,
      hint: ex?.hint || state.tracks[String(parsed.track)]?.context || ''
    };
  }
  return { meta: 'Review', prompt: id, answer: 'Missing review item.', hint: '' };
}

function unlockedTrack() {
  return clampUnlockedTrack(store.load().unlockedTrack, state.tracks);
}

function startSession(session) {
  state.activeSession = session;
  state.sessionPos = 0;
  state.revealed = false;
  state.showHints = false;
  state.inputValue = '';
  state.feedback = null;
  state.sessionResults = [];
  store.saveLastSession({ id: session.id, kind: session.kind, title: session.title, startedAt: Date.now(), total: session.cards.length });
  go('/session');
}

function startDailySession() {
  const data = store.load();
  startSession(buildDailySession({
    tracks: state.tracks,
    exercises: state.exercises,
    reviewIds: srs.due(),
    unlockedTrack: data.unlockedTrack,
    goalMinutes: data.dailyGoalMinutes,
    scenarios: SCENARIOS
  }));
}

function startTrackSession(track) {
  state.currentTrack = track;
  startSession(buildTrackSession({ tracks: state.tracks, exercises: state.exercises, track, goalMinutes: 12 }));
}

function finishSession() {
  const session = state.activeSession;
  const result = {
    id: session.id,
    kind: session.kind,
    title: session.title,
    completedAt: Date.now(),
    total: session.cards.length,
    results: state.sessionResults
  };
  store.addSessionResult(result);
  screen(
    el('div', { class: 'session-complete' }, [
      el('span', { class: 'eyebrow', text: 'Session complete' }),
      el('h1', { text: session.title }),
      el('p', { class: 'muted', text: `${session.cards.length} cards completed. Keep the daily loop light and consistent.` }),
      el('div', { class: 'toolbar' }, [
        navButton('Back to Today', '/', { class: 'primary' }),
        navButton('Review deck', '/review', { class: 'secondary' })
      ])
    ])
  );
}

function nextCard(result = {}) {
  const card = state.activeSession?.cards[state.sessionPos];
  if (card) state.sessionResults.push({ id: card.id, type: card.type, status: result.status || 'done', ts: Date.now() });
  state.sessionPos += 1;
  state.revealed = false;
  state.showHints = false;
  state.inputValue = '';
  state.feedback = null;
  if (!state.activeSession || state.sessionPos >= state.activeSession.cards.length) finishSession();
  else renderSession();
}

function insertChar(input, ch) {
  const start = input.selectionStart ?? input.value.length;
  input.setRangeText(ch, start, input.selectionEnd ?? start, 'end');
  state.inputValue = input.value;
  input.focus();
}

function inputRow(card) {
  const input = el('input', {
    value: state.inputValue,
    placeholder: card.type === 'dictation' ? 'Type the French you hear...' : 'Type French here...',
    autocomplete: 'off',
    spellcheck: 'false',
    oninput: e => { state.inputValue = e.target.value; },
    onfocus: e => { state.activeInput = e.target; },
    onkeydown: e => { if (e.key === 'Enter') revealCard(card); }
  });
  return [
    el('div', { class: 'input-row' }, [
      input,
      canRecognize() ? button('Mic', { class: 'secondary', onclick: () => recognizeFrench(text => { input.value = text; state.inputValue = text; }, () => {}) }) : null,
      button('Reveal', { class: 'primary', onclick: () => revealCard(card) })
    ]),
    charBar(ch => insertChar(input, ch))
  ];
}

function revealCard(card) {
  if (card.type === 'speak') {
    state.feedback = { status: 'ok', label: 'Speaking check', message: 'Grade by how easily you produced the sentence aloud.' };
  } else if (card.type === 'review') {
    state.feedback = { status: 'ok', label: 'Review', message: 'Grade retention after revealing.' };
  } else {
    state.feedback = scoreAnswer(state.inputValue, exerciseAnswer(card), prefs());
    if (['bad', 'near', 'skip'].includes(state.feedback.status) && card.sourceId?.startsWith('t')) {
      srs.add(card.sourceId, { type: 'sentence', track: card.track, index: card.index, status: state.feedback.status });
    }
  }
  state.revealed = true;
  if (prefs().autoplay && card.answer) speak(card.answer, 'fr-FR');
  renderSession();
}

function renderAnswer(card) {
  if (!state.revealed) return null;
  const feedback = state.feedback;
  return el('div', { class: 'answer shown' }, [
    feedback ? el('div', { class: `feedback ${feedback.status}` }, [
      el('strong', { text: feedback.label }),
      el('span', { text: ` ${feedback.message}` })
    ]) : null,
    card.type === 'review' ? renderReviewAnswer(card.reviewId) : el('div', { class: 'answer-grid' }, [
      el('div', {}, [el('span', { class: 'eyebrow', text: 'French' }), el('strong', { text: canonicalAnswer(exerciseAnswer(card)) })]),
      card.meaning ? el('div', {}, [el('span', { class: 'eyebrow', text: 'Meaning' }), el('p', { text: card.meaning })]) : null
    ]),
    card.context ? el('p', { class: 'hint', text: card.context }) : null,
    card.writing?.length ? el('ul', { class: 'note-list' }, card.writing.map(note => el('li', { text: note }))) : null
  ]);
}

function renderReviewAnswer(reviewId) {
  const details = reviewDetails(reviewId);
  return el('div', { class: 'answer-grid' }, [
    el('div', {}, [
      el('span', { class: 'eyebrow', text: details.meta }),
      details.answerHtml ? el('div', { html: details.answerHtml }) : el('strong', { text: details.answer })
    ]),
    details.hint ? el('p', { class: 'hint', text: details.hint }) : null
  ]);
}

function renderBuildCard(card) {
  return cardFrame(card, [
    el('h1', { text: card.prompt }),
    el('p', { class: 'speak-first', text: 'Say it aloud first. Then type it to check structure and spelling.' }),
    button(state.showHints ? 'Hide build hints' : 'Show build hints', { class: 'secondary', onclick: () => { state.showHints = !state.showHints; renderSession(); } }),
    state.showHints ? el('ol', { class: 'note-list' }, card.steps.map(step => el('li', { text: step }))) : null,
    ...inputRow(card),
    renderAnswer(card),
    state.revealed ? el('div', { class: 'toolbar' }, [button('Next card', { class: 'primary', onclick: () => nextCard(state.feedback) })]) : null
  ]);
}

function renderDictationCard(card) {
  return cardFrame(card, [
    el('h1', { text: 'Listen and write the French' }),
    el('p', { class: 'speak-first', text: 'Play the sentence, type what you hear, then inspect the written French.' }),
    el('div', { class: 'toolbar' }, [button('Hear French', { class: 'primary', onclick: () => speak(card.answer, 'fr-FR') })]),
    ...inputRow(card),
    renderAnswer(card),
    state.revealed ? el('div', { class: 'toolbar' }, [button('Next card', { class: 'primary', onclick: () => nextCard(state.feedback) })]) : null
  ]);
}

function renderSpeakCard(card) {
  return cardFrame(card, [
    el('h1', { text: card.prompt }),
    el('p', { class: 'speak-first', text: 'Produce the French aloud. Do not type unless you want to check yourself after reveal.' }),
    el('div', { class: 'toolbar' }, [
      button('Hear English', { class: 'secondary', onclick: () => speak(card.prompt, 'en-GB') }),
      state.revealed ? button('Hear French', { class: 'secondary', onclick: () => speak(card.answer, 'fr-FR') }) : null,
      !state.revealed ? button('Reveal French', { class: 'primary', onclick: () => revealCard(card) }) : null
    ]),
    renderAnswer(card),
    state.revealed ? gradeButtons(grade => nextCard({ status: grade <= 1 ? 'bad' : 'ok', grade })) : null
  ]);
}

function renderScenarioCard(card) {
  return cardFrame(card, [
    el('span', { class: 'scenario-title', text: card.scenarioTitle }),
    el('h1', { text: card.prompt }),
    el('p', { class: 'speak-first', text: 'Answer this dialogue turn aloud, then type the French.' }),
    ...inputRow(card),
    renderAnswer(card),
    state.revealed ? el('div', { class: 'toolbar' }, [button('Next turn', { class: 'primary', onclick: () => nextCard(state.feedback) })]) : null
  ]);
}

function renderReviewCard(card) {
  const details = reviewDetails(card.reviewId);
  return cardFrame({ ...card, track: parseReviewId(card.reviewId).track }, [
    el('span', { class: 'scenario-title', text: details.meta }),
    el('h1', { text: details.prompt }),
    !state.revealed ? button('Reveal', { class: 'primary', onclick: () => revealCard(card) }) : null,
    renderAnswer(card),
    state.revealed ? gradeButtons(grade => {
      srs.grade(card.reviewId, grade);
      nextCard({ status: grade <= 1 ? 'bad' : 'ok', grade });
    }) : null
  ]);
}

function renderCurrentCard(card) {
  if (card.type === 'dictation') return renderDictationCard(card);
  if (card.type === 'speak') return renderSpeakCard(card);
  if (card.type === 'scenario') return renderScenarioCard(card);
  if (card.type === 'review') return renderReviewCard(card);
  return renderBuildCard(card);
}

function renderSession() {
  const session = state.activeSession || buildDailySession({
    tracks: state.tracks,
    exercises: state.exercises,
    reviewIds: srs.due(),
    unlockedTrack: unlockedTrack(),
    goalMinutes: store.load().dailyGoalMinutes
  });
  state.activeSession ||= session;
  const card = session.cards[state.sessionPos];
  setStatus(session.title);
  if (!card) return finishSession();
  screen(
    el('div', { class: 'session-shell' }, [
      el('div', { class: 'session-head' }, [
        navButton('Back to Today', '/', { class: 'secondary' }),
        sessionProgress(session, state.sessionPos)
      ]),
      renderCurrentCard(card)
    ])
  );
}

function renderToday() {
  const data = store.load();
  const unlocked = clampUnlockedTrack(data.unlockedTrack, state.tracks);
  const stats = srs.stats();
  const scenarios = availableScenarios(unlocked);
  setStatus('Today');
  screen(
    el('div', { class: 'dashboard' }, [
      el('section', { class: 'today-hero' }, [
        el('div', {}, [
          el('span', { class: 'eyebrow', text: 'Daily advanced practice' }),
          el('h1', { text: '20 minutes of speaking, writing, and retention' }),
          el('p', { text: 'Use this after the audio. Build French from English thoughts, say it aloud, then type to strengthen written French.' })
        ]),
        el('div', { class: 'hero-actions' }, [
          button('Start 20-minute practice', { class: 'primary large-action', onclick: startDailySession }),
          navButton('Open notes', '/notes', { class: 'secondary' })
        ])
      ]),
      el('section', { class: 'dashboard-grid' }, [
        statPanel('Unlocked', `Track ${unlocked}`, 'Only tracks you have heard appear in daily practice.'),
        statPanel('Due review', String(stats.due), 'Pattern and sentence retention items.'),
        statPanel('Goal', `${data.dailyGoalMinutes} min`, 'Balanced review, build, dictation, speaking, scenario.'),
        statPanel('Scenarios', String(scenarios.length), 'Scripted dialogue drills available now.')
      ]),
      el('section', { class: 'panel control-panel' }, [
        el('div', {}, [
          el('h2', { text: 'Practice boundary' }),
          el('p', { class: 'muted', text: 'Set this to the last Language Transfer track you have listened to.' })
        ]),
        el('label', { class: 'field-label' }, [
          el('span', { text: 'I have listened through Track' }),
          el('select', { onchange: e => { store.setUnlockedTrack(e.target.value); renderToday(); } },
            trackIds(state.tracks).map(id => el('option', { value: id, selected: id === unlocked, text: `${id} - ${trackTitle(id)}` })))
        ])
      ]),
      el('section', { class: 'panel' }, [
        el('h2', { text: 'Today\'s mix' }),
        el('div', { class: 'mix-list' }, [
          mixItem('Review', 'Due SRS cards first'),
          mixItem('Build', 'English thought to spoken French, then typed answer'),
          mixItem('Dictation', 'Hear French and write it accurately'),
          mixItem('Speaking', 'Fast oral production with self grading'),
          mixItem('Scenario', 'A short scripted dialogue if unlocked')
        ])
      ])
    ])
  );
}

function statPanel(label, value, detail) {
  return el('article', { class: 'stat-panel' }, [
    el('span', { class: 'eyebrow', text: label }),
    el('strong', { text: value }),
    el('p', { text: detail })
  ]);
}

function mixItem(name, detail) {
  return el('div', { class: 'mix-item' }, [el('strong', { text: name }), el('span', { text: detail })]);
}

function renderTracks() {
  setStatus(`${trackIds(state.tracks).length} tracks`);
  screen(
    el('div', { class: 'page-head' }, [
      el('span', { class: 'eyebrow', text: 'Reference' }),
      el('h1', { text: 'Track notes library' }),
      el('p', { class: 'muted', text: 'Use these notes after listening. Vocabulary is reference only; Anki remains your vocabulary system.' })
    ]),
    el('div', { class: 'track-list' }, trackIds(state.tracks).map(id => {
      const track = state.tracks[String(id)];
      return el('article', { class: 'track-row' }, [
        el('div', {}, [el('span', { class: 'track-num', text: `Track ${id}` }), el('h2', { text: track.title }), el('p', { class: 'muted', text: track.context })]),
        navButton('Open notes', `/track/${id}`, { class: 'secondary' })
      ]);
    }))
  );
}

function renderLesson(trackId) {
  const track = state.tracks[String(trackId)];
  if (!track) return renderNotFound();
  state.currentTrack = trackId;
  setStatus(`Track ${trackId}`);
  screen(
    el('div', { class: 'lesson-layout' }, [
      el('div', { class: 'page-head' }, [
        navButton('All tracks', '/tracks', { class: 'secondary' }),
        el('span', { class: 'eyebrow', text: `Track ${trackId}` }),
        el('h1', { text: track.title }),
        el('p', { class: 'muted', text: track.context }),
        el('div', { class: 'toolbar' }, [button('Practice this track', { class: 'primary', onclick: () => startTrackSession(trackId) }), button('+ Pattern review', { class: 'secondary', onclick: () => { srs.add(`p${trackId}`, { type: 'pattern', track: trackId, title: track.title, status: 'pattern' }); renderLesson(trackId); } })])
      ]),
      el('section', { class: 'panel' }, [el('h2', { text: 'Transfer principle' }), el('div', { class: 'note-body', html: safeGrammar(track.grammar) })]),
      el('section', { class: 'panel' }, [el('h2', { text: 'Useful building blocks' }), el('div', { class: 'word-grid reference-only' }, track.words.map(([fr, en]) => el('span', { class: 'word' }, [el('strong', { text: fr }), el('span', { text: en })])))]),
      el('section', { class: 'panel' }, [el('h2', { text: 'Core sentences' }), el('table', { class: 'sentences' }, el('tbody', {}, track.sentences.map(([fr, en]) => el('tr', {}, [el('td', { text: fr }), el('td', { text: en })]))))])
    ])
  );
}

function renderNotes() {
  setStatus('Notes');
  screen(
    el('div', { class: 'page-head' }, [
      el('span', { class: 'eyebrow', text: 'How to use this app' }),
      el('h1', { text: 'Practice after the audio' }),
      el('p', { class: 'muted', text: 'This app is for advanced practice and retention. Listen separately, then use this to produce, write, and keep patterns alive.' })
    ]),
    el('div', { class: 'notes-grid' }, [
      noteCard('Speak first', 'Build the sentence aloud before typing. Typing is a check, not the main act.'),
      noteCard('Type to learn the writing', 'Written French has accents, apostrophes, silent endings, and contractions. Dictation makes those visible.'),
      noteCard('Use Anki for vocabulary', 'This app keeps vocabulary as reference and spends practice time on structure and production.'),
      noteCard('Spiral old concepts', 'Daily practice pulls from all unlocked tracks, so later sessions combine old and new patterns.')
    ]),
    el('div', { class: 'toolbar' }, [navButton('Track notes', '/tracks', { class: 'primary' }), navButton('Start practice', '/session', { class: 'secondary' })])
  );
}

function noteCard(title, text) {
  return el('article', { class: 'panel note-card' }, [el('h2', { text: title }), el('p', { text })]);
}

function renderScenarios() {
  const unlocked = unlockedTrack();
  const scenarios = SCENARIOS;
  setStatus('Scenarios');
  screen(
    el('div', { class: 'page-head' }, [
      el('span', { class: 'eyebrow', text: 'Scripted dialogue' }),
      el('h1', { text: 'Scenario practice' }),
      el('p', { class: 'muted', text: 'Small deterministic dialogues from existing material. No free conversation or language model yet.' })
    ]),
    el('div', { class: 'track-list' }, scenarios.map(scenario => {
      const locked = scenario.requiredTrack > unlocked;
      return el('article', { class: `track-row ${locked ? 'locked' : ''}` }, [
        el('div', {}, [
          el('span', { class: 'track-num', text: `Track ${scenario.requiredTrack}+` }),
          el('h2', { text: scenario.title }),
          el('p', { class: 'muted', text: locked ? `Unlock by setting listened-through track to ${scenario.requiredTrack}.` : `${scenario.turns.length} turns` })
        ]),
        button(locked ? 'Locked' : 'Start', { class: locked ? 'secondary' : 'primary', disabled: locked, onclick: () => startSession(buildScenarioSession(scenario)) })
      ]);
    }))
  );
}

function renderReview() {
  const due = srs.due();
  if (!due.length) {
    setStatus('Review');
    return screen(
      el('div', { class: 'page-head' }, [
        el('span', { class: 'eyebrow', text: 'Review' }),
        el('h1', { text: 'No cards due' }),
        el('p', { class: 'muted', text: 'Add pattern reviews from track notes or miss items during practice to build retention.' }),
        navButton('Back to Today', '/', { class: 'primary' })
      ]),
      renderReviewLibrary()
    );
  }
  startSession({ id: `review:${Date.now()}`, kind: 'review', title: 'Due review', goalMinutes: 5, cards: due.map(id => ({ id: `review:${id}`, type: 'review', section: 'Review', instruction: 'Recall, reveal, then grade retention.', reviewId: id, sourceId: id })) });
}

function renderReviewLibrary() {
  const { deck, cards } = srs.all();
  return el('section', { class: 'panel' }, [
    el('h2', { text: 'Pattern review library' }),
    deck.length ? el('div', { class: 'deck-list' }, deck.map(id => {
      const details = reviewDetails(id);
      return el('article', { class: 'deck-card' }, [
        el('div', { class: 'deck-meta', text: `${details.meta} · due ${cards[id]?.due || 'today'}` }),
        el('strong', { text: details.prompt }),
        button('Remove', { class: 'secondary', onclick: () => { srs.remove(id); route(); } })
      ]);
    })) : el('p', { class: 'muted', text: 'No review items yet.' })
  ]);
}

function renderDeck() {
  setStatus('Review library');
  screen(
    el('div', { class: 'page-head' }, [
      el('span', { class: 'eyebrow', text: 'Retention' }),
      el('h1', { text: 'Pattern review' }),
      el('p', { class: 'muted', text: 'Review stores patterns and trouble spots, not vocabulary lists.' })
    ]),
    renderReviewLibrary()
  );
}

function renderResults(track) {
  const history = store.getHistory(track);
  screen(
    el('div', { class: 'page-head' }, [navButton('Back to notes', `/track/${track}`, { class: 'secondary' }), el('h1', { text: `History: Track ${track}` })]),
    history.length ? el('div', { class: 'deck-list' }, history.map(a => el('article', { class: 'deck-card' }, [el('strong', { text: `${a.pct}%` }), el('p', { class: 'muted', text: new Date(a.ts).toLocaleString() })]))) : el('p', { class: 'muted', text: 'No saved attempts yet.' })
  );
}

function renderNotFound() {
  screen(el('div', { class: 'page-head' }, [el('h1', { text: 'Not found' }), navButton('Back to Today', '/', { class: 'primary' })]));
}

function route() {
  const parsed = parseRoute();
  if (parsed.name === 'session') return renderSession();
  if (parsed.name === 'tracks') return renderTracks();
  if (parsed.name === 'track') return renderLesson(parsed.track);
  if (parsed.name === 'trackPractice') return startTrackSession(parsed.track);
  if (parsed.name === 'review') return renderReview();
  if (parsed.name === 'scenarios') return renderScenarios();
  if (parsed.name === 'notes') return renderNotes();
  if (parsed.name === 'deck') return renderDeck();
  if (parsed.name === 'results') return renderResults(parsed.track);
  return renderToday();
}

function wireGlobalEvents() {
  document.addEventListener('click', e => { const target = e.target.closest('[data-nav]'); if (target) go(target.dataset.nav); });
  addEventListener('hashchange', route);
  byId('settings-open').addEventListener('click', openSettings);
  byId('settings-close').addEventListener('click', closeSettings);
  byId('settings-modal').addEventListener('click', e => { if (e.target.id === 'settings-modal') closeSettings(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSettings();
    if (e.key === 'Enter' && state.activeSession && state.revealed) nextCard(state.feedback || {});
  });
  byId('export-progress').addEventListener('click', () => { const blob = new Blob([store.export()], { type: 'application/json' }); const a = el('a', { href: URL.createObjectURL(blob), download: 'lt-french-progress.json' }); a.click(); URL.revokeObjectURL(a.href); });
  byId('import-progress').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; if (store.import(await file.text())) { closeSettings(); route(); } else alert('Could not import progress. Choose a valid LT French progress JSON file.'); e.target.value = ''; });
  byId('reset-track').addEventListener('click', () => { if (confirm(`Reset Track ${state.currentTrack} in-progress answers?`)) { store.clearProgress(state.currentTrack); closeSettings(); route(); } });
  byId('reset-all').addEventListener('click', () => { if (confirm('Delete all local progress, history, and review data?')) { store.resetAll(); closeSettings(); route(); } });
  byId('pref-autoplay').addEventListener('change', e => store.setPreference('autoplay', e.target.checked));
  byId('pref-strict-accents').addEventListener('change', e => store.setPreference('strictAccents', e.target.checked));
}

function openSettings() {
  state.focusBeforeModal = document.activeElement;
  const data = store.load();
  const sum = store.summary();
  byId('storage-summary').textContent = `About ${sum.kb} KB stored locally · ${sum.tracks} tracks with history · ${sum.deck} review cards.`;
  byId('pref-autoplay').checked = data.preferences.autoplay;
  byId('pref-strict-accents').checked = data.preferences.strictAccents;
  byId('daily-goal').value = data.dailyGoalMinutes;
  byId('daily-goal').onchange = e => { store.setDailyGoalMinutes(e.target.value); route(); };
  byId('settings-modal').classList.remove('hidden');
  byId('settings-close').focus();
}

function closeSettings() {
  byId('settings-modal').classList.add('hidden');
  state.focusBeforeModal?.focus?.();
}

async function init() {
  wireGlobalEvents();
  try {
    const [tracks, exercises] = await Promise.all([
      fetch('data/tracks.json').then(r => r.json()),
      fetch('data/exercises.json').then(r => r.json())
    ]);
    state.tracks = tracks;
    state.exercises = exercises;
    route();
  } catch (error) {
    console.error(error);
    screen(el('div', { class: 'page-head' }, [el('h1', { text: 'Could not load course data' }), el('p', { text: 'Check that data/tracks.json and data/exercises.json are available.' })]));
  }
}

init();
