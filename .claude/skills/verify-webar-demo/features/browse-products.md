# Browse the product list

The landing page shows every product as a card with a poster, name and tagline, links into each
product's 3D view, and offers the virtual showroom, the printable QR sheet, and a QR code for the
current page so a desktop visitor can continue on a phone.

## Sub-features

- `browse-cards` lists one card per product in `products.json`, in file order.
- `browse-nav` links each card to `product.html?p=<id>` and the page to `showroom.html` and `qr.html`.
- `browse-qr` renders a QR code for the current page and warns when the URL is not phone-reachable.

## How to get to it (user POV)

- Open the site root: `index.html` (or `/`).
- Choose a product card to enter its 3D page.
- Choose `Virtual showroom →` or `Printable QR codes`.

## Driving it with verify.mjs

Preconditions:

- `doctor: ok` for `127.0.0.1:4173`.
- `products.json` lists `sofa`, `chair`, `lamp`, `table` in that order.

- **Open the landing page.** Navigate to `/index.html`. `#products a.product-card` appear once
  `js/home.js` has replaced the empty container.
- **Read the cards.** Run
  `node .claude/skills/verify-webar-demo/bin/verify.mjs run landing`. The JSON `facts.cards` equals
  `product.html?p=sofa`, `?p=chair`, `?p=lamp`, `?p=table`, and `facts.titles` matches the product
  names.
- **Check navigation.** In the same recipe, `facts.showroomHref` is `showroom.html` and
  `facts.qrSheetHref` is `qr.html`.
- **Check the QR code.** `facts.qrSvgLabels` has an SVG with `aria-label` starting `QR code for
  http://127.0.0.1:4173/…`, and `facts.localWarning` is `true` (the server is on loopback).
- **Proof.** `test-output/verify/landing/landing.png` shows the four cards, the showroom link and the
  QR panel; `landing.json` holds the asserted values.

## Gotchas

- The QR and the local-address warning only appear after `js/home.js` runs; wait for `#home-qr svg`.
- The local-address warning is expected on `127.0.0.1`. It disappears only for a public HTTPS URL.
- `products.json` drives the list; a product added there (like `table`) appears with no code change.
  Do not assert a fixed card count from memory — read `facts.cards`.
