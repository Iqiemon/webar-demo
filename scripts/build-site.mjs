// Copies only the public site into dist/ (Cloudflare Pages output folder): npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = ['index.html', 'product.html', 'showroom.html', 'qr.html', 'products.json', 'css', 'js', 'models', 'posters'];

export function buildSite(out = 'dist') {
  fs.rmSync(out, { recursive: true, force: true });
  for (const p of PUBLIC) fs.cpSync(p, path.join(out, p), { recursive: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite();
  console.log('built dist/');
}
