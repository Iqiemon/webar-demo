import { Document, NodeIO } from '@gltf-transform/core';

const doc = new Document();
const buf = doc.createBuffer();
const linen = doc.createMaterial('linen').setBaseColorFactor([0.42, 0.48, 0.36, 1]).setRoughnessFactor(0.9).setMetallicFactor(0);
const oak = doc.createMaterial('oak').setBaseColorFactor([0.60, 0.42, 0.26, 1]).setRoughnessFactor(0.6).setMetallicFactor(0);

function box(name, [w, h, d], [x, y, z], material) {
  const [hx, hy, hz] = [w / 2, h / 2, d / 2];
  const pos = [], nor = [], idx = [];
  // each face: normal, then 4 corners counter-clockwise seen from outside
  const faces = [
    [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
    [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
    [[1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]]],
    [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
    [[0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]]],
    [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
  ];
  faces.forEach(([n, corners], f) => {
    corners.forEach(c => { pos.push(c[0] * hx, c[1] * hy, c[2] * hz); nor.push(...n); });
    idx.push(f * 4, f * 4 + 1, f * 4 + 2, f * 4, f * 4 + 2, f * 4 + 3);
  });
  const prim = doc.createPrimitive().setMaterial(material)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buf))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(idx)).setBuffer(buf));
  return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)).setTranslation([x, y, z]);
}

const scene = doc.createScene('sofa');
for (const [i, [x, z]] of [[-0.70, -0.32], [0.70, -0.32], [-0.70, 0.32], [0.70, 0.32]].entries())
  scene.addChild(box(`leg${i}`, [0.06, 0.10, 0.06], [x, 0.05, z], oak));
scene.addChild(box('frame', [1.58, 0.24, 0.80], [0, 0.22, 0], linen));
for (const [i, x] of [-0.38, 0.38].entries())
  scene.addChild(box(`seat${i}`, [0.74, 0.12, 0.66], [x, 0.40, 0.05], linen));
scene.addChild(box('backrest', [1.58, 0.50, 0.16], [0, 0.59, -0.32], linen));
for (const [i, x] of [-0.38, 0.38].entries())
  scene.addChild(box(`back${i}`, [0.72, 0.34, 0.12], [x, 0.63, -0.21], linen));
for (const [i, x] of [-0.72, 0.72].entries())
  scene.addChild(box(`arm${i}`, [0.14, 0.36, 0.80], [x, 0.52, 0], linen));
await new NodeIO().write('models/SageLinenSofa.glb', doc);
console.log('wrote models/SageLinenSofa.glb');
