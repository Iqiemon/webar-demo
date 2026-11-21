import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { withPage, closeAll, isVisible, waitLoaded } from './helpers/browser.mjs';

after(closeAll);
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
  assert.deepEqual(errors, []);
}));

test('no AR on desktop shows QR and hides AR button', () => withPage('/product.html?p=chair', async (page, errors) => {
  await waitLoaded(page);
  await page.waitForSelector('#qr-panel svg', { visible: true, timeout: 5000 });
  assert.equal(await isVisible(page, '#ar-button'), false);
  assert.equal(await isVisible(page, '#qr-panel .local-warning'), true); // test server is 127.0.0.1
  assert.deepEqual(errors, []);
}));

test('double-tap resets camera', () => withPage('/product.html?p=lamp', async (page, errors) => {
  await waitLoaded(page);
  await page.$eval('#viewer', el => { el.cameraOrbit = '90deg 30deg 2m'; el.jumpCameraToGoal(); });
  await sleep(300);
  await page.$eval('#viewer', el => el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
  // the reset animates: poll until the camera settles instead of racing a fixed sleep on slow machines
  await page.waitForFunction(() => {
    const o = document.querySelector('#viewer').getCameraOrbit();
    return Math.abs(o.theta) < 0.05 && Math.abs(o.phi - (75 * Math.PI) / 180) < 0.05;
  }, { timeout: 15000, polling: 100 }).catch(() => {});
  const { theta, phi } = await page.$eval('#viewer', el => { const o = el.getCameraOrbit(); return { theta: o.theta, phi: o.phi }; });
  assert.ok(Math.abs(theta) < 0.05, `theta ${theta}`);
  assert.ok(Math.abs(phi - (75 * Math.PI) / 180) < 0.05, `phi ${phi}`);
  assert.deepEqual(errors, []);
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
  for (const e of errors) assert.match(e, /ERR_FAILED|SofaGlamVelvet|GlamVelvetSofa|fetch/i, e);
}, { block: /\.glb$/ }));

test('refresh is clean', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await waitLoaded(page);
  await page.reload({ waitUntil: 'load' });
  await waitLoaded(page);
  assert.deepEqual(errors, []);
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
    assert.deepEqual(errors, []);
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
  assert.deepEqual(errors, []);
}));

test('picker: ?pick=1 prints position and normal of the tapped point', () => withPage('/product.html?p=sofa&pick=1', async (page, errors) => {
  await waitLoaded(page);
  const box = await (await page.$('#viewer')).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.55);
  await page.waitForSelector('#pick-out', { visible: true, timeout: 3000 });
  assert.match(await page.$eval('#pick-out', el => el.textContent), /^position: -?\d+\.\d{3} -?\d+\.\d{3} -?\d+\.\d{3} normal: /);
  assert.deepEqual(errors, []);
}));

test('demo tour on the hero product only', async () => {
  await withPage('/product.html?p=sofa', async (page, errors) => {
    await waitLoaded(page);
    await page.click('#demo-play');
    await page.waitForSelector('#demo-panel', { visible: true, timeout: 3000 });
    let step = await page.$eval('#demo-step', el => el.textContent);
    assert.match(step, /1\/4/); assert.match(step, /Deep velvet seat/);
    await page.click('#demo-next');
    assert.match(await page.$eval('#demo-step', el => el.textContent), /2\/4/);
    await page.click('#demo-stop');
    assert.equal(await isVisible(page, '#demo-panel'), false);
    assert.deepEqual(errors, []);
  });
  await withPage('/product.html?p=chair', async page => {
    await waitLoaded(page);
    assert.equal(await isVisible(page, '#demo-play'), false);
  });
});

test('lost WebGL context is not reported as a load failure', () => withPage('/product.html?p=chair', async (page, errors) => {
  await waitLoaded(page);
  await page.$eval('#viewer', el => el.dispatchEvent(new CustomEvent('error', { detail: { type: 'webglcontextlost' } })));
  await sleep(200);
  assert.equal(await isVisible(page, '#load-error'), false);
  assert.deepEqual(errors, []);
}));

test('phone: demo caption is on screen and a user drag pauses the tour', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await page.setViewport({ width: 390, height: 664, isMobile: true, hasTouch: true });
  await waitLoaded(page);
  await page.$eval('#demo-play', b => b.click());
  await page.waitForSelector('#demo-step', { visible: true, timeout: 3000 });
  await sleep(800);
  const r = await page.$eval('#demo-step', el => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; });
  assert.ok(r.top >= 0 && r.bottom <= 664, `caption at ${r.top}-${r.bottom}`);
  await page.$eval('#viewer', el => el.dispatchEvent(new CustomEvent('camera-change', { detail: { source: 'user-interaction' } })));
  await sleep(4600);
  assert.match(await page.$eval('#demo-step', el => el.textContent), /^1\/4/);
  assert.deepEqual(errors, []);
}));

test('?debug=1 shows an on-screen log of environment, AR status and console output', () => withPage('/product.html?p=sofa&debug=1', async (page, errors) => {
  await waitLoaded(page);
  await page.waitForSelector('#debug-log', { visible: true, timeout: 3000 });
  await page.waitForFunction(() => /canActivateAR: false/.test(document.querySelector('#debug-log').textContent), { timeout: 5000 });
  await page.evaluate(() => { console.warn('probe-warning'); document.querySelector('#viewer').dispatchEvent(new CustomEvent('ar-status', { detail: { status: 'failed' } })); });
  const log = await page.$eval('#debug-log', el => el.textContent);
  for (const s of ['UA:', 'immersive-ar', 'quick-look', 'probe-warning', 'ar-status: failed']) assert.ok(log.includes(s), `log has ${s}`);
  assert.deepEqual(errors, []);
}));

test('AR failure on the phone shows a message instead of nothing', () => withPage('/product.html?p=sofa', async (page, errors) => {
  await waitLoaded(page);
  assert.equal(await isVisible(page, '#ar-error'), false);
  await page.$eval('#viewer', el => el.dispatchEvent(new CustomEvent('ar-status', { detail: { status: 'failed' } })));
  await page.waitForSelector('#ar-error', { visible: true, timeout: 2000 });
  assert.match(await page.$eval('#ar-error', el => el.textContent), /Google Play Services for AR/);
  await page.$eval('#viewer', el => el.dispatchEvent(new CustomEvent('ar-status', { detail: { status: 'session-started' } })));
  assert.equal(await isVisible(page, '#ar-error'), false);
  assert.deepEqual(errors, []);
}));
