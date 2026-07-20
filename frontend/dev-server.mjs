import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;
const BACKEND = 'http://localhost:3000';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const opts = { hostname: 'localhost', port: 3000, path: req.url, method: req.method, headers: { ...req.headers } };
    const p = http.request(opts, (pr) => { res.writeHead(pr.statusCode, pr.headers); pr.pipe(res); });
    req.pipe(p);
    return;
  }

  let urlPath = req.url === '/' ? '/index.html' : req.url;
  let filePath = path.join(__dirname, urlPath);
  if (!fs.existsSync(filePath)) filePath = path.join(__dirname, 'src', urlPath.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) filePath = path.join(__dirname, 'index.html');

  const ext = path.extname(filePath);
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (ext === '.tsx' || ext === '.ts') {
      content = content.replace(/from ['"](.+?)\.(tsx?)['"]/g, "from '$1.js'");
      content = content.replace(/from ['"]@\/(.+?)['"]/g, "from '/src/$1'");
      content = content.replace(/from ['"]@shared\/types['"]/g, "from '/src/types.js'");
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(content);
  } catch (e) {
    res.writeHead(500);
    res.end('Error: ' + (e.message || e));
  }
}).listen(PORT, () => console.log('Frontend: http://localhost:' + PORT));
