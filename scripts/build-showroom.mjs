// Merges every product GLB into models/showroom.glb: one scene, products in a row laid out by products.json `showroom`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { mergeDocuments, prune, dedup, unpartition } from '@gltf-transform/functions';

export async function buildShowroom(products, outPath) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = new Document();
  const room = doc.createScene('showroom');

  for (const p of products) {
    const src = await io.read(p.model);
    const srcScene = src.getRoot().getDefaultScene() ?? src.getRoot().listScenes()[0];
    const scene = mergeDocuments(doc, src).get(srcScene);
    const h = (p.showroom.rotY * Math.PI) / 360;
    const group = doc.createNode(`showroom-${p.id}`)
      .setTranslation([p.showroom.x, 0, 0])
      .setRotation([0, Math.sin(h), 0, Math.cos(h)]);
    for (const child of scene.listChildren()) group.addChild(child); // re-parenting removes it from the old scene
    room.addChild(group);
  }
  for (const s of doc.getRoot().listScenes()) if (s !== room) s.dispose();
  doc.getRoot().setDefaultScene(room);
  await doc.transform(unpartition(), dedup(), prune()); // GLB needs a single buffer
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await io.write(outPath, doc);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = 'models/showroom.glb';
  await buildShowroom(JSON.parse(fs.readFileSync('products.json', 'utf8')), out);
  console.log(`wrote ${out} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
}
