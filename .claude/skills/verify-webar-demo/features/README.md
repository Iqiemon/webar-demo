# WebAR demo verification map

This directory is the maintained source for verifying the user-facing behavior of the WebAR demo.
Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `node .claude/skills/verify-webar-demo/bin/verify.mjs start` — the repo's own static
  server on `127.0.0.1:4173`, serving the repo root.
- The browser needs internet: `model-viewer` and the QR library load from public CDNs.
- Chrome comes from `CHROME_PATH`; do not hardcode a path.
- Run `node .claude/skills/verify-webar-demo/bin/verify.mjs doctor` and require `doctor: ok`.
- Never drive a server this run did not start. One instance per port.

## Driving conventions

- Start every recipe from a fresh page load unless its preconditions say otherwise.
- Prefer stable handles: `#viewer`, `#products`, `#picker`, `data-variant`, `data-product`, and the
  visible button text. Avoid coordinates except where the feature is a 3D hit-test.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Drive pages through `puppeteer-core` with `executablePath: process.env.CHROME_PATH`.
- Wait for `#viewer.loaded === true` (or `#showroom.loaded`) rather than a fixed sleep.
- Never weaken a recipe to make it pass; a missing precondition is a reported failure plus a Gotcha.

## Proof and skip reporting

- Capture the user action and the resulting state, not just the final screen.
- UI proof is a screenshot plus the asserted values in the recipe's JSON (`test-output/verify/<recipe>/`).
- Record the feature ID and the entry point URL used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- AR placement on a real phone over HTTPS is out of reach here; report it as not verified, never as
  passed via a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It
then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with verify.mjs` starts with `Preconditions:` and uses labeled bullets that pair each
   user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

## Features

- [Browse the product list](./browse-products.md) covers the landing page cards, showroom and QR links.
- [Explore a product in 3D](./explore-product.md) covers the 3D viewer, colour variants, hotspots and
  the demonstration tour.
- [Use the virtual showroom](./showroom.md) covers picking and focusing a product in the one-scene room.
- [Get QR codes](./qr-codes.md) covers the landing QR, the printable sheet, base-URL rewriting and
  downloads.
- [Switch theme and language](./theme-language.md) covers dark mode and the English/Bahasa Malaysia
  toggle, including persistence.
