#!/usr/bin/env bash
set -euo pipefail

BASE="${DIFFWALL_BASE:-origin/main}"
HEAD="${DIFFWALL_HEAD:-HEAD}"
DIFF="${DIFFWALL_DIFF:-}"
CONFIG="${DIFFWALL_CONFIG:-rules/default.yml}"
FORMAT="${DIFFWALL_FORMAT:-markdown}"
FAIL_ON_HALT="${DIFFWALL_FAIL_ON_HALT:-true}"
FAIL_ON_REVIEW="${DIFFWALL_FAIL_ON_REVIEW:-false}"
REQUIRE_CONFIG="${DIFFWALL_REQUIRE_CONFIG:-false}"
QUIET="${DIFFWALL_QUIET:-false}"
CALLER_WORKSPACE="${GITHUB_WORKSPACE:-$PWD}"
ACTION_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACTION_LOG_PATH="$CALLER_WORKSPACE/diffwall-action.log"

: > "$ACTION_LOG_PATH"
exec > >(tee -a "$ACTION_LOG_PATH") 2>&1

echo "DiffWall action root: $ACTION_ROOT"
echo "DiffWall caller workspace: $CALLER_WORKSPACE"
echo "Node: $(node --version)"

if [[ ! -f "$ACTION_ROOT/dist/cli.js" || ! -f "$ACTION_ROOT/dist/github-comment.js" ]]; then
  echo "Committed DiffWall runtime bundle is missing." >&2
  exit 90
fi

case "$FORMAT" in
  json) REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.json" ;;
  text) REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.txt" ;;
  sarif) REPORT_PATH="$CALLER_WORKSPACE/diffwall-report.sarif" ;;
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

if [[ -n "$CONFIG" ]]; then
  CONFIG_PATH="$(node -e 'process.stdout.write(require("node:path").resolve(process.argv[1], process.argv[2]))' "$CALLER_WORKSPACE" "$CONFIG")"
  if [[ -f "$CONFIG_PATH" || "$REQUIRE_CONFIG" == "true" ]]; then
    ARGS+=(--config "$CONFIG_PATH")
  fi
fi
if [[ "$REQUIRE_CONFIG" == "true" ]]; then ARGS+=(--require-config); fi
if [[ "$FAIL_ON_REVIEW" == "true" ]]; then ARGS+=(--fail-on-review); fi

if [[ -n "$FORMAT" ]]; then
  ARGS+=(--format "$FORMAT")
fi

if [[ "$FAIL_ON_HALT" == "true" ]]; then
  ARGS+=(--fail-on-halt)
fi

if [[ "$QUIET" == "true" ]]; then
  ARGS+=(--quiet)
fi

echo "Running committed DiffWall runtime..."
cd "$CALLER_WORKSPACE"
# Separate provenance evidence keeps the existing report schema unchanged.
DIFFWALL_EVIDENCE_CONFIG="${CONFIG_PATH:-}" DIFFWALL_EVIDENCE_BASE="$BASE" DIFFWALL_EVIDENCE_HEAD="$HEAD" node --input-type=commonjs <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const config = process.env.DIFFWALL_EVIDENCE_CONFIG;
function revision(ref, cwd = process.cwd()) {
  try { return execFileSync('git', ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], {cwd, encoding:'utf8', stdio:['ignore','pipe','ignore']}).trim(); }
  catch { return null; }
}
const exists = config && fs.existsSync(config);
fs.writeFileSync('diffwall-policy-evidence.json', JSON.stringify({
  base_sha: revision(process.env.DIFFWALL_EVIDENCE_BASE),
  head_sha: revision(process.env.DIFFWALL_EVIDENCE_HEAD),
  policy_path: config || null,
  policy_sha256: exists ? createHash('sha256').update(fs.readFileSync(config)).digest('hex') : null,
  policy_checkout_sha: exists ? revision('HEAD', path.dirname(config)) : null,
  policy_source: exists ? 'file' : (process.env.DIFFWALL_REQUIRE_CONFIG === 'true' ? 'missing-required' : 'built-in-defaults')
}, null, 2) + '\n');
NODE
set +e
node "$ACTION_ROOT/dist/cli.js" "${ARGS[@]}" | tee "$REPORT_PATH"
SCAN_STATUS=${PIPESTATUS[0]}
set -e
DIFFWALL_SCAN_STATUS="$SCAN_STATUS" DIFFWALL_REPORT_PATH="$REPORT_PATH" node --input-type=commonjs <<'NODE'
const fs = require('node:fs');
const evidence = JSON.parse(fs.readFileSync('diffwall-policy-evidence.json', 'utf8'));
evidence.scan_exit_status = Number(process.env.DIFFWALL_SCAN_STATUS);
evidence.report_path = process.env.DIFFWALL_REPORT_PATH;
fs.writeFileSync('diffwall-policy-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
NODE

if [[ -n "${DIFFWALL_COMMENT_TOKEN:-}" && "$FORMAT" == "markdown" && "$QUIET" != "true" ]]; then
  set +e
  DIFFWALL_REPORT_PATH="$REPORT_PATH" GITHUB_TOKEN="$DIFFWALL_COMMENT_TOKEN" node "$ACTION_ROOT/dist/github-comment.js"
  COMMENT_STATUS=$?
  set -e

  if [[ "$COMMENT_STATUS" -ne 0 ]]; then
    echo "::warning::DiffWall could not publish the PR comment; the enforcement verdict and report remain valid."
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
      cat "$REPORT_PATH" >> "$GITHUB_STEP_SUMMARY"
    fi
  fi
elif [[ -n "${GITHUB_STEP_SUMMARY:-}" && "$FORMAT" == "markdown" && "$QUIET" != "true" ]]; then
  cat "$REPORT_PATH" >> "$GITHUB_STEP_SUMMARY"
fi

echo "DiffWall scan exit status: $SCAN_STATUS"
exit "$SCAN_STATUS"
