import { loadProducts, findProduct } from './catalog.js';
import { renderQr } from './qr.js';

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
  viewer.addEventListener('error', () => { $('#load-error').hidden = false; });
  viewer.addEventListener('dblclick', () => {
    viewer.cameraOrbit = HOME_ORBIT;
    viewer.cameraTarget = 'auto auto auto';
    viewer.fieldOfView = 'auto';
  });
  viewer.addEventListener('load', () => {
    if (!viewer.canActivateAR) {
      renderQr($('#qr-panel .qr'), location.href);
      $('#qr-panel').hidden = false;
    }
  }, { once: true });
  viewer.setAttribute('alt', `3D model of ${product.name}`);
  viewer.setAttribute('poster', product.poster);
  viewer.setAttribute('src', product.model);
}
