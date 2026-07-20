import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3003;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
};
let sucrase;
try {
  const mod = await import('sucrase');
  sucrase = mod.default || mod;
  console.log('Sucrase loaded');
} catch(e) {
  console.error('Sucrase not available:', e.message);
  process.exit(1);
}
function transpile(filePath, content) {
  const ext = path.extname(filePath);
  if (ext !== '.tsx' && ext !== '.ts') return content;
  try {
    const res = sucrase.transform(content, {
      transforms: ['typescript', 'jsx'],
      jsxPragma: 'React.createElement',
      jsxFragmentPragma: 'React.Fragment',
      production: false,
    });
    let code = res.code;
    code = code.replace(/from\s+["']@\/([^"']+)["']/g, "from '/src/$1'");
    code = code.replace(/from\s+["']@shared\/types(\/[^"']*)?["']/g, (m, sub) => "from '/shared-types" + (sub || '') + "'");
    code = code.replace(/\.(tsx|ts)(["'])/g, '.js$2');
    code = code.replace(/(from["' ]+)(\.\.?\/[^"']+?)(["'])/g, (m, pre, p, q2) => {
      if (p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.json')) return m;
      return pre + p + '.js' + q2;
    });
    return code;
  } catch(e) {
    console.error('Transpile error in', filePath + ':', e.message);
    return 'console.error("Transpile error");\nexport {};';
  }
}
http.createServer((req, res) => {
  try {
    if (req.url.startsWith('/api/')) {
      const opts = { hostname: 'localhost', port: 3000, path: req.url, method: req.method, headers: { ...req.headers } };
      const p = http.request(opts, (pr) => { res.writeHead(pr.statusCode, pr.headers); pr.pipe(res); });
      req.pipe(p);
      return;
    }
    const urlPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url);
    let filePath = path.join(__dirname, urlPath);
    if (!fs.existsSync(filePath)) {
      const srcPath = path.join(__dirname, 'src', urlPath.replace(/^\//, ''));
      if (fs.existsSync(srcPath)) filePath = srcPath;
    }
    if (!fs.existsSync(filePath)) {
      const nmPath = path.join(__dirname, 'node_modules', urlPath);
      if (fs.existsSync(nmPath)) filePath = nmPath;
    }
    if (!fs.existsSync(filePath) && urlPath.startsWith('/shared-types')) {
      const sp = path.join(__dirname, '..', 'shared', 'types', urlPath.replace('/shared-types/', ''));
      if (fs.existsSync(sp)) filePath = sp;
    }
    if (!fs.existsSync(filePath) && urlPath.endsWith('.js')) {
      const tsxPath = filePath.replace(/\.js$/, '.tsx');
      const tsPath = filePath.replace(/\.js$/, '.ts');
      if (fs.existsSync(tsxPath)) filePath = tsxPath;
      else if (fs.existsSync(tsPath)) filePath = tsPath;
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + urlPath);
      return;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    content = transpile(filePath, content);
    const ext = path.extname(filePath);
    const mime = (ext === '.tsx' || ext === '.ts') ? 'application/javascript; charset=utf-8' : (MIME[ext] || 'text/plain');
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch(e) {
    console.error('Error:', req.url, e.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error: ' + e.message);
    }
  }
}).listen(PORT, () => {
  console.log('Frontend: http://localhost:' + PORT);
});