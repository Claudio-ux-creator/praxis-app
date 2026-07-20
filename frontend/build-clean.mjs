import { Worker } from 'node:worker_threads';
globalThis.Worker = Worker;

// Use esbuild-wasm
const { build } = await import('esbuild-wasm/lib/browser.js');

await build({
  entryPoints: ['./src/main.tsx'],
  bundle: true,
  outfile: './build/bundle.js',
  format: 'iife',
  jsx: 'automatic',
  jsxImportSource: 'react',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'empty',
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  alias: {
    '@': './src',
    '@shared/types': '../shared/types',
  },
  external: [],
  plugins: [],
}).then(result => {
  console.log('Build success:', Object.keys(result));
  if (result.errors?.length) {
    console.error('Errors:', result.errors);
  }
}).catch(err => {
  console.error('Build failed:', err.message || err);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
});
