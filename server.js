import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Normalize URL path
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Prevent directory traversal attacks
  if (!filePath.startsWith(__dirname)) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve index.html for SPA-like routes if requested file not found and doesn't have an extension
        if (!ext) {
          const fallbackPath = path.join(__dirname, 'index.html');
          fs.readFile(fallbackPath, (fallbackErr, fallbackContent) => {
            if (fallbackErr) {
              res.statusCode = 500;
              res.end('Server Error');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallbackContent, 'utf-8');
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(`File Not Found: ${req.url}`);
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
  console.log(`\x1b[32m%s\x1b[0m`, `  GRAFYXORA 2026 AAA Portal Running!`);
  console.log(`\x1b[35m%s\x1b[0m`, `  Local URL: http://localhost:${PORT}`);
  console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
});
