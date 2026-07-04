#!/usr/bin/env bash
# Block commits/edits that introduce obvious secrets. Exit non-zero to block.
set -euo pipefail
pattern='(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[0-9A-Za-z-]+|ghp_[0-9A-Za-z]{36})'
target="${1:-.}"
if grep -REn --binary-files=without-match "$pattern" "$target" \
     --exclude-dir=.git --exclude-dir=node_modules 2>/dev/null; then
  echo "✖ Potential secret detected. Remove it before continuing." >&2
  exit 2
fi
exit 0
