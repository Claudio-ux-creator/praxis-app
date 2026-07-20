import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const e = require('esbuild');
console.log('esbuild via ESM wrapper:', typeof e.build);
