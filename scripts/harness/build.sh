#!/usr/bin/env bash
# build di sviluppo per l'harness: hook window.__*, sourcemap e niente minify (nomi delle classi e stack leggibili)
# uso: scripts/harness/build.sh [cartella del progetto, default questa]
set -euo pipefail
cd "${1:-$(dirname "$0")/../..}"
NODE_ENV=development npx vite build --outDir dist-dev --emptyOutDir --sourcemap --minify false --logLevel error
