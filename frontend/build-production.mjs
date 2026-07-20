import esbuild from 'esbuild';

const result = await esbuild.build({
  entryPoints: ['./src/main.tsx'],
  bundle: true,
  outfile: './build/app.js',
  format: 'iife',
  globalName: 'PraxisApp',
  jsx: 'automatic',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'empty',
  },
  define: {
    'process.env.NODE_ENV': '\"production\"',
  },
  alias: {
    '@': './src',
    '@shared/types': '../shared/types',
  },
  minify: false,
  sourcemap: false,
});

if (result.errors.length > 0) {
  console.error('Build errors:', JSON.stringify(result.errors, null, 2));
  process.exit(1);
}
if (result.warnings.length > 0) {
  console.warn('Warnings:', JSON.stringify(result.warnings, null, 2));
}
console.log('? Build erfolgreich: build/app.js');
