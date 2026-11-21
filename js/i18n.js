// UI language (EN default, BM = Bahasa Malaysia). Static HTML stays English as the no-JS fallback;
// data-i18n / data-i18n-html / data-i18n-aria-label elements are translated from DICT.
const KEY = 'lang';
const LANGS = ['en', 'ms'];
const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } }; // also throws under node (catalog tests)

export const lang = LANGS.includes(get()) ? get() : 'en';
if (globalThis.document) document.documentElement.lang = lang;

export const DICT = {
  en: {
    'switch': 'BM', 'switch.label': 'Tukar ke Bahasa Malaysia', 'theme': 'Dark mode',
    'badge.products': 'Sample products', 'badge.model': 'Sample model', 'badge.showroom': 'Virtual showroom', 'badge.qr': 'QR codes',
    'back.all': '← All products', 'back.home': '← Demo home',
    'title.home': 'WebAR Demo', 'title.product': 'Product · WebAR Demo', 'title.productNamed': '{name} · WebAR Demo',
    'title.showroom': 'Showroom · WebAR Demo', 'title.qr': 'QR codes · WebAR Demo',
    'home.title': 'See it in your space before you buy',
    'home.lead': 'Open any product in 3D, change its colour, then place it in your room at real size. Runs in the phone browser — no app to install.',
    'home.qr.title': 'Open on your phone',
    'home.qr.text': 'Scan with the camera app. <a id="qr-sheet-link" href="qr.html">Printable QR codes</a>',
    'home.products': 'Products',
    'home.showroom.title': 'Virtual showroom →',
    'home.showroom.text': 'All products together in one 3D room. Tap one to focus it, then view it in AR.',
    'home.credits': 'Sample 3D models: {credits}',
    'card.cta': 'View in 3D & AR →',
    'nf.title': 'Product not found', 'nf.text': "This link doesn't match a product in the demo.", 'nf.link': 'See all products',
    'ar.button': 'View in your space',
    'ar.error': 'AR couldn\'t start on this phone. On Android it needs Google Play Services for AR (<a href="https://developers.google.com/ar/devices" target="_blank" rel="noopener">supported phones</a>); on iPhone, use Safari. You can still explore the product in 3D.',
    'load.error': 'Couldn\'t load the 3D model. <a href="">Try again</a>',
    'colour': 'Colour', 'tour.play': '▶ Play demonstration', 'tour.next': 'Next', 'tour.stop': 'Stop',
    'hint': 'Drag to rotate · pinch or scroll to zoom · double-tap to reset',
    'prod.qr.title': 'View it in your room',
    'prod.qr.text': 'Scan with your phone camera to open this product and place it in AR.',
    'credit': 'Sample 3D model: {credit}',
    'alt': '3D model of {name}',
    'room.alt': 'Showroom with sofas, a lounge chair, a lamp and a coffee table',
    'room.error': 'Couldn\'t load the showroom. <a href="">Try again</a>',
    'room.hint': 'Tap a product to focus it, or choose one:', 'products.label': 'Products',
    'focus.error': "Couldn't load this model. Check your connection and tap the product again.",
    'focus.ar.error': 'AR couldn\'t start on this phone. On Android it needs Google Play Services for AR (<a href="https://developers.google.com/ar/devices" target="_blank" rel="noopener">supported phones</a>); on iPhone, use Safari.',
    'focus.details': 'Colours, details &amp; demo',
    'qr.h1': 'Printable QR codes', 'qr.base': 'Site address the codes should open',
    'qr.base.error': 'Enter a full address starting with https://',
    'qr.help': 'Print this page, or download each code as SVG (for print) or PNG.',
    'qr.home': 'Home', 'qr.showroom': 'Showroom',
  },
  ms: {
    'switch': 'EN', 'switch.label': 'Switch to English', 'theme': 'Mod gelap',
    'badge.products': 'Produk contoh', 'badge.model': 'Model contoh', 'badge.showroom': 'Bilik pameran maya', 'badge.qr': 'Kod QR',
    'back.all': '← Semua produk', 'back.home': '← Laman utama demo',
    'title.home': 'Demo WebAR', 'title.product': 'Produk · Demo WebAR', 'title.productNamed': '{name} · Demo WebAR',
    'title.showroom': 'Bilik pameran · Demo WebAR', 'title.qr': 'Kod QR · Demo WebAR',
    'home.title': 'Lihat di ruang anda sebelum membeli',
    'home.lead': 'Buka mana-mana produk dalam 3D, tukar warnanya, kemudian letakkan di bilik anda pada saiz sebenar. Berjalan dalam pelayar telefon — tiada aplikasi untuk dipasang.',
    'home.qr.title': 'Buka di telefon anda',
    'home.qr.text': 'Imbas dengan aplikasi kamera. <a id="qr-sheet-link" href="qr.html">Kod QR boleh cetak</a>',
    'home.products': 'Produk',
    'home.showroom.title': 'Bilik pameran maya →',
    'home.showroom.text': 'Semua produk bersama dalam satu bilik 3D. Ketik satu untuk fokus, kemudian lihat dalam AR.',
    'home.credits': 'Model 3D contoh: {credits}',
    'card.cta': 'Lihat dalam 3D & AR →',
    'nf.title': 'Produk tidak dijumpai', 'nf.text': 'Pautan ini tidak sepadan dengan mana-mana produk dalam demo.', 'nf.link': 'Lihat semua produk',
    'ar.button': 'Lihat di ruang anda',
    'ar.error': 'AR tidak dapat dimulakan pada telefon ini. Pada Android, ia memerlukan Google Play Services for AR (<a href="https://developers.google.com/ar/devices" target="_blank" rel="noopener">telefon yang disokong</a>); pada iPhone, gunakan Safari. Anda masih boleh meneroka produk dalam 3D.',
    'load.error': 'Model 3D tidak dapat dimuatkan. <a href="">Cuba lagi</a>',
    'colour': 'Warna', 'tour.play': '▶ Main demonstrasi', 'tour.next': 'Seterusnya', 'tour.stop': 'Henti',
    'hint': 'Seret untuk memutar · cubit atau tatal untuk zum · ketik dua kali untuk set semula',
    'prod.qr.title': 'Lihat di bilik anda',
    'prod.qr.text': 'Imbas dengan kamera telefon anda untuk membuka produk ini dan meletakkannya dalam AR.',
    'credit': 'Model 3D contoh: {credit}',
    'alt': 'Model 3D {name}',
    'room.alt': 'Bilik pameran dengan sofa, kerusi santai, lampu dan meja kopi',
    'room.error': 'Bilik pameran tidak dapat dimuatkan. <a href="">Cuba lagi</a>',
    'room.hint': 'Ketik produk untuk fokus, atau pilih satu:', 'products.label': 'Produk',
    'focus.error': 'Model ini tidak dapat dimuatkan. Semak sambungan anda dan ketik produk sekali lagi.',
    'focus.ar.error': 'AR tidak dapat dimulakan pada telefon ini. Pada Android, ia memerlukan Google Play Services for AR (<a href="https://developers.google.com/ar/devices" target="_blank" rel="noopener">telefon yang disokong</a>); pada iPhone, gunakan Safari.',
    'focus.details': 'Warna, butiran &amp; demo',
    'qr.h1': 'Kod QR boleh cetak', 'qr.base': 'Alamat laman yang akan dibuka oleh kod',
    'qr.base.error': 'Masukkan alamat penuh bermula dengan https://',
    'qr.help': 'Cetak halaman ini, atau muat turun setiap kod sebagai SVG (untuk cetakan) atau PNG.',
    'qr.home': 'Laman utama', 'qr.showroom': 'Bilik pameran',
  },
};

export const t = (key, vars = {}) =>
  (DICT[lang][key] ?? DICT.en[key]).replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// Product copy: products.json holds English; an optional `ms` block overrides tagline and hotspot text.
export const localize = p => lang === 'en' || !p.ms ? p : {
  ...p, tagline: p.ms.tagline ?? p.tagline,
  hotspots: p.hotspots.map((h, i) => ({ ...h, ...p.ms.hotspots?.[i] })),
};

function apply() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml); // DICT is our own markup
  for (const el of document.querySelectorAll('[data-i18n-aria-label]')) el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  for (const el of document.querySelectorAll('[data-i18n-alt]')) el.setAttribute('alt', t(el.dataset.i18nAlt));
}

// Static markup is translated now; call once per page. The button flips the language and reloads.
export function initLangToggle(btn) {
  if (lang !== 'en') apply();
  btn.textContent = t('switch');
  btn.setAttribute('aria-label', t('switch.label'));
  btn.addEventListener('click', () => {
    try { localStorage.setItem(KEY, lang === 'en' ? 'ms' : 'en'); } catch { return; } // private mode: no way to persist, so no switch
    location.reload();
  });
}
