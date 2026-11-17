import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { withPage, closeAll, isVisible, waitLoaded } from './helpers/browser.mjs';

after(closeAll);
// shortcut: posters arrive in Task 7; until then their 404s are expected. Remove this filter in Task 7.
const real = errors => errors.filter(e => !/posters\//.test(e));
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('loads sofa with AR attributes', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await waitLoaded(page);
  assert.equal(await page.$eval('#title', el => el.textContent), 'Glam Velvet Sofa');
  const attrs = await page.$eval('#viewer', el => Object.fromEntries([...el.attributes].map(a => [a.name, a.value])));
  for (const a of ['ar', 'camera-controls']) assert.ok(a in attrs, a);
  assert.equal(attrs['ar-modes'], 'webxr scene-viewer quick-look');
  assert.equal(attrs['ar-scale'], 'fixed');
  assert.equal(attrs['environment-image'], 'neutral');
  assert.equal(attrs['shadow-intensity'], '1');
  assert.equal(attrs.poster, 'posters/sofa.webp');
  assert.match(await page.$eval('#credit', el => el.textContent), /CC BY 4\.0/);
  assert.deepEqual(real(errors), []);
}));

test('no AR on desktop shows QR and hides AR button', () => withPage('/product.html?p=chair', async (page, errors) => {
  await waitLoaded(page);
  await page.waitForSelector('#qr-panel svg', { visible: true, timeout: 5000 });
  assert.equal(await isVisible(page, '#ar-button'), false);
  assert.equal(await isVisible(page, '#qr-panel .local-warning'), true); // test server is 127.0.0.1
  assert.deepEqual(real(errors), []);
}));

test('double-tap resets camera', () => withPage('/product.html?p=lamp', async (page, errors) => {
  await waitLoaded(page);
  await page.$eval('#viewer', el => { el.cameraOrbit = '90deg 30deg 2m'; el.jumpCameraToGoal(); });
  await sleep(300);
  await page.$eval('#viewer', el => el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
  await sleep(2000);
  const { theta, phi } = await page.$eval('#viewer', el => { const o = el.getCameraOrbit(); return { theta: o.theta, phi: o.phi }; });
  assert.ok(Math.abs(theta) < 0.05, `theta ${theta}`);
  assert.ok(Math.abs(phi - (75 * Math.PI) / 180) < 0.05, `phi ${phi}`);
  assert.deepEqual(real(errors), []);
}));

for (const path of ['/product.html?p=nope', '/product.html']) {
  test(`not found: ${path}`, () => withPage(path, async (page, errors) => {
    await page.waitForSelector('#not-found', { visible: true, timeout: 5000 });
    assert.equal(await page.$eval('#not-found a', a => a.getAttribute('href')), 'index.html');
    assert.equal(await isVisible(page, '#viewer'), false);
    assert.deepEqual(errors, []);
  }));
}

test('model download failure shows error', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await page.waitForSelector('#load-error', { visible: true, timeout: 10000 });
  assert.equal(await page.$eval('#load-error a', a => a.href), page.url());
  for (const e of real(errors)) assert.match(e, /ERR_FAILED|SofaGlamVelvet|GlamVelvetSofa|fetch/i, e);
}, { block: /\.glb$/ }));

test('refresh is clean', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await waitLoaded(page);
  await page.reload({ waitUntil: 'load' });
  await waitLoaded(page);
  assert.deepEqual(real(errors), []);
}));

test('variants: sofa has 5, switching works; chair 2; lamp none', async () => {
  await withPage('/product.html?p=sofa', async (page, errors) => {
    await waitLoaded(page);
    await page.waitForSelector('#variants button', { visible: true, timeout: 5000 });
    assert.deepEqual(await page.$$eval('#variants button', bs => bs.map(b => b.dataset.variant)), ['Champagne', 'Navy', 'Gray', 'Black', 'Pale Pink']);
    // before any choice, the pressed chip must match what the model shows (no variant applied → none pressed)
    const shown = await page.$eval('#viewer', el => el.variantName);
    assert.deepEqual(await page.$$eval('#variants button[aria-pressed="true"]', bs => bs.map(b => b.dataset.variant)), shown ? [shown] : []);
    await page.click('#variants button[data-variant="Navy"]');
    assert.equal(await page.$eval('#viewer', el => el.variantName), 'Navy');
    assert.equal(await page.$eval('#variants button[data-variant="Navy"]', b => b.getAttribute('aria-pressed')), 'true');
    assert.equal(await page.$eval('#variants button[data-variant="Gray"]', b => b.getAttribute('aria-pressed')), 'false');
    assert.deepEqual(real(errors), []);
  });
  await withPage('/product.html?p=chair', async page => {
    await waitLoaded(page);
    await page.waitForSelector('#variants button', { visible: true, timeout: 5000 });
    assert.equal((await page.$$('#variants button')).length, 2);
  });
  await withPage('/product.html?p=lamp', async page => {
    await waitLoaded(page);
    await sleep(300);
    assert.equal(await isVisible(page, '#variants'), false);
  });
});

test('hotspots: sofa has 4, tapping one shows its detail', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await waitLoaded(page);
  assert.equal((await page.$$('#viewer button.hotspot')).length, 4);
  assert.match(await page.$eval('#viewer button.hotspot', b => b.slot), /^hotspot-0$/);
  await page.$eval('#viewer button.hotspot', b => b.click());
  await page.waitForSelector('#hotspot-card', { visible: true, timeout: 3000 });
  assert.match(await page.$eval('#hotspot-card', el => el.textContent), /Deep velvet seat/);
  assert.deepEqual(real(errors), []);
}));

test('picker: ?pick=1 prints position and normal of the tapped point', () => withPage('/product.html?p=sofa&pick=1', async (page, errors) => {
  await waitLoaded(page);
  const box = await (await page.$('#viewer')).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.55);
  await page.waitForSelector('#pick-out', { visible: true, timeout: 3000 });
  assert.match(await page.$eval('#pick-out', el => el.textContent), /^position: -?\d+\.\d{3} -?\d+\.\d{3} -?\d+\.\d{3} normal: /);
  assert.deepEqual(real(errors), []);
}));
