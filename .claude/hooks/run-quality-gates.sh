#!/usr/bin/env bash
# Full quality gate. Wire to a Stop hook or run manually.
set -uo pipefail
fail=0
run() { echo "→ $*"; "$@" || fail=1; }
# Placeholders are replaced by claude-kit init.
run [LINT_COMMAND]
run [TEST_COMMAND]
run [BUILD_COMMAND]
if [ "$fail" -ne 0 ]; then echo "✖ Quality gates failed." >&2; exit 2; fi
echo "✔ All quality gates passed."
