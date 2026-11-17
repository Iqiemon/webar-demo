// On-screen diagnostics for real-device AR testing: add ?debug=1 to a product URL, tap AR, screenshot the panel.
export function startDebug(viewer) {
  const log = Object.assign(document.createElement('pre'), { id: 'debug-log', className: 'debug-log' });
  document.body.append(log);
  const add = msg => { log.textContent += `${new Date().toISOString().slice(11, 19)} ${msg}\n`; log.scrollTop = log.scrollHeight; };
  const fmt = args => args.map(a => (a instanceof Error ? `${a.name}: ${a.message}` : typeof a === 'object' ? safeJson(a) : String(a))).join(' ');

  for (const level of ['log', 'warn', 'error']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => { add(`[${level}] ${fmt(args)}`); orig(...args); };
  }
  addEventListener('error', e => add(`[window error] ${e.message}`));
  addEventListener('unhandledrejection', e => add(`[unhandled rejection] ${fmt([e.reason])}`));
  for (const type of ['ar-status', 'ar-tracking']) viewer.addEventListener(type, e => add(`${type}: ${e.detail?.status ?? safeJson(e.detail)}`));
  viewer.addEventListener('error', e => add(`viewer error: ${e.detail?.type ?? ''} ${fmt([e.detail?.sourceError ?? ''])}`));

  add(`UA: ${navigator.userAgent}`);
  add(`secure context: ${isSecureContext}, ar-modes: ${viewer.getAttribute('ar-modes')}`);
  const a = document.createElement('a');
  add(`quick-look (a.relList supports "ar"): ${Boolean(a.relList?.supports?.('ar'))}`);
  (navigator.xr ? navigator.xr.isSessionSupported('immersive-ar') : Promise.resolve('no navigator.xr'))
    .then(v => add(`webxr immersive-ar supported: ${v}`), e => add(`webxr immersive-ar check failed: ${e.message}`));
  viewer.addEventListener('load', () => add(`model loaded; canActivateAR: ${viewer.canActivateAR}`), { once: true });
  if (viewer.loaded) add(`canActivateAR: ${viewer.canActivateAR}`);
}

function safeJson(v) {
  try { return JSON.stringify(v); } catch { return String(v); }
}
