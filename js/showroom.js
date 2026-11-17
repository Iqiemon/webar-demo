import { loadProducts, productAtX } from './catalog.js';

const $ = s => document.querySelector(s);
const DRAG_PX = 6; // pointer travel beyond this is a rotate, not a tap

const products = await loadProducts();
const room = $('#showroom'), focusViewer = $('#focus-viewer');

const isLoadFailure = e => e.detail?.type === 'loadfailure'; // not a lost WebGL context
room.addEventListener('error', e => { if (isLoadFailure(e)) $('#load-error').hidden = false; });
focusViewer.addEventListener('error', e => { if (isLoadFailure(e)) $('#focus-error').hidden = false; });
focusViewer.addEventListener('load', () => { $('#focus-error').hidden = true; });

$('#picker').replaceChildren(...products.map(p => {
  const b = Object.assign(document.createElement('button'), { type: 'button', className: 'chip', textContent: p.name });
  b.dataset.product = p.id;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => focus(p));
  return b;
}));

let down = null;
room.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
room.addEventListener('click', e => {
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > DRAG_PX) return;
  const hit = room.positionAndNormalFromPoint(e.clientX, e.clientY);
  const product = hit && productAtX(products, hit.position.x);
  if (product) focus(product);
});

function focus(p) {
  room.cameraTarget = `${p.showroom.x}m 0.4m 0m`;
  room.cameraOrbit = `0deg 70deg ${Math.max(1.6, p.showroom.halfWidth * 3)}m`;
  $('#focus-name').textContent = p.name;
  $('#focus-tagline').textContent = p.tagline;
  $('#focus-details').href = `product.html?p=${encodeURIComponent(p.id)}`;
  $('#focus-error').hidden = true;
  focusViewer.setAttribute('alt', `3D model of ${p.name}`);
  focusViewer.setAttribute('poster', p.poster);
  focusViewer.setAttribute('src', p.model);
  $('#picker').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.product === p.id)));
  $('#focus-panel').hidden = false;
  $('#focus-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // below the room on phones
}
