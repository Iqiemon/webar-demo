// Headless Chrome harness for page smoke tests. Needs internet: pages load model-viewer from its CDN.
import puppeteer from 'puppeteer-core';
import { startServer } from '../../scripts/serve.mjs';

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let server, browser;

export async function withPage(path, fn, { block } = {}) {
  server ??= await startServer({ port: 0, host: '127.0.0.1' });
  // A Chrome that crashed ("Connection closed.") is replaced, so one crash fails one test instead of hanging the rest.
  if (!browser?.connected) {
    browser?.process()?.kill('SIGKILL');
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-dev-shm-usage'] });
  }
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${m.text()} ${m.location()?.url ?? ''}`.trim()); });
  if (block) {
    await page.setRequestInterception(true);
    page.on('request', r => (block.test(r.url()) ? r.abort() : r.continue()));
  }
  try {
    await page.goto(server.url + path, { waitUntil: 'load' });
    await fn(page, errors);
  } finally {
    await page.close();
  }
}

export async function closeAll() {
  // close() on a dead or wedged Chrome can wait forever; give it 5 s, then kill the process.
  const b = browser;
  if (b) await Promise.race([b.close().catch(() => {}), new Promise((r) => setTimeout(r, 5000).unref())]);
  b?.process()?.kill('SIGKILL');
  await server?.close();
  browser = server = undefined;
}

export const isVisible = (page, sel) =>
  page.$eval(sel, el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden').catch(() => false);

export const waitLoaded = (page, sel = '#viewer', timeout = 30000) =>
  page.waitForFunction(s => document.querySelector(s)?.loaded === true, { timeout }, sel);
