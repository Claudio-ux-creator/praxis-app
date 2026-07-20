const esbuild = await import('./node_modules/esbuild-wasm/esm/browser.js');

// No worker
await esbuild.initialize({
  wasmURL: new URL('./node_modules/esbuild-wasm/esbuild.wasm', import.meta.url).href,
  worker: false,
});

try {
  const result = await esbuild.build({
    entryPoints: ['./src/main.tsx'],
    bundle: true,
    outfile: './build/bundle.js',
    format: 'iife',
    jsx: 'automatic',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'empty',
    },
    define: { 'process.env.NODE_ENV': '"development"' },
    alias: { '@': './src', '@shared/types': '../shared/types' },
    target: 'es2020',
    platform: 'browser',
  });
  
  if (result.errors?.length) {
    console.error('ERRORS:', result.errors.map(e => e.text).join(', '));
  } else {
    const { statSync } = await import('fs');
    console.log('BUILD SUCCESS:', statSync('./build/bundle.js').size, 'bytes');
  }
} catch (err) {
  console.error('FAILED:', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors));
}
