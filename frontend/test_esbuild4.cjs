const path = require('path');
const wasmPath = path.resolve(process.cwd(), 'node_modules/esbuild-wasm/lib/main.js');
console.log('wasm path:', wasmPath);
try {
  const e = require(wasmPath);
  console.log('esbuild-wasm loaded:', typeof e.build, typeof e.initialize);
} catch(err) {
  console.error('Error:', err.message);
}
