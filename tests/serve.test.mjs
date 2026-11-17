import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../scripts/serve.mjs';

let s;
before(async () => { s = await startServer({ port: 0, host: '127.0.0.1' }); });
after(() => s.close());

test('serves json with json type', async () => {
  const r = await fetch(`${s.url}/products.json`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /^application\/json/);
});
test('serves glb as model/gltf-binary', async () => {
  const r = await fetch(`${s.url}/models/SheenChair.glb`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'model/gltf-binary');
  await r.arrayBuffer();
});
test('404 for missing file', async () => assert.equal((await fetch(`${s.url}/nope.html`)).status, 404));
test('no escape from root', async () => {
  assert.equal((await fetch(`${s.url}/..%2f..%2fWindows/win.ini`)).status, 404);
  assert.equal((await fetch(`${s.url}/.git/config`)).status, 404);
});
