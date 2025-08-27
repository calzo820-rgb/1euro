// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const COUNT_PATH = path.join(ROOT, 'count.json');
const PORT = process.env.PORT || 3000;

// Assicura che count.json esista e sia valido
function ensureCountFile() {
  try {
    if (!fs.existsSync(COUNT_PATH)) {
      fs.writeFileSync(COUNT_PATH, JSON.stringify({ count: 0 }, null, 2));
    } else {
      const raw = fs.readFileSync(COUNT_PATH, 'utf8').trim() || '{"count":0}';
      let obj;
      try { obj = JSON.parse(raw); } catch { obj = { count: 0 }; }
      if (typeof obj !== 'object' || typeof obj.count !== 'number') obj = { count: 0 };
      fs.writeFileSync(COUNT_PATH, JSON.stringify(obj, null, 2));
    }
  } catch (e) {
    console.error('ensureCountFile error:', e);
  }
}

function readCount() {
  try {
    const data = JSON.parse(fs.readFileSync(COUNT_PATH, 'utf8'));
    return typeof data.count === 'number' ? data.count : 0;
  } catch (e) {
    console.error('readCount error:', e);
    return 0;
  }
}

function writeCount(n) {
  try {
    fs.writeFileSync(COUNT_PATH, JSON.stringify({ count: n }, null, 2), 'utf8');
  } catch (e) {
    console.error('writeCount error:', e);
  }
}

function contentType(p) {
  const ext = path.extname(p).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
  }[ext] || 'text/plain; charset=utf-8');
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(body);
}

ensureCountFile();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // API
  if (req.method === 'GET' && pathname === '/count') {
    return send(res, 200, JSON.stringify({ count: readCount() }), { 'Content-Type': 'application/json' });
  }
  if (req.method === 'POST' && pathname === '/increment') {
    const n = readCount() + 1;
    writeCount(n);
    return send(res, 200, JSON.stringify({ count: n }), { 'Content-Type': 'application/json' });
  }

  // Static routing
  let filePath;
  if (pathname === '/' || pathname === '/index.html') filePath = path.join(ROOT, 'index.html');
  else if (pathname === '/count.html') filePath = path.join(ROOT, 'count.html');
  else {
    // eventuali asset futuri
    const candidate = path.join(ROOT, pathname);
    if (!candidate.startsWith(ROOT)) return send(res, 400, 'Bad request');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) filePath = candidate;
    else return send(res, 404, 'Not found');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Server error');
    send(res, 200, data, { 'Content-Type': contentType(filePath) });
  });
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`));
