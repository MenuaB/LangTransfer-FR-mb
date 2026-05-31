import { el, button } from './dom.js';

export function sessionProgress(session, pos) {
  const total = session.cards.length || 1;
  const current = Math.min(pos + 1, total);
  return el('div', { class: 'session-progress', 'aria-label': `Card ${current} of ${total}` }, [
    el('div', { class: 'session-progress-top' }, [
      el('span', { text: session.title || 'Practice session' }),
      el('span', { text: `${current} / ${total}` })
    ]),
    el('div', { class: 'progress-bar' }, el('span', { style: `width:${Math.round(current / total * 100)}%` }))
  ]);
}

export function charBar(onChar) {
  const chars = ['é','è','ê','ë','à','â','î','ï','ô','ù','û','ü','ç','œ','É','À'];
  return el('div', { class: 'charbar', 'aria-label': 'French characters' }, chars.map(ch => button(ch, { onclick: () => onChar(ch) })));
}

export function gradeButtons(onGrade) {
  return el('div', { class: 'review-buttons' }, [
    button('Again', { class: 'danger', onclick: () => onGrade(1) }),
    button('Good', { class: 'secondary', onclick: () => onGrade(3) }),
    button('Easy', { class: 'secondary', onclick: () => onGrade(4) })
  ]);
}

export function cardFrame(card, children = []) {
  return el('article', { class: `practice-card practice-card-${card.type}` }, [
    el('div', { class: 'card-kicker' }, [
      el('span', { text: card.section || 'Practice' }),
      card.track ? el('span', { text: `Track ${card.track}` }) : null
    ]),
    el('p', { class: 'card-instruction', text: card.instruction || '' }),
    ...children
  ]);
}
