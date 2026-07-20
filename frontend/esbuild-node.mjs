// Worker-Polyfill für Node.js (esbuild-wasm braucht Web Workers)
import { Worker as NodeWorker } from 'node:worker_threads';
globalThis.Worker = NodeWorker;

// Lade esbuild-wasm browser.js (WASM-Version, KEINE native Binary)
const esbuildUrl = new URL('./node_modules/esbuild-wasm/lib/browser.js', import.meta.url).href;
const mod = await import(esbuildUrl);
export const esbuild = mod.default || mod;
