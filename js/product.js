import { loadProducts, findProduct } from './catalog.js';
import { renderQr } from './qr.js';
import { createTour } from './tour.js';

const $ = s => document.querySelector(s);
const HOME_ORBIT = '0deg 75deg auto';

const product = findProduct(await loadProducts(), new URLSearchParams(location.search).get('p'));
if (!product) $('#not-found').hidden = false;
else show(product);

function show(product) {
  document.title = `${product.name} · WebAR Demo`;
  $('#product').hidden = false;
  $('#title').textContent = product.name;
  $('#tagline').textContent = product.tagline;
  $('#credit').textContent = `Sample 3D model: ${product.credit}`;

  const viewer = $('#viewer');
  // only a failed download; a lost WebGL context (e.g. back from iOS Quick Look) recovers on its own
  viewer.addEventListener('error', e => { if (e.detail?.type === 'loadfailure') $('#load-error').hidden = false; });
  // model-viewer reports 'failed' only after every AR mode (WebXR, Scene Viewer, Quick Look) has failed
  viewer.addEventListener('ar-status', e => { $('#ar-error').hidden = e.detail?.status !== 'failed'; });
  viewer.addEventListener('dblclick', () => {
    viewer.cameraOrbit = HOME_ORBIT;
    viewer.cameraTarget = 'auto auto auto';
    viewer.fieldOfView = 'auto';
  });
  viewer.addEventListener('load', () => {
    renderVariants(viewer);
    if (!viewer.canActivateAR) {
      renderQr($('#qr-panel .qr'), location.href);
      $('#qr-panel').hidden = false;
    }
  }, { once: true });
  renderHotspots(viewer, product.hotspots);
  if (product.hero) setupTour(viewer, product.hotspots);
  viewer.addEventListener('click', () => { $('#hotspot-card').hidden = true; });
  if (new URLSearchParams(location.search).has('pick')) enablePicker(viewer);
  if (new URLSearchParams(location.search).has('debug')) import('./debug.js').then(m => m.startDebug(viewer));
  viewer.setAttribute('alt', `3D model of ${product.name}`);
  viewer.setAttribute('poster', product.poster);
  viewer.setAttribute('src', product.model);
}

function renderVariants(viewer) {
  const box = $('#variants');
  const names = viewer.availableVariants;
  if (!names.length) return;
  const current = viewer.variantName; // null = the model's own default materials, matching no chip
  box.replaceChildren(...names.map(name => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'chip', textContent: name });
    b.dataset.variant = name;
    b.setAttribute('aria-pressed', String(name === current));
    b.addEventListener('click', () => {
      viewer.variantName = name;
      box.querySelectorAll('button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    });
    return b;
  }));
  box.hidden = false;
}

function renderHotspots(viewer, hotspots) {
  const card = $('#hotspot-card');
  hotspots.forEach((h, i) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'hotspot', slot: `hotspot-${i}`, textContent: String(i + 1) });
    b.dataset.position = h.position;
    b.dataset.normal = h.normal;
    b.setAttribute('aria-label', h.title);
    b.addEventListener('click', e => {
      e.stopPropagation(); // the viewer's click closes the card
      card.querySelector('strong').textContent = h.title;
      card.querySelector('p').textContent = h.text;
      card.hidden = false;
    });
    viewer.append(b);
  });
}

function setupTour(viewer, steps) {
  const play = $('#demo-play'), panel = $('#demo-panel');
  const tour = createTour(viewer, steps, i => {
    play.hidden = i !== null;
    panel.hidden = i === null;
    if (i !== null) $('#demo-step').textContent = `${i + 1}/${steps.length} · ${steps[i].title}: ${steps[i].text}`;
  });
  play.addEventListener('click', () => {
    $('#hotspot-card').hidden = true;
    viewer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // the caption sits on the viewer
    tour.start();
  });
  viewer.addEventListener('camera-change', e => { if (e.detail?.source === 'user-interaction') tour.pause(); });
  $('#demo-next').addEventListener('click', () => tour.next());
  $('#demo-stop').addEventListener('click', () => tour.stop());
  play.hidden = false;
}

// Dev aid for placing hotspots on new models: tap the model, copy the numbers into products.json.
function enablePicker(viewer) {
  const out = $('#pick-out');
  const fmt = v => [v.x, v.y, v.z].map(n => n.toFixed(3)).join(' ');
  viewer.addEventListener('click', e => {
    const hit = viewer.positionAndNormalFromPoint(e.clientX, e.clientY);
    if (!hit) return;
    out.textContent = `position: ${fmt(hit.position)} normal: ${fmt(hit.normal)}`;
    out.hidden = false;
  });
}
