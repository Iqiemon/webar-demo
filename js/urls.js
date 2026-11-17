export function pageUrl(base, page, params = {}) {
  const b = new URL(base);
  // "https://site/ar" means the /ar/ folder, not a file called "ar"
  if (!b.pathname.endsWith('/') && !b.pathname.split('/').pop().includes('.')) b.pathname += '/';
  const u = new URL(page, b);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.href;
}

// True when a phone elsewhere could not open this URL (loopback, private LAN, mDNS).
export function isLocalUrl(url) {
  const h = new URL(url).hostname.replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '::1' || h.endsWith('.local')) return true;
  const m = h.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!m) return false;
  const [a, b] = [+m[1], +m[2]];
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}
