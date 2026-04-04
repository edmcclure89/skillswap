const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BUILD_DIR = path.join(__dirname, 'build');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  try {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = filePath.split('?')[0];
    const fullPath = path.join(BUILD_DIR, filePath);

    if (!fullPath.startsWith(BUILD_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.stat(fullPath, (err, stats) => {
      try {
        if (err) {
          if (path.extname(fullPath) === '') {
            serveFile(res, path.join(BUILD_DIR, 'index.html'));
          } else {
            res.writeHead(404);
            res.end('Not Found');
          }
          return;
        }

        if (stats.isDirectory()) {
          serveFile(res, path.join(fullPath, 'index.html'));
        } else {
          serveFile(res, fullPath);
        }
      } catch (statErr) {
        console.error('Error in stat callback:', statErr);
        res.writeHead(500);
        res.end('Server error');
      }
    });
  } catch (requestErr) {
    console.error('Error handling request:', requestErr);
    res.writeHead(500);
    res.end('Server error');
  }
});

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    try {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com; font-src 'self' data:"
      });
      res.end(data);
    } catch (serveErr) {
      console.error('Error serving file:', serveErr);
      if (!res.writableEnded) {
        res.writeHead(500);
        res.end('Server error');
      }
    }
  });
}

server.listen(PORT, () => {
  console.log(`SkillSwap server running at http://localhost:${PORT}`);
  console.log(`Serving from: ${BUILD_DIR}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
