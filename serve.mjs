#!/usr/bin/env node
// Zero-dependency static file server for local preview of ./docs — just
// Node's built-ins, no extra package needed for something this simple.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE } from './site.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'docs');
const PORT = process.env.PORT || 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Requests come in prefixed with BASE (e.g. /lld-patterns-hub/solid/), just
  // like they will on GitHub Pages — strip it so we can find the file on disk.
  if (reqPath === BASE || reqPath === `${BASE}/`) {
    reqPath = '/';
  } else if (reqPath.startsWith(`${BASE}/`)) {
    reqPath = reqPath.slice(BASE.length);
  } else if (reqPath === '/') {
    // Root without the base prefix: redirect so links resolve the same way they will in production.
    res.writeHead(302, { Location: `${BASE}/` });
    res.end();
    return;
  }

  if (reqPath.endsWith('/')) reqPath += 'index.html';

  let filePath = path.join(ROOT, reqPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fall back to 404.html, mirroring how GitHub Pages serves it.
      fs.readFile(path.join(ROOT, '404.html'), (err2, data404) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(err2 ? 'Not found' : data404);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Serving ./docs at http://localhost:${PORT}/lld-patterns-hub/`);
  console.log('(the /lld-patterns-hub/ prefix matches how GitHub Pages will serve this repo)');
});
