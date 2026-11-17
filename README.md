# WebAR Demo

A phone-browser AR demo of three products: 3D viewer, colour variants, hotspots, a guided demo tour, "View in your space" AR, a one-scene showroom, and QR codes. Static site, no backend, no build step. Spec: [docs/spec.md](docs/spec.md).

## Run and test

```sh
npm install        # dev tools only (tests, showroom build, posters)
npm start          # http://localhost:8080
npm test           # unit + headless-Chrome smoke tests (needs Chrome and internet for the model-viewer CDN)
npm run check      # validates products.json, model sizes (≤ 5 MB) and posters
```

Set `CHROME_PATH` if Chrome is not at `C:/Program Files/Google/Chrome/Application/chrome.exe`.

AR only works over **HTTPS on a public address**: Android's Scene Viewer downloads the model itself, so localhost and LAN links don't work for AR, and QR codes made on a local address show a warning.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Product list, showroom link, QR code for the page (hidden on phones) |
| `product.html?p=<id>` | 3D viewer, variants, hotspots, demo tour (hero product), AR button; QR code on desktop |
| `showroom.html` | All products in one scene; tap or pick one, then AR from the side panel |
| `qr.html?base=<https url>` | Printable QR codes for every page, SVG/PNG download |

## Swapping in the client's products

1. Put each GLB (≤ 5 MB, modelled at real-world size in metres) in `models/` and update `products.json`. Fields: `id`, `name`, `tagline`, `model`, `poster`, `credit`, `hero` (one product only), `showroom` (`x` position in metres, `rotY` degrees, `halfWidth` = half the product's width), `hotspots`.
2. Place hotspots: open `product.html?p=<id>&pick=1`, tap the model, and copy the printed `position` and `normal` into the hotspot. An optional `orbit` (`"20deg 55deg 2.6m"`) sets the camera angle for that step of the demo tour.
3. If the hero model has a built-in animation (parts opening, exploded view), the demo tour plays it automatically.
4. Rebuild the generated assets and check:
   ```sh
   npm run build:showroom && npm run posters && npm run check && npm test
   ```

Branding: change the colour tokens at the top of `css/style.css` and the header text in each page.

## Deploy

Upload these to any static host with HTTPS (Cloudflare Pages, Netlify, GitHub Pages or a VPS):

`index.html product.html showroom.html qr.html products.json css/ js/ models/ posters/`

Then open `https://<your-site>/qr.html?base=https://<your-site>/` to print the QR codes.

## Real-device checklist (spec §10)

Do this on a recent iPhone (Safari) and a recent Android phone (Chrome), on 4G with Wi-Fi off:

- [ ] QR scan opens the demo
- [ ] Each product loads in under about 3 seconds
- [ ] Rotate, zoom, double-tap reset, variants and hotspots work
- [ ] AR places each product at correct scale on the floor and on a table
- [ ] iPhone: the chosen colour carries into AR Quick Look
- [ ] Demonstration tour plays on the sofa
- [ ] Showroom switches between products and launches AR from the side panel
- [ ] No errors after refreshing

Sample models: Glam Velvet Sofa and Iridescent Table Lamp © Wayfair, LLC (CC BY 4.0); Sheen Chair © Wayfair, LLC (CC0). From the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets).
