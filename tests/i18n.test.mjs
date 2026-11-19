import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DICT } from '../js/i18n.js';

test('BM dictionary has exactly the EN keys and placeholders', () => {
  assert.deepEqual(Object.keys(DICT.ms).sort(), Object.keys(DICT.en).sort());
  const ph = s => (s.match(/\{\w+\}/g) ?? []).sort().join();
  for (const k of Object.keys(DICT.en)) assert.equal(ph(DICT.ms[k]), ph(DICT.en[k]), k);
});

test('every product has BM copy matching its hotspot count', () => {
  for (const p of JSON.parse(fs.readFileSync('products.json', 'utf8'))) {
    assert.ok(p.ms.tagline, p.id);
    assert.equal(p.ms.hotspots.length, p.hotspots.length, p.id);
  }
});

test('every data-i18n key used in the pages exists', () => {
  for (const f of ['index', 'product', 'showroom', 'qr']) {
    const html = fs.readFileSync(`${f}.html`, 'utf8');
    for (const [, k] of html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) assert.ok(DICT.en[k], `${f}.html: ${k}`);
  }
});
