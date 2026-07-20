@echo off
set NODE_OPTIONS=--require=%TMP%\fix-spawn.cjs --experimental-require-module
cd /d "C:\Uni\8. Semester\Smart Applications\App\frontend"
npx vite --host
