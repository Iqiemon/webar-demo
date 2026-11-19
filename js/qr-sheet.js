import { loadProducts } from './catalog.js';
import { pageUrl } from './urls.js';
import { qrSvg, renderQr } from './qr.js';
import { t, initLangToggle } from './i18n.js';

initLangToggle(document.querySelector('#lang-toggle'));

const $ = s => document.querySelector(s);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const products = await loadProducts();
const items = [
  { label: t('qr.home'), page: 'index.html' },
  { label: t('qr.showroom'), page: 'showroom.html' },
  ...products.map(p => ({ label: p.name, page: 'product.html', params: { p: p.id } })),
];

for (const it of items) {
  it.el = $('#qr-item-tpl').content.firstElementChild.cloneNode(true);
  it.el.querySelector('.qr-label').textContent = it.label;
  it.el.querySelector('.dl-svg').addEventListener('click', () => save(svgBlob(it.url), `qr-${slug(it.label)}.svg`));
  it.el.querySelector('.dl-png').addEventListener('click', async () => save(await pngBlob(it.url), `qr-${slug(it.label)}.png`));
  $('#sheet').append(it.el);
}

const input = $('#base');
input.value = new URLSearchParams(location.search).get('base') ?? new URL('.', location.href).href;
input.addEventListener('input', apply);
apply();

// Re-renders every code for the typed base; an invalid base keeps the last good codes.
function apply() {
  let ok;
  try { ok = /^https?:$/.test(new URL(input.value).protocol); } catch { ok = false; }
  $('#base-error').hidden = ok;
  if (!ok) return;
  for (const it of items) {
    it.url = pageUrl(input.value, it.page, it.params);
    it.el.querySelector('.qr-url').textContent = it.url;
    renderQr(it.el.querySelector('.qr'), it.url);
  }
}

function save(blob, name) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const svgBlob = url => new Blob([qrSvg(url)], { type: 'image/svg+xml' });

async function pngBlob(url) {
  const img = new Image();
  img.src = URL.createObjectURL(svgBlob(url));
  await img.decode();
  const canvas = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, 1024, 1024);
  URL.revokeObjectURL(img.src);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
