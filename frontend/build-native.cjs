const { execSync } = require("child_process");
const path = require("path");

const esbuildPath = path.join(__dirname, "node_modules", "@esbuild", "win32-x64", "esbuild.exe");
const cwd = __dirname;

const cmd = [
  `"${esbuildPath}"`,
  "./src/main.tsx",
  "--bundle",
  "--outfile=./build/app.js",
  "--format=iife",
  "--global-name=PraxisApp",
  "--jsx=automatic",
  "--loader:.tsx=tsx",
  "--loader:.ts=ts",
  "--loader:.css=empty",
  `--define:process.env.NODE_ENV="production"`,
  "--alias:@=./src",
  "--alias:@shared/types=../shared/types",
].join(" ");

try {
  execSync(cmd, { cwd, stdio: "inherit" });
  console.log("✅ Build erfolgreich: build/app.js");
} catch (e) {
  console.error("❌ Build fehlgeschlagen");
  process.exit(1);
}
