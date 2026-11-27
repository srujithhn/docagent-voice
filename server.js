// A small static server with no dependencies. It serves the app in public/
// and a health check. No API keys are read or needed.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  // The page needs the microphone for voice input, and nothing else.
  'Permissions-Policy': 'microphone=(self), camera=(), geolocation=()',
};

function send(res, status, body, type) {
  res.writeHead(status, { ...HEADERS, 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

export function resolvePath(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  const clean = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(ROOT, clean === '/' || clean === '\\' ? 'index.html' : clean);
  return full.startsWith(ROOT) ? full : null;
}

export const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
    return;
  }
  if (req.url === '/api/health') {
    send(res, 200, JSON.stringify({ ok: true, keysNeeded: false }), TYPES['.json']);
    return;
  }
  const file = resolvePath(req.url);
  if (!file) {
    send(res, 400, 'Bad request', 'text/plain; charset=utf-8');
    return;
  }
  fs.stat(file, (err, stat) => {
    const target = !err && stat.isDirectory() ? path.join(file, 'index.html') : file;
    fs.readFile(target, (readErr, body) => {
      if (readErr) {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      send(res, 200, req.method === 'HEAD' ? '' : body, TYPES[path.extname(target)] || 'application/octet-stream');
    });
  });
});

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  server.listen(PORT, () => {
    console.log(`DocAgent Voice is running on http://localhost:${PORT}`);
  });
}
