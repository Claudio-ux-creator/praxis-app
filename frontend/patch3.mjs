import fs from "fs";

let mainJs = fs.readFileSync("node_modules/esbuild/lib/main.js", "utf-8");
mainJs = mainJs.replace(
  'child_process.spawn(command, args.concat(`${serviceFlag}`, `${pingFlag}`)',
  "child_process.spawn('cmd', ['/c', command].concat(args.concat(`${serviceFlag}`, `${pingFlag}`)))"
);
fs.writeFileSync("node_modules/esbuild/lib/main.js", mainJs, "utf-8");
console.log("1. OK");

let chunk = fs.readFileSync("node_modules/vite/dist/node/chunks/dep-h78lQ5BT.js", "utf-8");
chunk = chunk.replace(
  "import esbuild, { transform as transform$2, formatMessages, build as build$3 } from 'esbuild';",
  "import esbuild from 'esbuild'; const { transform: transform$2, formatMessages, build: build$3 } = esbuild;"
);
fs.writeFileSync("node_modules/vite/dist/node/chunks/dep-h78lQ5BT.js", chunk, "utf-8");
console.log("2. OK");