import { loadProducts } from './catalog.js';
import { renderQr } from './qr.js';
import { initThemeToggle } from './theme.js';

const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};

initThemeToggle(document.querySelector('#theme-toggle'));

const products = await loadProducts();

document.querySelector('#products').replaceChildren(...products.map(p =>
  el('a', { className: 'product-card', href: `product.html?p=${encodeURIComponent(p.id)}` },
    el('img', { src: p.poster, alt: '', loading: 'lazy', width: 600, height: 450 }),
    el('h3', { textContent: p.name }),
    el('p', { className: 'muted', textContent: p.tagline }),
    el('span', { className: 'card-cta', textContent: 'View in 3D & AR →' }))));

renderQr(document.querySelector('#home-qr .qr'), location.href);
document.querySelector('#credits').textContent = `Sample 3D models: ${products.map(p => `${p.name} ${p.credit}`).join(' · ')}`;
