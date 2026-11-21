# Switch theme and language

Every page has a dark-mode toggle and a language toggle that switches the interface between English
and Bahasa Malaysia. Both choices persist in the browser and survive a reload.

## Sub-features

- `theme-toggle` flips `data-theme` between `light` and `dark` and reflects it in `aria-pressed`.
- `theme-persist` keeps the chosen theme across a reload (stored in `localStorage`).
- `lang-toggle` switches the interface to BM: reloads, sets `<html lang="ms">`, translates static text.
- `lang-persist` keeps the chosen language across a reload.
- `lang-copy` translates product taglines and hotspot text from each product's `ms` block.

## How to get to it (user POV)

- The `Dark mode` button (`#theme-toggle`) sits in the header on `index.html`.
- The language button (`#lang-toggle`) sits in the header of every page; its label shows the target
  language (`BM` in English, `EN` in BM).
- Open any page: `index.html`, `product.html?p=<id>`, `showroom.html`, `qr.html`.

## Driving it with verify.mjs

Preconditions:

- `doctor: ok`.
- A fresh browser profile (no stored `theme`/`lang`) for the before-values to be `light`/`en`.

- **Theme.** On `/index.html`, read `document.documentElement.dataset.theme` (`light`), click
  `#theme-toggle`, read it again (`dark`).
- **Language.** Click `#lang-toggle` and wait for navigation — the button calls `location.reload()`.
  After reload, `<html lang>` is `ms`, the H1 reads `Lihat di ruang anda sebelum membeli`, and
  `#lang-toggle` reads `EN`.
- **Persist.** Reload once more; `data-theme` is still `dark` and `<html lang>` is still `ms`.
- **Run the recipe.** `node .claude/skills/verify-webar-demo/bin/verify.mjs run toggles` performs the
  steps and writes `facts` (before, afterTheme, afterLang, reloaded).
- **Proof.** `test-output/verify/toggles/toggles.png` shows the page dark and in BM; `toggles.json`
  holds the asserted values.

## Gotchas

- The language toggle reloads the page. Pair the click with a navigation wait
  (`Promise.all([page.waitForNavigation(), page.click('#lang-toggle')])`) or the assertions run against
  a page that is being replaced.
- The theme toggle does not reload; only its `data-theme` attribute and `aria-pressed` change.
- Both choices use `localStorage`; a reused browser profile carries them into the next run. Use a fresh
  page/profile or read the before-values instead of assuming defaults.
- Product taglines and hotspot text come from the `ms` block in `products.json`; translated copy only
  appears once a product is loaded. Static page text translates immediately.
