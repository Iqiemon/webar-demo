// Product data: load, look up, validate, and map a showroom x-coordinate to a product.

export async function loadProducts(url = 'products.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load products (${res.status})`);
  return res.json();
}

export const findProduct = (products, id) => products.find(p => p.id === id);

const isText = v => typeof v === 'string' && v.trim() !== '';
const isVec3 = v => typeof v === 'string' && /^-?\d+(\.\d+)? -?\d+(\.\d+)? -?\d+(\.\d+)?$/.test(v.trim());
const ORBIT = /^-?\d+(\.\d+)?deg -?\d+(\.\d+)?deg \d+(\.\d+)?m$/;

export function validateProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return ['products.json must be a non-empty array'];
  const errs = [], seen = new Set();
  products.forEach((p, i) => {
    const at = `product ${p?.id ?? i}`;
    if (!/^[a-z0-9-]+$/.test(p?.id ?? '')) errs.push(`${at}: id must match [a-z0-9-]+`);
    else if (seen.has(p.id)) errs.push(`${at}: duplicate id "${p.id}"`);
    seen.add(p?.id);
    for (const f of ['name', 'tagline', 'poster', 'credit']) if (!isText(p?.[f])) errs.push(`${at}: ${f} is required`);
    if (!isText(p?.model) || !p.model.endsWith('.glb')) errs.push(`${at}: model must be a .glb path`);
    const s = p?.showroom ?? {};
    if (!Number.isFinite(s.x)) errs.push(`${at}: showroom.x must be a number`);
    if (!Number.isFinite(s.rotY)) errs.push(`${at}: showroom.rotY must be a number`);
    if (!(s.halfWidth > 0)) errs.push(`${at}: showroom.halfWidth must be > 0`);
    if (!Array.isArray(p?.hotspots)) errs.push(`${at}: hotspots must be an array`);
    else p.hotspots.forEach((h, j) => {
      const hs = `${at} hotspot ${j + 1}`;
      if (!isText(h.title) || !isText(h.text)) errs.push(`${hs}: title and text are required`);
      if (!isVec3(h.position)) errs.push(`${hs}: position must be "x y z"`);
      if (!isVec3(h.normal)) errs.push(`${hs}: normal must be "x y z"`);
      if (h.orbit !== undefined && !ORBIT.test(h.orbit)) errs.push(`${hs}: orbit must look like "20deg 55deg 2.6m"`);
    });
  });
  if (products.filter(p => p?.hero).length > 1) errs.push('only one product may be hero');
  return errs;
}

// Products sit in a row along x in the showroom; the nearest centre wins where footprints overlap.
export function productAtX(products, x) {
  let best = null;
  for (const p of products) {
    const d = Math.abs(x - p.showroom.x);
    if (d <= p.showroom.halfWidth && (!best || d < Math.abs(x - best.showroom.x))) best = p;
  }
  return best;
}
