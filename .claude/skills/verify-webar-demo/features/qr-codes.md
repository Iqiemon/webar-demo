# Get QR codes

Visitors reach the demo on a phone by scanning a QR code: the landing page shows one for itself, and a
printable sheet lists a code for every page and product, rewritable to the site's public HTTPS address
and downloadable as SVG or PNG.

## Sub-features

- `qr-landing` shows the landing page's own QR code, with a warning when the URL is loopback/LAN.
- `qr-sheet` lists a code per page: Home, Showroom, then one per product.
- `qr-base` rewrites every code when the site address field changes; an invalid address is rejected.
- `qr-download` downloads each code as SVG and PNG.

## How to get to it (user POV)

- Choose `Printable QR codes` on `index.html`, or open `qr.html`.
- Open `qr.html?base=<https url>` to preset the site address (used for printing).
- Type in the site address field, or choose `SVG` / `PNG` under a code.

## Driving it with verify.mjs

Preconditions:

- `doctor: ok`.
- `products.json` lists `sofa`, `chair`, `lamp`, `table`.

- **Open the sheet.** Navigate to `/qr.html` and wait for `.qr-item svg`.
- **Read the codes.** `.qr-label` lists `Home`, `Showroom`, then each product name. Every `.qr-item`
  has a `.qr-url`, and the first ends in `/index.html`.
- **Check the local warning.** Before editing the address, a visible `.local-warning` sits under each
  code (the server is on loopback).
- **Rewrite the base.** Set `#base` to `https://demo.example.com/ar/` and dispatch an `input` event.
  Every `.qr-url` now starts with `https://demo.example.com/ar/`, and the product codes end
  `product.html?p=<id>`; the local warnings disappear.
- **Reject a bad base.** Set `#base` to `not a url` and dispatch `input`. `#base-error` is visible and
  the codes keep the last good URLs.
- **Run the recipe.** `node .claude/skills/verify-webar-demo/bin/verify.mjs run qr` performs the steps
  above and writes `facts` (labels, localWarning, rewritten, baseErrorShown, keptAfterBadBase).
- **Proof.** `test-output/verify/qr/qr.png` shows the sheet with rewritten URLs; `qr.json` holds the
  asserted values.

## Gotchas

- Read the local-address warning **before** rewriting the base to a public URL; it is expected only for
  loopback/LAN addresses and is removed once the base is public.
- The base field updates on `input`, not `change`; dispatch `input` after setting `.value`.
- `?base=` must be a full URL; the page rejects anything that is not `http:`/`https:`.
- Downloading writes through a browser download; the repo's `npm test` covers SVG/PNG download with a
  CDP download path. The recipe here does not, to avoid depending on a writable download dir.
- Printing (`@media print`) hides the controls; that is CSS only and not verifiable in headless easily.
