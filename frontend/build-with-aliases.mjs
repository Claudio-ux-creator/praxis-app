import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC = './src';
const TMP = './tmp-build';
const OUT = './public/build';

// Clean
for (const d of [TMP, OUT]) {
  if (fs.existsSync(d)) fs.rmSync(d, { recursive: true });
}

// Copy all files from src to tmp-build
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      let content = fs.readFileSync(s, 'utf-8');
      
      // Replace @/ imports with relative paths relative to file location
      content = content.replace(
        /from ['"]@\//g,
        (match) => {
          // Calculate relative path from current file to src/
          const relFromSrc = path.relative(path.dirname(s), SRC).replace(/\\/g, '/');
          return `from '${relFromSrc.startsWith('.') ? relFromSrc : './' + relFromSrc}/`;
        }
      );
      
      // Replace @shared/types/ imports
      content = content.replace(
        /from ['"]@shared\/types(\/[^'"]*)?['"]/g,
        (match, subpath) => {
          const relFromSrc = path.relative(path.dirname(s), SRC).replace(/\\/g, '/');
          const base = relFromSrc.startsWith('.') ? relFromSrc : './' + relFromSrc;
          const target = subpath ? `../shared/types${subpath}` : '../shared/types';
          const relToShared = path.relative(path.dirname(s), path.resolve('..', 'shared', 'types')).replace(/\\/g, '/');
          return `from '${relToShared.startsWith('.') ? relToShared : './' + relToShared}${subpath || ''}'`;
        }
      );
      
      // Write to temp
      const tmpFile = path.join(dest, entry.name);
      fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
      fs.writeFileSync(tmpFile, content, 'utf-8');
    }
  }
}

copyDir(SRC, TMP);

// Also copy shared types
const SHARED = '../shared/types';
if (fs.existsSync(SHARED)) {
  copyDir(SHARED, './tmp-build/shared-types');
}

console.log('Files copied, compiling...');

// Run tsc
const tscPath = './node_modules/.bin/tsc';
execSync(`"${tscPath}" --project tsconfig.build2.json`, { stdio: 'inherit', cwd: '.' });
