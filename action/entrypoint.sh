#!/usr/bin/env bash
set -euo pipefail

BASE="${DIFFWALL_BASE:-origin/main}"
HEAD="${DIFFWALL_HEAD:-HEAD}"
CONFIG="${DIFFWALL_CONFIG:-rules/default.yml}"
FAIL_ON_HALT="${DIFFWALL_FAIL_ON_HALT:-true}"

ARGS=(scan --base "$BASE" --head "$HEAD" --format markdown)

if [[ -f "$CONFIG" ]]; then
  ARGS+=(--config "$CONFIG")
fi

if [[ "$FAIL_ON_HALT" == "true" ]]; then
  ARGS+=(--fail-on-halt)
fi

if [[ -f package.json ]] && grep -q '"name": "diffwall"' package.json; then
  npm install
  npm run build
  node dist/cli.js "${ARGS[@]}" | tee diffwall-report.md
else
  npx diffwall "${ARGS[@]}" | tee diffwall-report.md
fi

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  cat diffwall-report.md >> "$GITHUB_STEP_SUMMARY"
fi
