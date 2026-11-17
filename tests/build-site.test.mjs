import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSite } from '../scripts/build-site.mjs';

test('build copies only the public site into the output folder', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'site-'));
  buildSite(out);
  for (const f of ['index.html', 'product.html', 'showroom.html', 'qr.html', 'products.json', 'css/style.css', 'js/catalog.js', 'models/showroom.glb', 'posters/sofa.webp'])
    assert.ok(fs.existsSync(path.join(out, f)), f);
  for (const f of ['docs', 'tests', 'scripts', 'node_modules', 'package.json', 'README.md', '.git'])
    assert.ok(!fs.existsSync(path.join(out, f)), `${f} must not be published`);
  fs.rmSync(out, { recursive: true });
});
