import { Worker } from 'node:worker_threads';
globalThis.Worker = Worker;

// Use the ESM version of esbuild-wasm
const esbuild = await import('./node_modules/esbuild-wasm/esm/browser.js');

// Initialize WASM - the wasm file is right there
await esbuild.initialize({
  wasmURL: new URL('./node_modules/esbuild-wasm/esbuild.wasm', import.meta.url).href,
  worker: true,
});

// Build everything into a single IIFE bundle
try {
  const result = await esbuild.build({
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
    target: 'es2020',
    platform: 'browser',
  });
  
  if (result.errors?.length) {
    console.error('BUILD ERRORS:');
    for (const err of result.errors) {
      console.error(`  ${err.text} (${err.location?.file}:${err.location?.line})`);
    }
  } else {
    const { statSync } = await import('fs');
    const size = statSync('./build/bundle.js').size;
    console.log(`BUILD SUCCESS: ${size} bytes to build/bundle.js`);
  }
} catch (err) {
  console.error('BUILD FAILED:', err.message || err);
  if (err.errors) console.error(JSON.stringify(err.errors, null, 2));
}
