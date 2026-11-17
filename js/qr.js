// Wraps the global `qrcode` from qrcode-generator (loaded by a classic <script> tag before modules run).
import { isLocalUrl } from './urls.js';

export const LOCAL_WARNING = "This QR points to a local address. Phones can't open it; use the deployed HTTPS link.";

export function qrSvg(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); // no alt/title: keeps user text out of markup
}

// Fills `el` with the QR for `url`; adds a visible warning after it when phones can't reach the URL.
export function renderQr(el, url) {
  el.innerHTML = qrSvg(url); // generated SVG only, no user text
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `QR code for ${url}`);
  if (el.nextElementSibling?.classList.contains('local-warning')) el.nextElementSibling.remove(); // re-render safe
  if (isLocalUrl(url)) el.after(Object.assign(document.createElement('p'), { className: 'local-warning', textContent: LOCAL_WARNING }));
}
