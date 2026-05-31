export function path() { return location.hash.replace(/^#/, '') || '/'; }
export function go(target) { location.hash = `#${target}`; }

export function parseRoute(current = path()) {
  const track = current.match(/^\/track\/(\d+)$/);
  const trackPractice = current.match(/^\/track\/(\d+)\/practice$/);
  if (trackPractice) return { name: 'trackPractice', track: Number(trackPractice[1]) };
  if (track) return { name: 'track', track: Number(track[1]) };
  if (current === '/session') return { name: 'session' };
  if (current === '/tracks') return { name: 'tracks' };
  if (current === '/review') return { name: 'review' };
  if (current === '/scenarios') return { name: 'scenarios' };
  if (current === '/notes') return { name: 'notes' };
  if (current === '/deck') return { name: 'deck' };
  const results = current.match(/^\/results\/(\d+)$/);
  if (results) return { name: 'results', track: Number(results[1]) };
  return { name: 'today' };
}
