import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = await createServer({
  configFile: false,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared/types": path.resolve(__dirname, "../shared/types"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    disabled: true,
    esbuild: false,
  },
  build: { minify: false },
  ssr: { noExternal: true },
});

await server.listen();
console.log("Frontend läuft auf http://localhost:5173");
