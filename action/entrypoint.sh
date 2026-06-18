#!/usr/bin/env bash
set -euo pipefail

BASE="${DIFFWALL_BASE:-origin/main}"
HEAD="${DIFFWALL_HEAD:-HEAD}"
CONFIG="${DIFFWALL_CONFIG:-rules/default.yml}"
FAIL_ON_HALT="${DIFFWALL_FAIL_ON_HALT:-true}"
CALLER_WORKSPACE="${GITHUB_WORKSPACE:-$PWD}"
ACTION_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.md"

ARGS=(scan --base "$BASE" --head "$HEAD" --format markdown)

if [[ -f "$CALLER_WORKSPACE/$CONFIG" ]]; then
  ARGS+=(--config "$CALLER_WORKSPACE/$CONFIG")
fi

if [[ "$FAIL_ON_HALT" == "true" ]]; then
  ARGS+=(--fail-on-halt)
fi

cd "$ACTION_ROOT"
npm install --no-audit --no-fund
npm run build

cd "$CALLER_WORKSPACE"
node "$ACTION_ROOT/dist/cli.js" "${ARGS[@]}" | tee "$REPORT_PATH"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat "$REPORT_PATH" >> "$GITHUB_STEP_SUMMARY"
fi
