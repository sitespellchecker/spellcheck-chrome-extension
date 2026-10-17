#!/usr/bin/env bash
# Build the Chrome Web Store zip from an explicit allowlist of runtime files. The old release.yml
# zipped the whole checkout minus a few patterns, so .agents/, .cursor/, package.json and
# lib/dict-worker.js (unused) shipped to the store too.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(node -p "require('$root/manifest.json').version")"
out="${1:-$root/dist/site-spellchecker-$version.zip}"
mkdir -p "$(dirname "$out")"
out="$(cd "$(dirname "$out")" && pwd)/$(basename "$out")"
files=(
  manifest.json
  popup.html popup.css popup.js
  content.js content.css
  lib/typo.js lib/en_US.aff lib/en_US.dic
  icons/icon16.png icons/icon48.png icons/icon128.png
)
rm -f "$out"
(cd "$root" && zip -qX "$out" "${files[@]}")
echo "Created $out"
