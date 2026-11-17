// Static dev server. `npm start` serves the project on http://localhost:8080 (PORT env overrides).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml',
};

export function startServer({ port = 8080, root = process.cwd(), host = '0.0.0.0' } = {}) {
  root = path.resolve(root);
  const notFound = res => { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); };
  const server = http.createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return notFound(res); }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(root, '.' + rel);
    // Stay inside root and never serve dot-folders (.git, .superpowers).
    if (!file.startsWith(root + path.sep) || path.relative(root, file).split(path.sep).some(s => s.startsWith('.'))) return notFound(res);
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return notFound(res);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': st.size });
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise(resolve => server.listen(port, host, () => resolve({
    url: `http://${host === '0.0.0.0' ? 'localhost' : host}:${server.address().port}`,
    close: () => new Promise(r => { server.closeAllConnections(); server.close(r); }),
  })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startServer({ port: Number(process.env.PORT) || 8080 });
  console.log(`Serving on ${url} (also on this machine's LAN address)`);
}
