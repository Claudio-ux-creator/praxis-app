import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  root: '.',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [],
  esbuild: true,
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    esbuild: {
      platform: 'browser',
      target: 'es2020',
    },
  },
});

await server.listen();
console.log('Frontend: http://localhost:5173');
