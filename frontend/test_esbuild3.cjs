const path = require('path');
const esbuildPath = path.resolve(process.cwd(), 'node_modules/esbuild/lib/main.js');
console.log('esbuild path:', esbuildPath);
try {
  const e = require(esbuildPath);
  console.log('esbuild loaded:', typeof e.build);
} catch(err) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack?.substring(0, 500));
}
