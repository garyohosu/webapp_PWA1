const http = require('http');
const fs = require('fs');
const path = require('path');

function normalizeBase(base) {
  if (!base || base === '/') {
    return '/';
  }

  return `/${base.replace(/^\/+|\/+$/g, '')}/`;
}

function stripBase(pathname, base) {
  if (base !== '/' && pathname.startsWith(base)) {
    return pathname.slice(base.length - 1) || '/';
  }

  return pathname;
}

const BASE = normalizeBase(process.env.VITE_BASE || '/');
const DIST_DIR = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, 'http://localhost');
  const normalizedPath = stripBase(requestUrl.pathname, BASE);
  const relativePath = normalizedPath === '/' ? 'index.html' : normalizedPath.replace(/^\/+/, '');
  let filePath = path.join(DIST_DIR, relativePath);
  const hasExtension = path.extname(normalizedPath) !== '';

  if (!fs.existsSync(filePath)) {
    if (hasExtension) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    filePath = path.join(DIST_DIR, 'index.html');
  } else if (fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
    case '.webmanifest': contentType = 'application/manifest+json'; break;
  }
  
  // Service Workerに Cache-Control: no-store を設定
  if (normalizedPath === '/sw.js') {
    res.setHeader('Cache-Control', 'no-store');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 8081;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running at http://0.0.0.0:${PORT}/`);
});
