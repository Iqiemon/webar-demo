// Generates models/Table.glb: a simple wooden coffee table (1 x 0.5 x 0.45 m), original work. npm run model:table
import { Document, NodeIO } from '@gltf-transform/core';

const doc = new Document();
const buf = doc.createBuffer();
const wood = doc.createMaterial('oak').setBaseColorFactor([0.62, 0.42, 0.24, 1]).setRoughnessFactor(0.6).setMetallicFactor(0);

function box(name, [w, h, d], [x, y, z]) {
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
  const prim = doc.createPrimitive().setMaterial(wood)
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(pos)).setBuffer(buf))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(nor)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(idx)).setBuffer(buf));
  return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)).setTranslation([x, y, z]);
}

const scene = doc.createScene('table');
scene.addChild(box('top', [1, 0.04, 0.5], [0, 0.43, 0]));
for (const [i, [x, z]] of [[-0.44, -0.19], [0.44, -0.19], [-0.44, 0.19], [0.44, 0.19]].entries())
  scene.addChild(box(`leg${i}`, [0.05, 0.41, 0.05], [x, 0.205, z]));
await new NodeIO().write('models/Table.glb', doc);
console.log('wrote models/Table.glb');
