#!/usr/bin/env node
// Verification harness for the WebAR demo. Starts an isolated static server, checks it is
// worth driving, and drives the real pages in headless Chrome, writing proof artifacts.
//
//   node .claude/skills/verify-webar-demo/bin/verify.mjs start
//   node .claude/skills/verify-webar-demo/bin/verify.mjs doctor
//   node .claude/skills/verify-webar-demo/bin/verify.mjs run landing
//   node .claude/skills/verify-webar-demo/bin/verify.mjs stop
//
// State lives in /tmp/webar-verify-<port>.json so a run only ever stops the server it started.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const DEFAULT_PORT = 4173;
const OUT_DIR = path.join(ROOT, 'test-output', 'verify');

const args = process.argv.slice(2);
const cmd = args[0];
const flag = name => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const port = Number(flag('port') || process.env.VERIFY_PORT || DEFAULT_PORT);
const stateFile = path.join(os.tmpdir(), `webar-verify-${port}.json`);
const outDir = path.resolve(flag('out') || OUT_DIR);
const url = `http://127.0.0.1:${port}`;

const readState = () => {
  try { return JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { return null; }
};
const alive = pid => {
  try { process.kill(pid, 0); return true; } catch { return false; }
};

// Chrome comes from the environment; puppeteer-core needs an explicit executable path.
// Never bake in this machine's path — CI points CHROME_PATH at the runner's own Chrome.
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  return candidates.find(p => fs.existsSync(p));
}

