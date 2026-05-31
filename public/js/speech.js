let voices = [];
export function refreshVoices() { voices = window.speechSynthesis?.getVoices?.() || []; }
if ('speechSynthesis' in window) { refreshVoices(); window.speechSynthesis.onvoiceschanged = refreshVoices; }
export function speak(text, lang = 'fr-FR') {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = lang.startsWith('fr') ? 0.84 : 0.92;
  u.voice = voices.find(v => v.lang === lang && /natural|neural|enhanced|amelie|thomas|aurelie/i.test(v.name)) || voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0])) || null;
  window.speechSynthesis.speak(u); return true;
}
export function canRecognize() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }
export function recognizeFrench(onText, onDone) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return null;
  const r = new SR(); r.lang = 'fr-FR'; r.interimResults = true; r.maxAlternatives = 1;
  r.onresult = e => { const res = e.results[0]; onText(res[0].transcript, res.isFinal); if (res.isFinal) onDone?.(); };
  r.onerror = () => onDone?.(); r.onend = () => onDone?.(); r.start(); return r;
}
