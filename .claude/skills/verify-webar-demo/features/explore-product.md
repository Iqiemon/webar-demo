# Explore a product in 3D

A product page loads a GLB into `model-viewer` and lets the visitor rotate and zoom it, switch colour
variants, tap numbered hotspots for detail, and — on the hero product — play a guided demonstration
that walks the camera through the hotspots.

## Sub-features

- `explore-load` loads `#viewer` for `?p=<id>` and shows the name, tagline and credit.
- `explore-variants` lists the model's colour variants and applies the chosen one.
- `explore-hotspots` shows a numbered marker per hotspot; choosing one opens its title and text.
- `explore-tour` plays the demonstration step by step with `Next` and `Stop` (hero only).
- `explore-notfound` shows the not-found notice for an unknown or missing `?p`.
- `explore-ar` offers `View in your space` only where AR can activate; otherwise it shows a QR fallback.
- `explore-picker` (`?pick=1`) prints a tapped point's position and normal for authoring hotspots.

## How to get to it (user POV)

- Choose a product card on `index.html`.
- Open `product.html?p=<id>` directly (ids: `sofa` hero, `chair`, `lamp`, `table`).
- On the page: drag/pinch to move, click a colour chip, click a numbered hotspot, choose
  `▶ Play demonstration`, then `Next`/`Stop`.

## Driving it with verify.mjs

Preconditions:

- `doctor: ok`.
- `products.json` has `sofa` as the hero with 5 variants and 4 hotspots.

- **Load the hero.** Navigate to `/product.html?p=sofa` and wait for `#viewer.loaded === true`.
  `#title` reads `Glam Velvet Sofa`.
- **Switch colour.** Click `#variants button[data-variant="Navy"]`. `viewer.variantName` becomes
  `Navy` and that chip's `aria-pressed` becomes `true` while `Gray` is `false`.
- **Open a hotspot.** Click the first `#viewer button.hotspot`. `#hotspot-card` becomes visible and its
  text contains `Deep velvet seat`.
- **Play the tour.** Click `#demo-play`. `#demo-panel` appears with `#demo-step` reading
  `1/4 · Deep velvet seat: …`; `Next` advances to `2/4`; `Stop` hides the panel.
- **Run the recipe.** `node .claude/skills/verify-webar-demo/bin/verify.mjs run product` performs the
  steps above and writes `facts` (title, variants, chosen, pressed, hotspot, step).
- **Desktop AR fallback.** `run desktop` on `/product.html?p=chair` asserts `canActivateAR` is false,
  `#ar-button` is hidden, and `#qr-panel svg` is visible.
- **Proof.** `test-output/verify/product/product.png` shows the Navy sofa mid-tour with markers and
  the QR panel; `product.json` holds the asserted values. `desktop/desktop.png` shows the QR fallback.

## Gotchas

- The model and the QR library come from a CDN; without internet `#viewer` never loads and the recipe
  fails with a page error. That is an environment failure, not a product failure.
- Wait for `loaded === true`; a fixed sleep races the model download.
- Variants before a choice: the model shows its own default materials and no chip is pressed. Assert
  the chip state after the click, not the initial one.
- Only the hero product (`sofa`) has a demo tour; `#demo-play` stays hidden on the others.
- AR placement (`View in your space`, Scene Viewer, Quick Look) needs a real phone over HTTPS and
  cannot be proven in headless Chrome. Verify the fallback only and report AR placement as
  not verified.
- `?pick=1` is a real authoring aid; use it to read hotspot coordinates rather than guessing.
