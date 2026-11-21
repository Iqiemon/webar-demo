import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { withPage, closeAll, isVisible, waitLoaded } from './helpers/browser.mjs';

after(closeAll);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const focusName = page => page.$eval('#focus-name', el => el.textContent);

test('showroom: tap or pick a product to focus it; empty space does nothing', () => withPage('/showroom.html', async (page, errors) => {
  await waitLoaded(page, '#showroom', 60000);
  assert.equal(await isVisible(page, '#focus-panel'), false);
  assert.deepEqual(await page.$$eval('#picker button', bs => bs.map(b => b.dataset.product)), ['sofa', 'chair', 'lamp', 'table', 'loveseat']);

  const box = await (await page.$('#showroom')).boundingBox();
  // Sample the canvas for a point that actually lands on the sofa, instead of assuming the centre
  // is one: the default camera framing depends on the merged scene's bounds.
  const sofa = await page.$eval('#showroom', (el, box) => {
    for (let fy = 0.4; fy <= 0.7; fy += 0.05) {
      for (let fx = 0.3; fx <= 0.7; fx += 0.02) {
        const x = box.x + box.width * fx, y = box.y + box.height * fy;
        const hit = el.positionAndNormalFromPoint(x, y);
        if (hit && Math.abs(hit.position.x) <= 1.1) return { x, y };
      }
    }
    return null;
  }, box);
  assert.ok(sofa, 'found a point on the sofa');

  // a drag that ends over a product is a rotate, not a tap: the click browsers fire after it must not focus
  await page.$eval('#showroom', (el, cx, cy) => {
    const ev = (type, x) => new PointerEvent(type, { clientX: x, clientY: cy, bubbles: true, pointerId: 1, isPrimary: true });
    el.dispatchEvent(ev('pointerdown', cx + 200));
    el.dispatchEvent(ev('pointerup', cx));
    el.dispatchEvent(new MouseEvent('click', { clientX: cx, clientY: cy, bubbles: true }));
  }, sofa.x, sofa.y);
  await sleep(300);
  assert.equal(await isVisible(page, '#focus-panel'), false);

  // tap the sofa first: focusing moves the camera, so later hit points would no longer apply
  await page.mouse.click(sofa.x, sofa.y);
  await page.waitForSelector('#focus-panel', { visible: true, timeout: 3000 });
  assert.equal(await focusName(page), 'Glam Velvet Sofa');

  await page.click('#picker button[data-product="chair"]');
  assert.equal(await focusName(page), 'Sheen Lounge Chair');
  assert.match(await page.$eval('#focus-viewer', el => el.getAttribute('src')), /models\/SheenChair\.glb$/);
  assert.equal(await page.$eval('#focus-details', a => a.getAttribute('href')), 'product.html?p=chair');
  assert.match(await page.$eval('#showroom', el => String(el.cameraTarget)), /^-1\.75m/);
  assert.equal(await page.$eval('#picker button[data-product="chair"]', b => b.getAttribute('aria-pressed')), 'true');
  assert.equal(await page.$eval('#focus-viewer button[slot="ar-button"]', b => b.textContent.trim()), 'View in your space');

  await sleep(1500); // let the camera settle on the chair
  await page.mouse.click(box.x + 5, box.y + 5); // sky
  await sleep(300);
  assert.equal(await focusName(page), 'Sheen Lounge Chair');
  assert.deepEqual(errors, []);
}));

test('phone: focusing a product brings the panel on screen', () => withPage('/showroom.html', async (page, errors) => {
  await page.setViewport({ width: 390, height: 664, isMobile: true, hasTouch: true });
  await waitLoaded(page, '#showroom', 60000);
  await page.$eval('#picker button[data-product="lamp"]', b => b.click());
  await page.waitForFunction(() => {
    const top = document.querySelector('#focus-name').getBoundingClientRect().top;
    return top >= 0 && top < innerHeight;
  }, { timeout: 10000 });
  assert.deepEqual(errors, []);
}));

test('focus viewer shows an error when its model fails, and clears it on the next product', () => withPage('/showroom.html', async page => {
  await waitLoaded(page, '#showroom', 60000);
  await page.click('#picker button[data-product="chair"]');
  await page.waitForSelector('#focus-error', { visible: true, timeout: 10000 });
  await page.click('#picker button[data-product="lamp"]');
  await waitLoaded(page, '#focus-viewer', 30000);
  assert.equal(await isVisible(page, '#focus-error'), false);
}, { block: /SheenChair\.glb$/ }));

test('showroom: AR failure in the side viewer shows a message', () => withPage('/showroom.html', async (page, errors) => {
  await waitLoaded(page, '#showroom', 60000);
  await page.click('#picker button[data-product="lamp"]');
  await page.$eval('#focus-viewer', el => el.dispatchEvent(new CustomEvent('ar-status', { detail: { status: 'failed' } })));
  await page.waitForSelector('#focus-ar-error', { visible: true, timeout: 2000 });
  await page.click('#picker button[data-product="chair"]'); // a new product starts clean
  assert.equal(await isVisible(page, '#focus-ar-error'), false);
  assert.deepEqual(errors, []);
}));
