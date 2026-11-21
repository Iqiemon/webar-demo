# Use the virtual showroom

The showroom page places every product together in one 3D scene. The visitor taps a product in the
room, or chooses it from the picker, to focus it in a side viewer with a link into its full product page
and its own `View in your space` button.

## Sub-features

- `showroom-scene` loads `models/showroom.glb`, the merged scene, into `#showroom`.
- `showroom-pick` lists one chip per product in `#picker` and focuses on choose.
- `showroom-tap` focuses the product under a tap on the room; a drag that ends over a product does not.
- `showroom-focus` fills the side panel: name, tagline, `#focus-viewer` model, `#focus-details` deep link.
- `showroom-phone` on a phone viewport, focusing brings the panel on screen.

## How to get to it (user POV)

- Choose `Virtual showroom →` on `index.html`.
- Open `showroom.html` directly.
- In the page: tap a product in the room, or choose a chip, then follow `Colours, details & demo`.

## Driving it with verify.mjs

Preconditions:

- `doctor: ok`.
- `products.json` lists `sofa`, `chair`, `lamp`, `table`.

- **Load the room.** Navigate to `/showroom.html` and wait for `#showroom.loaded === true`.
  `#focus-panel` is hidden and `#picker button` list the product ids in order.
- **Pick each product.** Click `#picker button[data-product="<id>"]`. For each: `#focus-name` shows
  the product name, `#focus-viewer` `src` is that product's `model`, `#focus-details` `href` is
  `product.html?p=<id>`, and the chip has `aria-pressed="true"`.
- **Tap the room.** To prove a tap focuses, find a canvas point whose
  `positionAndNormalFromPoint` lands within the sofa's `halfWidth` of `x = 0`, click it, and assert
  `#focus-name` becomes `Glam Velvet Sofa`.
- **Run the recipe.** `node .claude/skills/verify-webar-demo/bin/verify.mjs run showroom` iterates the
  picker and writes `facts.seen` (id, name, src, details, pressed for each product).
- **Proof.** `test-output/verify/showroom/showroom.png` shows the focused product and its side panel;
  `showroom.json` holds the per-product values.

## Gotchas

- Focusing moves the camera. Settle on a product before the next tap, and tap the sofa first if you
  also test tapping, because the default framing is what puts the sofa under the centre.
- The tap is a 3D hit-test. Do not assume a fixed pixel fraction lands on a product — the merged
  scene's framing depends on every model. Sample `positionAndNormalFromPoint` and use a real hit.
- A drag that ends over a product is a rotate; the browser's trailing `click` must not focus. If you
  test this, dispatch `pointerdown`, `pointerup` and `click` with the pointer travel that a drag makes.
- `#focus-viewer` keeps the previous product until the next `src` loads; assert the `src` attribute,
  which changes synchronously, and give the model time before judging it visually.
- AR from the side viewer needs a real phone; verify only that the button exists, not that AR starts.
