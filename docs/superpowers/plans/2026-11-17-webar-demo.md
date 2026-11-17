# WebAR Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, phone-browser WebAR demo of three products that covers all seven features in the spec: QR launch, 3D view, AR placement, interaction, hero demonstration, showroom and mobile.

**Architecture:** Plain HTML pages with ES modules and no bundler. Google `<model-viewer>` handles 3D, AR, variants, hotspots and animation. `products.json` is the only data source. Pure logic lives in small modules that are unit-tested with `node:test`. Pages are smoke-tested in headless Chrome through `puppeteer-core`. The showroom is a single GLB, merged at build time with glTF-Transform and shown in one `<model-viewer>`, so the spec's "one 3D scene" holds without adding Three.js.

**Tech Stack:** model-viewer 4.0.0 (`https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js`, `type="module"`), qrcode-generator 1.4.4 (`https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js`, global `qrcode`), Node 26 (`node:test`, `node:http`). Dev-only: `puppeteer-core`, `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`.

**Spec:** `docs/spec.md` (copy of https://claude.ai/artifact/4i1b2aotcQuibYccNAr3jf)

## Global Constraints

- Runs in the phone browser with no app install. No backend: products are defined in `products.json` only.
- Per product: one GLB "under about 5 MB". `scripts/check-products.mjs` fails above 5 × 1024 × 1024 bytes.
- Each product loads in under about 3 seconds on 4G.
- AR buttons are labelled exactly `View in your space`.
- AR modes are `webxr scene-viewer quick-look`. Use `ar-scale="fixed"` so products always show at real-world size.
- iPhone USDZ: there are no separate USDZ files. model-viewer generates USDZ from the GLB when Quick Look opens. This deviates from spec §5; if generation proves unreliable on a real iPhone in Task 8, export USDZ files and set `ios-src`.
- Hosted over HTTPS (required for AR). Scene Viewer downloads the GLB itself, so Android AR only works from a public HTTPS URL, not localhost.
- Sample models are in `models/` already: GlamVelvetSofa (2.19 m wide, variants `Champagne, Navy, Gray, Black, Pale Pink`), SheenChair (0.83 m wide, variants `Mango Velvet, Peacock Velvet`), IridescenceLamp (0.48 m tall, no variants). None has animations. They're Wayfair sample assets: show each product's `credit` string in the page footer, and label them as samples (spec §5).
- Out of scope: admin panel, analytics, walkable showroom, native app, checkout, large catalogue.
- Git: the folder is not a repo yet. Commit steps apply only if the user agrees to `git init`.

## Review Focus

1. **Unknown or missing `?p=` on product.html:** show a "Product not found" message with a link home, never a blank page or a console error. (Task 2 smoke test)
2. **Desktop or any device without AR:** the AR button is hidden, and a QR panel for the same product URL is visible. (Task 2 smoke test: headless Chrome has no AR)
3. **A QR made while serving from localhost or a LAN address:** phones can't open it. Show a visible warning beside every QR whose URL is local. (Task 1 `isLocalUrl` tests; Task 5 smoke test)
4. **Model download fails (404, dropped 4G):** replace the spinner with a visible error message and a retry link, not an endless loader. (Task 2 smoke test with the GLB request aborted)
5. **Tapping empty floor or sky in the showroom:** nothing changes, nothing throws. (Task 1 `productAtX` tests; Task 6 smoke test)

---

## File Map

| File | Responsibility |
| --- | --- |
| `package.json` | `type: module`, scripts `start`, `test`, `check`, `build:showroom`, `posters`, dev deps |
| `products.json` | Product data (exists; Task 1 adds `showroom.halfWidth`) |
| `js/catalog.js` | Load, find and validate products; showroom hit test |
| `js/urls.js` | Build page URLs; detect local URLs |
| `js/qr.js` | `qrSvg(text)` wrapper over the global `qrcode` |
| `js/tour.js` | Hero demonstration step controller (viewer injected) |
| `js/product.js`, `product.html` | Product viewer page |
| `js/home.js`, `index.html` | Landing page |
| `js/qr-sheet.js`, `qr.html` | Printable QR sheet with SVG and PNG download |
| `js/showroom.js`, `showroom.html` | Showroom page |
| `css/style.css` | Shared mobile-first styles |
| `scripts/serve.mjs` | Static dev server (also used by tests) |
| `scripts/check-products.mjs` | Validates `products.json` and the asset files |
| `scripts/build-showroom.mjs` | Merges the product GLBs into `models/showroom.glb` |
| `scripts/make-posters.mjs` | Renders `posters/<id>.webp` from the product pages |
| `tests/*.test.mjs` | Unit and smoke tests; `tests/helpers/browser.mjs` is the puppeteer harness |

`Product` shape (from `products.json`): `{ id, name, tagline, model, poster, credit, hero?: boolean, showroom: { x, rotY, halfWidth }, hotspots: [{ title, text, position: "x y z", normal: "x y z", orbit?: "<θ>deg <φ>deg <r>m" }] }`.

---

### Task 1: Project setup, catalog and URL helpers

**Files:**
- Create: `package.json`, `js/catalog.js`, `js/urls.js`, `scripts/check-products.mjs`
- Modify: `products.json`: add `halfWidth` to each `showroom` block (sofa `1.1`, chair `0.5`, lamp `0.16`)
- Test: `tests/catalog.test.mjs`, `tests/urls.test.mjs`

**Interfaces:**
- Produces (`js/catalog.js`):
  - `loadProducts(url = 'products.json'): Promise<Product[]>`. Throws `Error('Could not load products (<status>)')` when the response isn't ok.
  - `findProduct(products, id): Product | undefined`
  - `validateProducts(products): string[]`. Returns readable error strings; an empty array means valid.
  - `productAtX(products, x: number): Product | null`
- Produces (`js/urls.js`):
  - `pageUrl(base: string, page: string, params: Record<string,string> = {}): string`
  - `isLocalUrl(url: string): boolean`

- [ ] **Step 1: Create `package.json`** with `"type": "module"` and these scripts: `"start": "node scripts/serve.mjs"`, `"test": "node --test tests/"`, `"check": "node scripts/check-products.mjs"`, `"build:showroom": "node scripts/build-showroom.mjs"`, `"posters": "node scripts/make-posters.mjs"`. Run `npm i -D puppeteer-core @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions`. Add `"halfWidth"` to each `showroom` block in `products.json` (sofa `1.1`, chair `0.5`, lamp `0.16`).

- [ ] **Step 2: Write the failing tests**

```js
// tests/catalog.test.mjs
import { test } from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';
import { findProduct, validateProducts, productAtX } from '../js/catalog.js';
const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

test('real products.json is valid', () => assert.deepEqual(validateProducts(products), []));
test('findProduct', () => { assert.equal(findProduct(products, 'chair').name, 'Sheen Lounge Chair'); assert.equal(findProduct(products, 'nope'), undefined); });
test('validate catches bad data', () => {
  const bad = structuredClone(products);
  bad[1].id = 'sofa';                      // duplicate id
  bad[0].hotspots[0].position = '0 1';     // 2 numbers
  bad[0].hotspots[0].orbit = 'left';       // bad orbit
  bad[2].showroom.halfWidth = 0;           // must be > 0
  bad[2].hero = true;                      // two heroes
  const errs = validateProducts(bad).join('\n');
  for (const s of ['duplicate id "sofa"', 'position', 'orbit', 'halfWidth', 'hero']) assert.match(errs, new RegExp(s));
  assert.deepEqual(validateProducts([]), ['products.json must be a non-empty array']);
});
test('productAtX maps x to product, gaps to null', () => {
  assert.equal(productAtX(products, 0).id, 'sofa');
  assert.equal(productAtX(products, -1.05).id, 'sofa');   // sofa arm, nearer chair centre than sofa centre
  assert.equal(productAtX(products, -1.75).id, 'chair');
  assert.equal(productAtX(products, 1.6).id, 'lamp');
  assert.equal(productAtX(products, 1.35), null);         // floor between sofa and lamp
  assert.equal(productAtX(products, 9), null);
  assert.equal(productAtX(products, NaN), null);
});
```

```js
// tests/urls.test.mjs
import { test } from 'node:test'; import assert from 'node:assert/strict';
import { pageUrl, isLocalUrl } from '../js/urls.js';
test('pageUrl', () => {
  assert.equal(pageUrl('https://demo.example.com/ar/', 'product.html', { p: 'sofa' }), 'https://demo.example.com/ar/product.html?p=sofa');
  assert.equal(pageUrl('https://demo.example.com/ar/index.html', 'showroom.html'), 'https://demo.example.com/ar/showroom.html');
});
test('isLocalUrl', () => {
  for (const u of ['http://localhost:8080/', 'http://127.0.0.1/', 'http://[::1]/', 'http://192.168.1.20/', 'http://10.0.0.5/', 'http://172.20.1.1/', 'http://mypc.local/']) assert.equal(isLocalUrl(u), true, u);
  for (const u of ['https://demo.example.com/', 'http://172.32.0.1/', 'https://8.8.8.8/']) assert.equal(isLocalUrl(u), false, u);
});
```

- [ ] **Step 3: Run `npm test` to verify it fails.** Expected: FAIL, cannot find module `js/catalog.js`.

- [ ] **Step 4: Implement `js/catalog.js` and `js/urls.js`** to the signatures above. Validation rules:
  - Ids are unique and match `^[a-z0-9-]+$`.
  - `name`, `tagline`, `poster` and `credit` are non-empty strings, and `model` ends in `.glb`.
  - `showroom.x` and `rotY` are finite numbers, and `halfWidth` is greater than 0.
  - `position` and `normal` are exactly 3 space-separated numbers.
  - `orbit`, when present, matches `^-?\d+(\.\d+)?deg -?\d+(\.\d+)?deg \d+(\.\d+)?m$`.
  - At most one product has `hero: true`.

  Each error string names the product id and the field. `productAtX` returns the product whose `|x − showroom.x| ≤ showroom.halfWidth`. If several match, it returns the nearest centre. `isLocalUrl` covers `localhost`, `*.local`, `127/8`, `10/8`, `192.168/16`, `172.16/12` and `::1`.

- [ ] **Step 5: Run `npm test` to verify it passes.** Expected: all pass.

- [ ] **Step 6: Implement `scripts/check-products.mjs`.** It runs `validateProducts` and checks that every `model` file exists and is at most 5 × 1024 × 1024 bytes; either failure is an error. A missing `poster` file is only a warning until Task 7. It prints one line per problem and exits with code 1 on any error. Run `npm run check`. Expected: three `poster missing` warnings and exit code 0.

- [ ] **Step 7: Commit** (if git is enabled): `git add -A && git commit -m "feat: catalog, url helpers, product check"`

---

### Task 2: Dev server, smoke harness and product page

**Files:**
- Create: `scripts/serve.mjs`, `tests/helpers/browser.mjs`, `js/qr.js`, `product.html`, `js/product.js`, `css/style.css`
- Test: `tests/serve.test.mjs`, `tests/product.smoke.test.mjs`

**Interfaces:**
- Consumes: `loadProducts`, `findProduct` (Task 1); `isLocalUrl` (Task 1)
- Produces:
  - `startServer({ port = 8080, root = process.cwd(), host = '0.0.0.0' } = {}): Promise<{ url: string, close(): Promise<void> }>`. Pass `port: 0` for a random port. Running it from the CLI prints the URL.
  - `withPage(path: string, fn: (page, errors: string[]) => Promise<void>, opts?: { block?: RegExp }): Promise<void>`. Starts a shared server and launches Chrome from `CHROME_PATH` or `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless, with `--enable-unsafe-swiftshader`. `errors` collects `pageerror` events and `console.error` messages. Requests matching `block` are aborted.
  - `qrSvg(text: string): string`. Returns an SVG string (type 0, error level `M`, cell size 4, margin 2), using `createSvgTag`.
  - Product page DOM contract:
    - `#viewer` (model-viewer), `#title`, `#tagline`, `#credit`
    - `#not-found`, `#load-error` (with a retry link to the same URL)
    - `#qr-panel` (contains the QR SVG and `.local-warning` when the URL is local)
    - `#ar-button` (the `slot="ar-button"` child of `#viewer`, text `View in your space`)

- [ ] **Step 1: Write the failing tests**

```js
// tests/serve.test.mjs: start on port 0
//  GET /products.json → 200, content-type starts with application/json
//  GET /models/SheenChair.glb → 200, content-type model/gltf-binary
//  GET /nope.html → 404
//  GET /..%2f..%2fWindows/win.ini → 404 (no escape from root)
```

```js
// tests/product.smoke.test.mjs (each case uses withPage; every case ends with assert.deepEqual(errors, []))
// 'loads sofa': goto /product.html?p=sofa; wait for viewer.loaded === true (timeout 30s);
//    #title text 'Glam Velvet Sofa'; viewer attrs: ar, ar-modes 'webxr scene-viewer quick-look', ar-scale 'fixed', camera-controls,
//    environment-image 'neutral', shadow-intensity '1', poster 'posters/sofa.webp'; #credit contains 'CC BY 4.0'
// 'no AR on desktop shows QR': #qr-panel visible and contains <svg; #ar-button not visible
// 'local URL warning': #qr-panel .local-warning visible (the test server is localhost)
// 'double-tap resets camera': viewer.cameraOrbit = '90deg 30deg 2m'; wait 1s; dispatch dblclick on #viewer; wait 1.5s;
//    getCameraOrbit().theta within 0.05 of 0 and phi within 0.05 of 75° in radians (1.309)
// 'unknown product': /product.html?p=nope → #not-found visible with link href 'index.html'; #viewer absent or hidden
// 'missing p': /product.html → same as unknown
// 'model fails': block /\.glb$/ → #load-error visible within 10s (model-viewer 'error' event); errors may contain only the aborted request
// 'refresh is clean': load sofa, page.reload(), viewer loads again, errors []
```

- [ ] **Step 2: Run `npm test` to verify the new tests fail.** Expected: FAIL, `scripts/serve.mjs` not found.

- [ ] **Step 3: Implement `scripts/serve.mjs`.** It's a `node:http` static server. MIME types:
  - `.html` → `text/html`
  - `.js` / `.mjs` → `text/javascript`
  - `.css` → `text/css`
  - `.json` → `application/json`
  - `.glb` → `model/gltf-binary`
  - `.webp` → `image/webp`
  - `.png` → `image/png`
  - `.svg` → `image/svg+xml`

  Resolve the decoded path against `root` and return 404 when it falls outside `root`. `/` serves `index.html`.

- [ ] **Step 4: Implement `tests/helpers/browser.mjs`** to the `withPage` interface.

- [ ] **Step 5: Implement `js/qr.js`, `product.html`, `js/product.js` and `css/style.css`.**
  - `product.html` loads model-viewer and qrcode-generator from the CDN URLs in Tech Stack.
  - `product.js` reads `?p=`, then fills the title, tagline, credit and viewer `src`/`poster`/`alt`. It sets these viewer attributes: `ar`, `ar-modes`, `ar-scale="fixed"`, `camera-controls`, `touch-action="pan-y"`, `camera-orbit="0deg 75deg auto"`, `environment-image="neutral"`, `shadow-intensity="1"`.
  - Show model-viewer's default progress bar while loading.
  - `error` event → show `#load-error`.
  - `dblclick` → reset to `cameraOrbit '0deg 75deg auto'`, `cameraTarget 'auto auto auto'`, `fieldOfView 'auto'`.
  - After `load`: if `!viewer.canActivateAR`, show `#qr-panel` with `qrSvg(location.href)`, plus `.local-warning` ("This QR points to a local address. Phones can't open it; use the deployed HTTPS link.") when `isLocalUrl(location.href)`.
  - Style it mobile first: viewer at full width and `70vh` on phones; a studio background gradient (`#f4f4f2` → `#e2e2df`). Add a header link back to `index.html`, plus a "Sample model" label.

- [ ] **Step 6: Run `npm test` to verify it passes.** Expected: all pass.

- [ ] **Step 7: Commit:** `feat: dev server, smoke harness, product page`

---

### Task 3: Variants, hotspots and hotspot picker

**Files:**
- Modify: `js/product.js`, `product.html`, `css/style.css`
- Test: `tests/product.smoke.test.mjs` (add cases)

**Interfaces:**
- Consumes: product page from Task 2
- Produces:
  - DOM: `#variants` (hidden when there are none) containing `button[data-variant]` with `aria-pressed`.
  - Hotspots: `button.hotspot[slot="hotspot-<i>"]` with `data-position` and `data-normal`.
  - `#hotspot-card` (title and text, closes when the viewer is tapped).
  - `?pick=1` shows `#pick-out`.

- [ ] **Step 1: Write the failing tests** (add to the product smoke tests)

```js
// 'variants': sofa → 5 buttons in order Champagne, Navy, Gray, Black, Pale Pink; click 'Navy' → viewer.variantName === 'Navy', its aria-pressed 'true'
//             chair → 2 buttons; lamp → #variants hidden
// 'hotspots': sofa → 4 .hotspot buttons; click the first → #hotspot-card visible containing 'Deep seat cushions'
// 'picker': /product.html?p=sofa&pick=1, click viewer centre → #pick-out matches /^position: -?\d+\.\d{3} -?\d+\.\d{3} -?\d+\.\d{3} normal: /
```

- [ ] **Step 2: Run the tests to verify they fail.**

- [ ] **Step 3: Implement.**
  - Variants: build the buttons from `viewer.availableVariants` after `load`; clicking one sets `viewer.variantName`.
  - Hotspots: build them from `product.hotspots` as model-viewer hotspot slots (button text = index + 1); clicking one fills `#hotspot-card`.
  - Picker: on `click`, call `viewer.positionAndNormalFromPoint(e.clientX, e.clientY)`; when the result isn't null, write the position and normal rounded to 3 decimal places. This lets someone place hotspots on the client's real models later.

- [ ] **Step 4: Run the tests to verify they pass.**

- [ ] **Step 5: Check the hotspot positions by eye.** Open each product with `?pick=1`, take screenshots (`npm start`, then a browser), and correct any `position`/`normal` in `products.json` that doesn't sit on the surface it names. Re-run `npm test`.

- [ ] **Step 6: Commit:** `feat: variants, hotspots, picker`

---

### Task 4: Hero demonstration tour

**Files:**
- Create: `js/tour.js`
- Modify: `js/product.js`, `product.html`, `css/style.css`
- Test: `tests/tour.test.mjs`, `tests/product.smoke.test.mjs` (add a case)

**Interfaces:**
- Consumes: `product.hotspots` (each has `position` and an optional `orbit`)
- Produces:
  - `createTour(viewer, steps, onStep: (index: number | null) => void, { intervalMs = 4000 } = {}): { start(), next(), stop() }`
  - DOM, only when `product.hero`: `#demo-play`, plus `#demo-panel` containing `#demo-step`, `#demo-next` and `#demo-stop`

- [ ] **Step 1: Write the failing tests**

```js
// tests/tour.test.mjs: fake viewer = { cameraTarget:'', cameraOrbit:'', availableAnimations:[], animationName:'', play(o){this.played=o} }; use mock.timers
// start() → onStep(0); viewer.cameraTarget === '0m 0.47m 0.02m'; viewer.cameraOrbit === steps[0].orbit
// a step without orbit → cameraOrbit 'auto auto auto'
// advance timers 4000 → onStep(1); next() → onStep(2)
// next() past the last step → onStep(null), cameraTarget 'auto auto auto', cameraOrbit '0deg 75deg auto', timer cleared
// stop() mid-tour → onStep(null), same reset, no further onStep after advancing 10000
// availableAnimations ['Open'] → start() sets animationName 'Open' and play called with { repetitions: 1 }
```

```js
// product smoke: 'demo': sofa has #demo-play, chair does not; click #demo-play → #demo-step contains '1/4' and 'Deep seat cushions';
//   click #demo-next → '2/4'; click #demo-stop → #demo-panel hidden
```

- [ ] **Step 2: Run the tests to verify they fail.**

- [ ] **Step 3: Implement `createTour`** (convert `"x y z"` to `"xm ym zm"` for `cameraTarget`), then wire up the UI in `product.js`. `#demo-step` text is `${i+1}/${n} · ${title}: ${text}`. Opening a tour hides `#hotspot-card`.

- [ ] **Step 4: Run the tests to verify they pass.**

- [ ] **Step 5: Commit:** `feat: hero demonstration tour`

---

### Task 5: Landing page and printable QR sheet

**Files:**
- Create: `index.html`, `js/home.js`, `qr.html`, `js/qr-sheet.js`
- Modify: `css/style.css`
- Test: `tests/pages.smoke.test.mjs`

**Interfaces:**
- Consumes: `loadProducts`, `pageUrl`, `isLocalUrl`, `qrSvg`
- Produces:
  - Landing: `#products` containing `a.product-card[href="product.html?p=<id>"]` (each with `img` poster, name and tagline); `a#showroom-link[href="showroom.html"]`; `a#qr-sheet-link[href="qr.html"]`.
  - `#home-qr` (SVG of `location.href`, plus `.local-warning` when local). It's hidden on touch devices with `@media (pointer: coarse)`.
  - QR sheet: `input#base` (defaults to `?base=` or else the current directory URL), plus 5 `.qr-item` entries in this order: Home, Showroom, then each product. Each has `.qr-label`, `.qr-url`, an `svg`, `button.dl-svg`, `button.dl-png` and `.local-warning` when the URL is local. `@media print` hides the controls.

- [ ] **Step 1: Write the failing tests**

```js
// landing: 3 .product-card with the expected hrefs; #showroom-link present; #home-qr contains <svg and .local-warning; errors []
// qr sheet: 5 .qr-item; first .qr-url ends with '/index.html'; set #base to 'https://demo.example.com/ar/' + input event →
//   product .qr-url === 'https://demo.example.com/ar/product.html?p=sofa' and no .local-warning visible;
//   click .dl-svg → a download starts (use page CDP Browser.setDownloadBehavior into a temp dir and assert a .svg file appears)
```

- [ ] **Step 2: Run the tests to verify they fail.**

- [ ] **Step 3: Implement.** Downloads use `Blob` plus an object-URL `<a download>`: the SVG downloads as-is, and the PNG is drawn into a 1024 × 1024 canvas, then `toBlob('image/png')`. File names are `qr-<label-slug>.svg` / `.png`. Add a short footer on the landing page saying the products are sample models, with the credits.

- [ ] **Step 4: Run the tests to verify they pass.**

- [ ] **Step 5: Commit:** `feat: landing page and QR sheet`

---

### Task 6: Showroom scene and page

**Files:**
- Create: `scripts/build-showroom.mjs`, `showroom.html`, `js/showroom.js`
- Generated (committed): `models/showroom.glb`
- Modify: `css/style.css`
- Test: `tests/showroom-build.test.mjs`, `tests/showroom.smoke.test.mjs`

**Interfaces:**
- Consumes: `products.json` (`showroom.x`, `rotY`, `halfWidth`), `productAtX`, `loadProducts`
- Produces:
  - `buildShowroom(products, outPath): Promise<void>`. The CLI form writes `models/showroom.glb`.
  - DOM:
    - `#showroom` (model-viewer, `camera-orbit="0deg 70deg 6m"`, `camera-target="0m 0.4m 0m"`, no `ar`)
    - `#picker` containing `button[data-product]` for each product
    - `#focus-panel` (hidden until a product is focused) containing `#focus-name` and `#focus-viewer`. `#focus-viewer` is a small model-viewer with `ar`, the same `ar-modes`, `ar-scale="fixed"` and a `slot="ar-button"` button labelled `View in your space`.
    - `a#focus-details[href="product.html?p=<id>"]`

- [ ] **Step 1: Write the failing tests**

```js
// tests/showroom-build.test.mjs: buildShowroom(products, tmp) then read with NodeIO (+ALL_EXTENSIONS):
//   one scene; its root children named 'showroom-sofa', 'showroom-chair', 'showroom-lamp';
//   each translation [x, 0, 0] from products.json; chair rotation is the quaternion for 30° about Y (within 1e-6)
```

```js
// tests/showroom.smoke.test.mjs: #showroom loads (timeout 60s); #focus-panel hidden;
//   (order matters: focusing moves the camera) click the #showroom centre first → #focus-name 'Glam Velvet Sofa'
//   click button[data-product=chair] → #focus-name 'Sheen Lounge Chair', #focus-viewer src ends 'models/SheenChair.glb',
//     #focus-details href 'product.html?p=chair', #showroom.cameraTarget starts with '-1.75m'
//   click #showroom at (5, 5) (sky) → #focus-name still 'Sheen Lounge Chair'; errors []
```

- [ ] **Step 2: Run the tests to verify they fail.**

- [ ] **Step 3: Implement `buildShowroom`.** Read each GLB with `NodeIO` registered with `ALL_EXTENSIONS`. `mergeDocuments` each one into a new document, then move each source scene's root nodes under a parent node `showroom-<id>` that carries the `x` translation and `rotY` rotation. Keep a single scene, then `prune()` and `dedup()`. Run `npm run build:showroom` to produce `models/showroom.glb`.

- [ ] **Step 4: Implement the showroom page.**
  - Clicking `#showroom` calls `positionAndNormalFromPoint`. A `null` result or a `null` from `productAtX` changes nothing.
  - `focus(product)` sets `cameraTarget = "${x}m 0.4m 0m"` and `cameraOrbit = "0deg 70deg ${Math.max(1.6, halfWidth * 3)}m"`, then fills the focus panel.
  - Picker buttons call `focus` and show `aria-pressed`.

- [ ] **Step 5: Run `npm test` to verify it passes.** Note the size of `showroom.glb` in the commit message. It's about 11 MB, over the per-product budget but not a product. If it's slow on 4G in Task 8, add texture downscaling to the build.

- [ ] **Step 6: Commit:** `feat: showroom scene and page`

---

### Task 7: Poster images

**Files:**
- Create: `scripts/make-posters.mjs`
- Generated (committed): `posters/sofa.webp`, `posters/chair.webp`, `posters/lamp.webp`
- Modify: `scripts/check-products.mjs` (a missing poster becomes an error)
- Test: `npm run check`

**Interfaces:**
- Consumes: `withPage` (Task 2), product page

- [ ] **Step 1: Change `check-products.mjs`** so a missing poster is an error. Run `npm run check`. Expected: exit code 1 with three `poster missing` errors.

- [ ] **Step 2: Implement `make-posters.mjs`.** For each product: `withPage('/product.html?p=<id>')`, wait for `viewer.loaded`, then `viewer.toBlob({ mimeType: 'image/webp', qualityArgument: 0.85, idealAspect: true })`. Write the blob's bytes to `poster`.

- [ ] **Step 3: Run `npm run posters && npm run check`.** Expected: three files of about 20–100 KB each, and exit code 0. Look at each image: it should show the whole product on the studio background.

- [ ] **Step 4: Run `npm test`.** Expected: all pass, with no 404 errors for posters.

- [ ] **Step 5: Commit:** `feat: poster images`

---

### Task 8: Deploy and real-device acceptance (human-assisted)

**Files:**
- Create: `README.md` (run, test, deploy commands; how to swap in client models: replace the GLB, run `?pick=1` to place hotspots, then `npm run build:showroom && npm run posters && npm run check`)

- [ ] **Step 1: The user picks the host and domain** (spec §11 Q4). Any static HTTPS host works (Cloudflare Pages, Netlify, GitHub Pages or the user's VPS). The deployable folder is the project root minus `node_modules`, `tests`, `scripts` and `docs`.
- [ ] **Step 2: Deploy.** Open `<deployed>/qr.html?base=<deployed>/`, then print or save the QR codes.
- [ ] **Step 3: Run the spec §10 checklist on a real iPhone (Safari) and a real Android phone (Chrome):**
  - QR scan opens the demo.
  - Each product loads in under about 3 s on 4G. Time it with Wi-Fi off.
  - Rotate, zoom, double-tap, variants and hotspots work.
  - AR places each product at correct scale on the floor and on a table.
  - On iPhone, the chosen variant carries into Quick Look.
  - The demonstration tour plays.
  - The showroom switches between products and launches AR from the focus panel.
  - No errors after a refresh.
- [ ] **Step 4: Fix what fails**, re-run `npm test` and redeploy.
- [ ] **Step 5: Commit:** `docs: README; deploy`

---

## Spec coverage

| Spec item | Task |
| --- | --- |
| 2.1 Landing QR, per-product QR, desktop QR, printable | 5, 2 |
| 2.2 GLB models, lighting and studio background, loader and poster | 2, 7 |
| 2.3 `View in your space`, Scene Viewer/WebXR/Quick Look, real scale | 2, 8 |
| 2.4 Rotate, zoom, double-tap reset; variants; hotspots | 2, 3 |
| 2.5 Hero animation and step annotations | 4 (plays a GLB animation when the model has one; the sample models don't) |
| 2.6 One-scene showroom, tap to focus, AR from focus | 6 |
| 2.7 Mobile-first, real devices, HTTPS, embeddable link | 2, 5, 8 |
| §10 No errors on load or refresh | Every smoke test asserts `errors == []`; reload case in 2 |
