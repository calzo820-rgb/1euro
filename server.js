const http = require('http');
const fs = require('fs');
const path = require('path');

// Path to the JSON file that stores the count
const countFile = path.join(__dirname, 'count.json');

/**
 * Read the current count from count.json.
 * If the file doesn't exist or can't be parsed, returns 0.
 * @returns {number}
 */
function readCount() {
  try {
    const data = fs.readFileSync(countFile, 'utf8');
    const parsed = JSON.parse(data);
    return typeof parsed.count === 'number' ? parsed.count : 0;
  } catch (err) {
    return 0;
  }
}

/**
 * Write a new count value to count.json.
 * @param {number} count
 */
function writeCount(count) {
  fs.writeFileSync(countFile, JSON.stringify({ count }), 'utf8');
}

// Create the HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers to allow cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { method, url } = req;

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Route: GET /count returns the current count
  if (method === 'GET' && url === '/count') {
    const currentCount = readCount();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: currentCount }));
    return;
  }

  // Route: POST /increment increments the count and returns the new value
  if (method === 'POST' && url === '/increment') {
    // Consume request body (if any) and ignore it
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const currentCount = readCount();
      const newCount = currentCount + 1;
      writeCount(newCount);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ count: newCount }));
    });
    return;
  }

  // Any other route: 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Start listening on port 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Count server running at http://localhost:${PORT}/`);
});
// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const countFile = path.join(ROOT, 'count.json');

// Funzioni contatore
function readCount() {
  try { return JSON.parse(fs.readFileSync(countFile, 'utf8')).count || 0; }
  catch { return 0; }
}
function writeCount(n) {
  fs.writeFileSync(countFile, JSON.stringify({ count: n }, null, 2), 'utf8');
}

// Mime types
function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  }[ext] || 'text/plain; charset=utf-8';
}

// Helper
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(body);
}

// Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  // API
  if (req.method === 'GET' && pathname === '/count') {
    return send(res, 200, JSON.stringify({ count: readCount() }), { 'Content-Type': 'application/json' });
  }
  if (req.method === 'POST' && pathname === '/increment') {
    const n = readCount() + 1;
    writeCount(n);
    return send(res, 200, JSON.stringify({ count: n }), { 'Content-Type': 'application/json' });
  }

  // Static: / → index.html
  let filePath;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(ROOT, 'index.html');
  } else if (pathname === '/count.html') {
    filePath = path.join(ROOT, 'count.html');
  } else {
    return send(res, 404, 'Not found');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 500, 'Server error');
    send(res, 200, data, { 'Content-Type': contentType(filePath) });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
