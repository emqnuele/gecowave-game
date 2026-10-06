#!/usr/bin/env bash
# banco di prova offline del generatore di regioni: bundla uno script con esbuild e lo esegue in node
# uso: scripts/world/run.sh report all 1      (tutte le regioni, 1 tentativo ciascuna)
#      scripts/world/run.sh first-break perduta
set -euo pipefail
cd "$(dirname "$0")/../.."
name="$1"; shift
out="${TMPDIR:-/tmp}/gecowave-world-$name.mjs"
npx esbuild "scripts/world/$name.ts" --bundle --platform=node --format=esm --outfile="$out" --log-level=warning
node "$out" "$@"
