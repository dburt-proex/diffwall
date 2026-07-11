#!/usr/bin/env bash
set -euo pipefail

BASE="${DIFFWALL_BASE:-origin/main}"
HEAD="${DIFFWALL_HEAD:-HEAD}"
DIFF="${DIFFWALL_DIFF:-}"
CONFIG="${DIFFWALL_CONFIG:-rules/default.yml}"
FORMAT="${DIFFWALL_FORMAT:-markdown}"
FAIL_ON_HALT="${DIFFWALL_FAIL_ON_HALT:-true}"
QUIET="${DIFFWALL_QUIET:-false}"
CALLER_WORKSPACE="${GITHUB_WORKSPACE:-$PWD}"
ACTION_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

case "$FORMAT" in
  json) REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.json" ;;
  text) REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.txt" ;;
  markdown|*) REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.md" ;;
esac

ARGS=(scan)

if [[ -n "$DIFF" ]]; then
  ARGS+=(--diff "$DIFF")
else
  if [[ -n "$BASE" ]]; then
    ARGS+=(--base "$BASE")
  fi
  if [[ -n "$HEAD" ]]; then
    ARGS+=(--head "$HEAD")
  fi
fi

if [[ -n "$CONFIG" && -f "$CALLER_WORKSPACE/$CONFIG" ]]; then
  ARGS+=(--config "$CALLER_WORKSPACE/$CONFIG")
fi

if [[ -n "$FORMAT" ]]; then
  ARGS+=(--format "$FORMAT")
fi

if [[ "$FAIL_ON_HALT" == "true" ]]; then
  ARGS+=(--fail-on-halt)
fi

if [[ "$QUIET" == "true" ]]; then
  ARGS+=(--quiet)
fi

cd "$ACTION_ROOT"
npm install --no-audit --no-fund
npm run build

cd "$CALLER_WORKSPACE"
set +e
node "$ACTION_ROOT/dist/cli.js" "${ARGS[@]}" | tee "$REPORT_PATH"
SCAN_STATUS=${PIPESTATUS[0]}
set -e

if [[ -n "${DIFFWALL_COMMENT_TOKEN:-}" && "$FORMAT" == "markdown" && "$QUIET" != "true" ]]; then
  DIFFWALL_REPORT_PATH="$REPORT_PATH" GITHUB_TOKEN="$DIFFWALL_COMMENT_TOKEN" node "$ACTION_ROOT/dist/github-comment.js"
elif [[ -n "${GITHUB_STEP_SUMMARY:-}" && "$FORMAT" == "markdown" && "$QUIET" != "true" ]]; then
  cat "$REPORT_PATH" >> "$GITHUB_STEP_SUMMARY"
fi

exit "$SCAN_STATUS"
