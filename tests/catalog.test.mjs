import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { findProduct, validateProducts, productAtX } from '../js/catalog.js';

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

test('real products.json is valid', () => assert.deepEqual(validateProducts(products), []));

test('findProduct', () => {
  assert.equal(findProduct(products, 'chair').name, 'Sheen Lounge Chair');
  assert.equal(findProduct(products, 'nope'), undefined);
});

test('validate catches bad data', () => {
  const bad = structuredClone(products);
  bad[1].id = 'sofa';                  // duplicate id
  bad[0].hotspots[0].position = '0 1'; // 2 numbers
  bad[0].hotspots[0].orbit = 'left';   // bad orbit
  bad[2].showroom.halfWidth = 0;       // must be > 0
  bad[2].hero = true;                  // two heroes
  const errs = validateProducts(bad).join('\n');
  for (const s of ['duplicate id "sofa"', 'position', 'orbit', 'halfWidth', 'hero']) assert.match(errs, new RegExp(s));
  assert.deepEqual(validateProducts([]), ['products.json must be a non-empty array']);
  assert.deepEqual(validateProducts(null), ['products.json must be a non-empty array']);
});

test('productAtX maps x to product, gaps to null', () => {
  assert.equal(productAtX(products, 0).id, 'sofa');
  assert.equal(productAtX(products, -1.05).id, 'sofa'); // sofa arm, nearer chair centre than sofa centre
  assert.equal(productAtX(products, -1.75).id, 'chair');
  assert.equal(productAtX(products, 1.6).id, 'lamp');
  assert.equal(productAtX(products, 1.35), null);       // floor between sofa and lamp
  assert.equal(productAtX(products, 9), null);
  assert.equal(productAtX(products, NaN), null);
});
