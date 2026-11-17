import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { withPage, closeAll, isVisible } from './helpers/browser.mjs';

after(closeAll);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test('landing lists products, showroom and QR', () => withPage('/', async (page, errors) => {
  await page.waitForSelector('#products .product-card', { timeout: 5000 });
  assert.deepEqual(await page.$$eval('#products a.product-card', as => as.map(a => a.getAttribute('href'))),
    ['product.html?p=sofa', 'product.html?p=chair', 'product.html?p=lamp']);
  assert.equal((await page.$$('#products .product-card img')).length, 3);
  assert.equal(await page.$eval('#showroom-link', a => a.getAttribute('href')), 'showroom.html');
  assert.equal(await page.$eval('#qr-sheet-link', a => a.getAttribute('href')), 'qr.html');
  await page.waitForSelector('#home-qr svg', { visible: true, timeout: 5000 });
  assert.equal(await isVisible(page, '#home-qr .local-warning'), true);
  assert.deepEqual(errors, []);
}));

test('qr sheet: 5 codes, base URL rewrites them, bad base is handled', () => withPage('/qr.html', async (page, errors) => {
  await page.waitForSelector('.qr-item svg', { timeout: 5000 });
  assert.equal((await page.$$('.qr-item')).length, 5);
  assert.deepEqual(await page.$$eval('.qr-label', ls => ls.map(l => l.textContent)), ['Home', 'Showroom', 'Glam Velvet Sofa', 'Sheen Lounge Chair', 'Iridescent Table Lamp']);
  assert.match(await page.$eval('.qr-url', el => el.textContent), /\/index\.html$/);
  assert.equal(await isVisible(page, '.qr-item .local-warning'), true);

  await page.$eval('#base', el => { el.value = 'https://demo.example.com/ar/'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await page.$eval('.qr-item:nth-child(3) .qr-url', el => el.textContent), 'https://demo.example.com/ar/product.html?p=sofa');
  assert.equal(await isVisible(page, '.qr-item .local-warning'), false);

  await page.$eval('#base', el => { el.value = 'not a url'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.equal(await isVisible(page, '#base-error'), true);
  assert.equal(await page.$eval('.qr-item:nth-child(3) .qr-url', el => el.textContent), 'https://demo.example.com/ar/product.html?p=sofa');
  assert.deepEqual(errors, []);
}));

test('qr sheet: ?base= preset and SVG/PNG downloads', () => withPage('/qr.html?base=https://demo.example.com/', async (page, errors) => {
  await page.waitForSelector('.qr-item svg', { timeout: 5000 });
  assert.equal(await page.$eval('#base', el => el.value), 'https://demo.example.com/');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qr-dl-'));
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir });
  await page.click('.qr-item:nth-child(1) .dl-svg');
  await page.click('.qr-item:nth-child(1) .dl-png');
  for (let i = 0; i < 50 && fs.readdirSync(dir).filter(f => /\.(svg|png)$/.test(f)).length < 2; i++) await sleep(100);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['qr-home.png', 'qr-home.svg']);
  assert.match(fs.readFileSync(path.join(dir, 'qr-home.svg'), 'utf8'), /^<svg/);
  assert.deepEqual([...fs.readFileSync(path.join(dir, 'qr-home.png')).subarray(1, 4)].map(c => String.fromCharCode(c)).join(''), 'PNG');
  assert.deepEqual(errors, []);
}));
