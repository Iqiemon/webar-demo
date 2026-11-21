---
name: verify-webar-demo
description: Drive the WebAR demo (Iqiemon/webar-demo) in headless Chrome and prove its user-facing behavior — landing product list, 3D product viewer with colour variants, hotspots and the demonstration tour, the one-scene showroom, QR codes, and theme/language toggles. Use when asked to verify, prove, smoke-test or visually check a change to this static site, or before claiming a feature works.
---

# Verify the WebAR demo

A static site (no backend, no build step) with four pages: `index.html`, `product.html?p=<id>`,
`showroom.html`, `qr.html`. The 3D comes from the `model-viewer` web component and the QR codes from
`qrcode-generator`, both loaded from public CDNs — **the browser needs internet access**, or the 3D
viewer and QR codes never appear and every recipe will fail for the wrong reason.

The harness is one script, `.claude/skills/verify-webar-demo/bin/verify.mjs` (path relative to the
repo root; run every command below from the repo root). It starts the repo's own dev server
(`scripts/serve.mjs`) on an isolated port, and drives real Chrome with `puppeteer-core`. It never
touches the user's own `npm start` on port 8080.

## Launch

```sh
node .claude/skills/verify-webar-demo/bin/verify.mjs start
```

- Runs `scripts/serve.mjs` on `127.0.0.1:4173` (override with `--port N` or `VERIFY_PORT`), detached,
  and records its PID in `/tmp/webar-verify-<port>.json`. The static site has no migrations or seed
  data; `products.json` and the assets in `models/` and `posters/` are the data.
- Ready means `/index.html` answers 200 — `start` waits for that and prints the PID.
- The server serves the repo root, so it also serves `docs/`, `tests/` and `scripts/`. That is fine for
  verification; do not add a second server.
- Teardown: `node .claude/skills/verify-webar-demo/bin/verify.mjs stop` kills exactly the PID in the
  state file and deletes the state file. Proof artifacts under `test-output/verify/` survive it.

Only one instance per port can run. If `start` says a server is already running, use that one or
`stop` it first; never start a second copy on the same port.

## Doctor

```sh
node .claude/skills/verify-webar-demo/bin/verify.mjs doctor
```

Read-only. Checks the state file, that its PID is alive and belongs to this repo and port, that the
five entry URLs answer 200, that `/index.html` is this repo, that `products.json` is a non-empty array
with the hero `sofa`, and that Chrome exists. Run it first whenever anything looks off; it exits 1
with one `problem:` line per fault.

## Drive

```sh
node .claude/skills/verify-webar-demo/bin/verify.mjs run <recipe>
```

Recipes (each opens its own page, asserts, then writes evidence):

| Recipe | Proves |
| --- | --- |
| `landing` | Product cards link to each `product.html?p=<id>`, showroom + QR-sheet links, the QR SVG rendered, the local-address warning. |
| `product` | Hero sofa loads, 5 colour chips, clicking `Navy` sets `viewer.variantName` and `aria-pressed`, a hotspot opens its card, `▶ Play demonstration` shows tour step `1/4`. |
| `showroom` | Each `#picker` chip focuses that product: name, `#focus-viewer` `src`, `#focus-details` deep link, `aria-pressed`. |
| `qr` | Every code is listed with a URL, the base-URL field rewrites all codes, an invalid base shows `#base-error` and keeps the last good codes. |
| `desktop` | On a device without AR, `#ar-button` is hidden and the QR fallback (`#qr-panel`) appears. |
| `toggles` | Theme toggle flips `data-theme`; language toggle reloads into BM (`<html lang>`, translated H1, `EN` label); both survive a reload. |

A recipe exits non-zero and prints `verify: <reason>` on a failed assertion. Chrome comes from
`CHROME_PATH` (falling back to `PUPPETEER_EXECUTABLE_PATH`, then common system paths). Set
`CHROME_PATH` to the runner's Chrome; never hardcode a machine-specific path.

Raw commands are available if a recipe does not cover what you need: launch Chrome with
`puppeteer-core` and `executablePath: process.env.CHROME_PATH`, `headless: true`, args
`['--enable-unsafe-swiftshader', '--use-angle=swiftshader']` (software WebGL). Wait for the viewer with
`document.querySelector('#viewer').loaded === true`, not a fixed sleep.

## Evidence

Every recipe writes to `test-output/verify/<recipe>/`:

- `<recipe>.png` — a full screenshot at the end state (1280x800 desktop).
- `<recipe>.json` — `{ url, facts, at }`, where `facts` holds the values the recipe asserted.

Proof standards:

- Drive the real page in a real browser; do not call `js/*.js` functions directly or use test-only
  hooks. The only in-page calls the harness makes are reads (`getCameraOrbit`, `variantName`) and
  clicks. `?debug=1` and `?pick=1` are real user-facing dev aids, not test backdoors.
- Prove the action **and** the resulting state: the variant click is proven by `viewer.variantName`
  changing to `Navy` plus the chip's `aria-pressed`, not by the click alone.
- Capture side effects that are not on screen where they exist. This app has no writes; the closest
  analogue is `qr`, which proves the rewritten URLs after the input event.
- Real AR placement (`View in your space`, Scene Viewer, Quick Look) **cannot** be verified here:
  it needs a real phone over HTTPS, and headless Chrome reports `canActivateAR: false`. Do not claim
  AR placement. `desktop` verifies the fallback the app shows in that situation.
- A page error (a `pageerror` or a console `error`) fails the recipe; if the CDN is blocked, that is
  what you will see — report it as an environment failure, not a product failure.

## Cleanup

```sh
node .claude/skills/verify-webar-demo/bin/verify.mjs stop
```

Removes only the server it started (PID from the state file) and the state file. It does **not**
delete `test-output/verify/`. Never kill by process name (`node`, `serve.mjs`) — that would also take
out the user's own `npm start`. Each recipe closes its own browser in a `finally`; an interrupted
recipe may leave a stray Chrome for `puppeteer-core` to reap, but not a stray server beyond the one
`stop` handles.

## Helpers

- `bin/verify.mjs` — the whole harness: `start`, `doctor`, `stop`, `run <recipe>`, flags `--port N`
  and `--out DIR`. It is executable and self-describing (`usage:` on no args).
- The repo's own suite (`npm test`) is a separate, broader check (45 tests incl. smoke tests). This
  skill's recipes are a targeted, evidence-producing subset for proving one change; run `npm test`
  too when the change is broad.
