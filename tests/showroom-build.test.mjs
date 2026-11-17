import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { buildShowroom } from '../scripts/build-showroom.mjs';

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));

test('merges products into one scene, laid out from products.json', async () => {
  const out = path.join(os.tmpdir(), `showroom-${process.pid}.glb`);
  await buildShowroom(products, out);
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(out);
  const scenes = doc.getRoot().listScenes();
  assert.equal(scenes.length, 1);
  const groups = scenes[0].listChildren();
  assert.deepEqual(groups.map(n => n.getName()), ['showroom-sofa', 'showroom-chair', 'showroom-lamp']);
  for (const [i, p] of products.entries()) {
    assert.deepEqual(groups[i].getTranslation(), [p.showroom.x, 0, 0]);
    assert.ok(groups[i].listChildren().length > 0, `${p.id} has content`);
  }
  const q = groups[1].getRotation(), h = (30 * Math.PI) / 360;
  [0, Math.sin(h), 0, Math.cos(h)].forEach((v, i) => assert.ok(Math.abs(q[i] - v) < 1e-6, `q[${i}]`));
  fs.rmSync(out);
});
