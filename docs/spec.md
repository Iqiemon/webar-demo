# WebAR Demo Specification

Local copy of https://claude.ai/artifact/4i1b2aotcQuibYccNAr3jf (Draft v0.1, 17 November 2026). The online doc is the source of truth.

## 1. Purpose
A working demo to show the client that all seven requested features are achievable as a Web AR experience (runs in the phone browser, no app install). The demo uses a small set of products and covers each feature at a presentable level. It is not the full system: there is no admin panel, analytics or large product catalogue.

## 2. Demo Scope by Requested Feature
### 2.1 QR Code Scanning to Launch AR Experience
- A QR code (shown on the demo landing page, and printable) opens the demo URL in the phone browser.
- Each product has its own QR that deep-links straight to that product's AR view.
- On desktop, the page shows a QR code so the viewer can switch to their phone.

### 2.2 3D Product Visualisation
- Three sample products shown as 3D models (GLB), with lighting and a clean studio background.
- Loading indicator and poster image while the model loads.

### 2.3 Virtual Product Placement
- "View in your space" button launches native AR on supported phones.
- Android: Scene Viewer or WebXR in Chrome. iPhone: AR Quick Look in Safari.
- Products appear at real-world scale and can be placed on the floor or a table.

### 2.4 Interactive 3D Experience
- Drag to rotate, pinch or scroll to zoom, double-tap to reset.
- Colour or material variants (switchable in the page).
- Tap-for-detail hotspots on key product features.

### 2.5 AR Product Demonstration
- Animated demonstration of one hero product (for example parts opening, or an exploded view).
- Step-by-step annotations explaining the main features.

### 2.6 Virtual AR Showroom
- Demo version: a showroom page where the three products sit together in one 3D scene. The viewer taps a product to focus it, then launches AR for that product.
- A fully walkable showroom is excluded from the demo and would be scoped in the main project once the client confirms what they mean by showroom.

### 2.7 Mobile AR Integration
- Mobile-first responsive page.
- Tested on a recent iPhone (Safari) and a recent Android phone (Chrome).
- Hosted on HTTPS, with a link that could later be embedded into the client's existing website.

## 3. Suggested Demo Flow (10 minutes)
1. Open the landing page and show the product list and the QR code.
2. Scan the QR with a phone: the 3D viewer opens in the browser.
3. Rotate, zoom and switch variants. Tap the hotspots.
4. Play the demonstration animation on the hero product.
5. Tap "View in your space", place the product on the floor, walk around it.
6. Open the showroom page, tap between the three products, launch AR on one of them.
7. Show that it also works on the other phone type.
8. Explain what would be added in the full build (admin panel, analytics, full showroom, more products).

## 4. Technical Approach
- **Viewer and AR launch:** Google model-viewer web component (handles 3D display, AR launch, variants, hotspots and animations).
- **Showroom scene:** Three.js, or several model-viewer instances on one page if time is short.
- **QR codes:** generated with a QR library and exported as PNG and SVG.
- **Hosting:** static site on a VPS or static host, with HTTPS (required for camera and AR).
- **Backend:** none for the demo. Products are defined in a simple JSON file.

## 5. Demo Assets
- **Products:** three, preferably the client's real products. If they cannot supply 3D files, use photo-based or AI-generated models, or generic sample models labelled as samples.
- **Per product:** a GLB file under about 5 MB, plus a USDZ file for iPhone AR Quick Look (converted from the GLB).
- **Poster images** for the loading state, and basic branding (logo and colours) if the client supplies them.
- Models must be set to the correct real-world size, or placement in AR will look wrong.

## 6. Device and Browser Requirements
- Android: a phone that supports ARCore, using Chrome.
- iPhone: iOS Safari with AR Quick Look support.
- Desktop: shows the 3D viewer plus a QR code for switching to a phone. AR placement is not available on desktop.
- Demo must be tested on real devices. AR placement cannot be checked in a desktop browser.

## 7. Known Limitations of Web AR
- Once the phone's native AR mode opens, controls are limited to what the OS provides. Custom hotspots, variant switching and annotations work in the in-page viewer, not inside the native AR view on iPhone.
- Behaviour differs between iPhone and Android, so the demo flow should be rehearsed on both.
- Image tracking and fully branded in-AR interfaces need a paid platform (for example 8th Wall or Zappar). These can be proposed in the full project.

## 8. Out of Scope for the Demo
- Admin panel for uploading products
- Analytics and scan tracking
- Walkable 3D showroom
- Native iOS or Android app
- E-commerce checkout
- Large numbers of products

## 9. Build Plan (estimate for one developer)
- **Day 1:** project setup, hosting with HTTPS, model-viewer page with one test model, QR code.
- **Day 2:** asset preparation (GLB optimisation, USDZ conversion), variants, hotspots.
- **Day 3:** demonstration animation, showroom page, branding.
- **Day 4:** real-device testing on iPhone and Android, fixes, rehearsal.

## 10. Acceptance Checklist
- QR scan opens the demo on both an iPhone and an Android phone
- Each product loads in under about 3 seconds on 4G
- Rotate, zoom, variants and hotspots work
- AR placement works on both phone types at correct scale
- Demonstration animation plays
- Showroom page lets the viewer switch between the three products
- No errors on first load or after refreshing

## 11. Questions to Confirm Before Building
1. Which three products should be in the demo, and can the client share 3D files, CAD files or photos?
2. What does "Virtual AR Showroom" mean to the client?
3. Which phones will the client use to test it?
4. Does the client have branding (logo, colours) and a domain for the demo link?
5. Is a quotation expected at the same time as the demo?