async function httpOk(p) {
  try {
    const res = await fetch(url + p);
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function start() {
  const existing = readState();
  if (existing && alive(existing.pid)) {
    console.log(`already running (pid ${existing.pid}) at ${existing.url}`);
    return;
  }
  const server = spawn(process.execPath, [path.join(ROOT, 'scripts/serve.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    detached: true,
    stdio: 'ignore',
  });
  server.unref();
  fs.writeFileSync(stateFile, JSON.stringify({ pid: server.pid, port, url, root: ROOT, startedAt: new Date().toISOString() }, null, 2));
  for (let i = 0; i < 50; i++) {
    if (await httpOk('/index.html')) {
      console.log(`started (pid ${server.pid}) at ${url}`);
      return;
    }
    await sleep(100);
  }
  console.error('server did not answer within 5s; stopping it');
  stop();
  process.exit(1);
}

function stop() {
  const state = readState();
  if (!state) {
    console.log('no server started by this harness');
    return;
  }
  if (alive(state.pid)) process.kill(state.pid, 'SIGTERM');
  fs.rmSync(stateFile, { force: true });
  console.log(`stopped pid ${state.pid}; proof artifacts are kept in ${outDir}`);
}

async function doctor() {
  const problems = [];
  const state = readState();
  if (!state) problems.push(`no state file at ${stateFile}; run start first`);
  else {
    if (state.port !== port) problems.push(`state file is for port ${state.port}, not ${port}`);
    if (!alive(state.pid)) problems.push(`pid ${state.pid} from the state file is not running`);
  }
  if (state && fs.realpathSync(state.root) !== fs.realpathSync(ROOT)) problems.push(`state file started from ${state.root}, not ${ROOT}`);
  for (const p of ['/index.html', '/product.html?p=sofa', '/showroom.html', '/qr.html', '/products.json']) {
    if (!(await httpOk(p))) problems.push(`${url}${p} did not return 200`);
  }
  const home = await httpOk('/index.html');
  if (home) {
    const body = await home.text();
    if (!body.includes('js/home.js')) problems.push('/index.html is not serving this repo (no js/home.js)');
  }
  const products = await httpOk('/products.json');
  if (products) {
    const list = await products.json().catch(() => null);
    if (!Array.isArray(list) || !list.length) problems.push('/products.json is not a non-empty array');
    else if (!list.some(p => p.id === 'sofa' && p.hero)) problems.push('/products.json has no hero sofa — the tour recipe needs it');
  }
  const chrome = chromePath();
  if (!chrome) problems.push('no Chrome found: set CHROME_PATH');
  else if (!fs.existsSync(chrome)) problems.push(`CHROME_PATH ${chrome} does not exist`);

  if (problems.length) {
    for (const p of problems) console.log(`problem: ${p}`);
    console.log(`doctor: fail (${problems.length} problem(s))`);
    process.exit(1);
  }
  console.log(`doctor: ok — ${url} serves ${ROOT}, Chrome at ${chrome}`);
}

// Opening model-viewer and the QR library needs the public CDN; a run without network cannot prove 3D.
async function openBrowser() {
  const puppeteer = (await import('puppeteer-core')).default;
  const executablePath = chromePath();
  if (!executablePath) throw new Error('no Chrome: set CHROME_PATH to the runner\'s Chrome');
  return puppeteer.launch({ executablePath, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
}

async function newPage(browser, viewport = { width: 1280, height: 800 }) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return { page, errors };
}

const loaded = (page, sel, timeout = 60000) =>
  page.waitForFunction(s => document.querySelector(s)?.loaded === true, { timeout, polling: 100 }, sel);

const visible = (page, sel) =>
  page.$eval(sel, el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden').catch(() => false);

// One share of the evidence bundle: a screenshot plus the facts asserted, in a JSON file.
async function record(name, page, facts) {
  const dir = path.join(outDir, ...name.split('/').slice(0, -1));
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(outDir, `${name}.png`) });
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({ url: page.url(), facts, at: new Date().toISOString() }, null, 2));
  console.log(`wrote ${path.relative(ROOT, path.join(outDir, `${name}.png`))} and ${name}.json`);
}

const recipes = {
  // Landing page: the product list, the showroom link and the QR code a user scans to reach a phone.
  async landing(browser) {
    const { page, errors } = await newPage(browser);
    await page.goto(url + '/index.html', { waitUntil: 'load' });
    await page.waitForSelector('#products a.product-card', { timeout: 10000 });
    await page.waitForSelector('#home-qr svg', { visible: true, timeout: 5000 });
    const facts = {
      cards: await page.$$eval('#products a.product-card', as => as.map(a => a.getAttribute('href'))),
      titles: await page.$$eval('#products .product-card h3', hs => hs.map(h => h.textContent)),
      showroomHref: await page.$eval('#showroom-link', a => a.getAttribute('href')),
      qrSheetHref: await page.$eval('#qr-sheet-link', a => a.getAttribute('href')),
      qrSvgLabels: await page.$$eval('#home-qr svg', s => s.map(x => x.getAttribute('aria-label'))),
      localWarning: await visible(page, '#home-qr .local-warning'),
      pageErrors: errors,
    };
    if (!facts.cards.length) throw new Error('no product cards rendered');
    if (!facts.qrSvgLabels.length) throw new Error('no QR code rendered on the landing page');
    if (facts.pageErrors.length) throw new Error(`page errors: ${facts.pageErrors.join('; ')}`);
    await record('landing/landing', page, facts);
  },

  // Product page: load the hero model, switch a colour variant, open a hotspot, play the tour.
  async product(browser) {
    const { page, errors } = await newPage(browser);
    await page.goto(url + '/product.html?p=sofa', { waitUntil: 'load' });
    await loaded(page, '#viewer');
    const title = await page.$eval('#title', el => el.textContent);
    await page.waitForSelector('#variants button', { visible: true, timeout: 10000 });
    const variants = await page.$$eval('#variants button', bs => bs.map(b => b.dataset.variant));
    await page.click('#variants button[data-variant="Navy"]');
    const chosen = await page.$eval('#viewer', el => el.variantName);
    const pressed = await page.$eval('#variants button[data-variant="Navy"]', b => b.getAttribute('aria-pressed'));
    await page.$eval('#viewer button.hotspot', b => b.click());
    await page.waitForSelector('#hotspot-card', { visible: true, timeout: 3000 });
    const hotspot = await page.$eval('#hotspot-card', el => el.textContent);
    await page.click('#demo-play');
    await page.waitForSelector('#demo-panel', { visible: true, timeout: 3000 });
    const step = await page.$eval('#demo-step', el => el.textContent);
    const facts = { title, variants, chosen, pressed, hotspot, step, pageErrors: errors };
    if (title !== 'Glam Velvet Sofa') throw new Error(`title was "${title}"`);
    if (chosen !== 'Navy' || pressed !== 'true') throw new Error(`variant switch did not take: ${chosen}/${pressed}`);
    if (!/Deep velvet seat/.test(hotspot)) throw new Error(`hotspot card showed "${hotspot}"`);
    if (!/^1\/4 · Deep velvet seat/.test(step)) throw new Error(`tour step was "${step}"`);
    if (facts.pageErrors.length) throw new Error(`page errors: ${facts.pageErrors.join('; ')}`);
    await record('product/product', page, facts);
  },

  // Showroom: pick each product from the panel, confirm the side viewer and its deep link follow.
  async showroom(browser) {
    const { page, errors } = await newPage(browser);
    await page.goto(url + '/showroom.html', { waitUntil: 'load' });
    await loaded(page, '#showroom');
    const picks = await page.$$eval('#picker button', bs => bs.map(b => b.dataset.product));
    const seen = [];
    for (const id of picks) {
      await page.click(`#picker button[data-product="${id}"]`);
      await page.waitForSelector('#focus-panel', { visible: true, timeout: 3000 });
      seen.push({
        id,
        name: await page.$eval('#focus-name', el => el.textContent),
        src: await page.$eval('#focus-viewer', el => el.getAttribute('src')),
        details: await page.$eval('#focus-details', a => a.getAttribute('href')),
        pressed: await page.$eval(`#picker button[data-product="${id}"]`, b => b.getAttribute('aria-pressed')),
      });
    }
    const facts = { picks, seen, pageErrors: errors };
    if (!picks.length) throw new Error('picker is empty');
    for (const s of seen) {
      if (!s.name) throw new Error(`${s.id} focused with no name`);
      if (s.details !== `product.html?p=${s.id}`) throw new Error(`${s.id} deep link was ${s.details}`);
      if (s.pressed !== 'true') throw new Error(`${s.id} chip not marked pressed`);
    }
    if (facts.pageErrors.length) throw new Error(`page errors: ${facts.pageErrors.join('; ')}`);
    await record('showroom/showroom', page, facts);
  },

  // QR sheet: every code, the base-URL rewrite, and an invalid base keeping the last good codes.
  async qr(browser) {
    const { page, errors } = await newPage(browser);
    await page.goto(url + '/qr.html', { waitUntil: 'load' });
    await page.waitForSelector('.qr-item svg', { timeout: 5000 });
    const labels = await page.$$eval('.qr-label', ls => ls.map(l => l.textContent));
    const localUrls = await page.$$eval('.qr-url', us => us.map(u => u.textContent));
    // read the local-address warning before the base URL is rewritten to a public one
    const localWarning = await visible(page, '.qr-item .local-warning');
    await page.$eval('#base', el => { el.value = 'https://demo.example.com/ar/'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const rewritten = await page.$$eval('.qr-url', us => us.map(u => u.textContent));
    await page.$eval('#base', el => { el.value = 'not a url'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    const facts = {
      labels,
      localWarning,
      rewritten,
      baseErrorShown: await visible(page, '#base-error'),
      keptAfterBadBase: await page.$$eval('.qr-url', us => us.map(u => u.textContent)),
      pageErrors: errors,
    };
    if (facts.labels.length !== localUrls.length) throw new Error('some codes have no URL');
    if (!facts.localWarning) throw new Error('local-address warning missing');
    if (!rewritten.every(u => u.startsWith('https://demo.example.com/ar/'))) throw new Error('base URL rewrite did not apply');
    if (!facts.baseErrorShown) throw new Error('invalid base URL showed no error');
    if (facts.keptAfterBadBase.join() !== rewritten.join()) throw new Error('invalid base URL replaced the last good codes');
    if (facts.pageErrors.length) throw new Error(`page errors: ${facts.pageErrors.join('; ')}`);
    await record('qr/qr', page, facts);
  },

  // Desktop visitor: no AR on this machine, so the page offers the QR bridge to a phone instead.
  async desktop(browser) {
    const { page, errors } = await newPage(browser);
    await page.goto(url + '/product.html?p=chair', { waitUntil: 'load' });
    await loaded(page, '#viewer');
    await page.waitForSelector('#qr-panel svg', { visible: true, timeout: 10000 });
    const facts = {
      arButtonVisible: await visible(page, '#ar-button'),
      qrVisible: await visible(page, '#qr-panel svg'),
      canActivateAR: await page.$eval('#viewer', el => el.canActivateAR),
      pageErrors: errors,
    };
    if (facts.canActivateAR) throw new Error('headless desktop reported AR available; the QR branch cannot be proven here');
    if (facts.arButtonVisible) throw new Error('AR button shown on a device without AR');
    if (!facts.qrVisible) throw new Error('no QR fallback shown');
    if (facts.pageErrors.length) throw new Error(`page errors: ${facts.pageErrors.join('; ')}`);
    await record('desktop/desktop', page, facts);
  },

  // Theme and language toggles on the landing page. The language button reloads the page, so each
  // click is paired with a navigation wait; both choices must then survive one more reload.
  async toggles(browser) {
    const { page, errors } = await newPage(browser);
    await page.goto(url + '/index.html', { waitUntil: 'load' });
    await page.waitForSelector('#products .product-card', { timeout: 10000 });
    const read = () => page.evaluate(() => ({ theme: document.documentElement.dataset.theme, lang: document.documentElement.lang }));
    const before = await read();
    await page.click('#theme-toggle');
    const afterTheme = await read();
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('#lang-toggle')]);
    await page.waitForSelector('#products .product-card', { timeout: 10000 });
    const afterLang = {
      ...(await read()),
      toggleLabel: await page.$eval('#lang-toggle', el => el.textContent),
      heading: await page.$eval('h1', el => el.textContent),
    };
    await page.reload({ waitUntil: 'load' });
    await page.waitForSelector('#products .product-card', { timeout: 10000 });
    const reloaded = await read();
    const facts = { before, afterTheme, afterLang, reloaded, pageErrors: errors };
    if (afterTheme.theme === before.theme) throw new Error('theme toggle did not change the theme');
    if (afterLang.lang === before.lang) throw new Error('language toggle did not change the language');
    if (!/Lihat di ruang anda/.test(afterLang.heading)) throw new Error(`heading was not translated: "${afterLang.heading}"`);
    if (afterLang.toggleLabel !== 'EN') throw new Error(`toggle label after switching was "${afterLang.toggleLabel}"`);
    if (reloaded.theme !== afterTheme.theme || reloaded.lang !== afterLang.lang) throw new Error('choices did not survive a reload');
    if (facts.pageErrors.length) throw new Error(`page errors: ${facts.pageErrors.join('; ')}`);
    await record('toggles/toggles', page, facts);
  },
};

async function run(name) {
  const recipe = recipes[name];
  if (!recipe) {
    console.error(`unknown recipe "${name}". Recipes: ${Object.keys(recipes).join(', ')}`);
    process.exit(2);
  }
  if (!readState() || !(await httpOk('/index.html'))) {
    console.error('no healthy server; run start (and doctor) first');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await openBrowser();
  try {
    await recipe(browser);
  } finally {
    await browser.close();
  }
}

try {
  if (cmd === 'start') await start();
  else if (cmd === 'stop') stop();
  else if (cmd === 'doctor') await doctor();
  else if (cmd === 'run') await run(args[1]);
  else {
    console.error('usage: verify.mjs <start|doctor|stop|run <recipe>> [--port N] [--out DIR]');
    console.error(`recipes: ${Object.keys(recipes).join(', ')}`);
    process.exit(2);
  }
} catch (e) {
  console.error(`verify: ${e.message}`);
  process.exit(1);
}
