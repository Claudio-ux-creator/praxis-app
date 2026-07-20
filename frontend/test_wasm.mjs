import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const wasm = require('esbuild-wasm/lib/browser.js');
console.log('exports:', Object.keys(wasm));
console.log('initialize:', typeof wasm.initialize);
console.log('build:', typeof wasm.build);
