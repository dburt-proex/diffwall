# DiffWall GitHub Action

DiffWall includes a composite GitHub Action at:

```text
action/action.yml
```

Use it from another repository with:

```yaml
uses: dburt-proex/diffwall/action@v0.2.0
```

The action has been validated in real `REVIEW` and `HALT` pull-request workflows. Use the immutable `v0.2.0` tag for controlled evaluation and pilots.

---

## Recommended PR workflow

```yaml
name: DiffWall

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  diffwall:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v7
        with:
          node-version: 20

      - name: Run DiffWall
        uses: dburt-proex/diffwall/action@v0.2.0
        with:
          base: ${{ github.event.pull_request.base.sha }}
          head: HEAD
          config: rules/default.yml
          format: markdown
          fail_on_halt: true
          github_token: ${{ github.token }}
```

This workflow:

- scans against the pull request's immutable base commit,
- generates a markdown report,
- creates or updates one marked PR comment,
- routes low-risk changes to `ALLOW`, impactful changes to `REVIEW`, and critical changes to `HALT`,
- exits non-zero when `fail_on_halt` is enabled and the route is `HALT`.

If no token is provided, DiffWall appends markdown to the job step summary when available. A PR-comment delivery failure does not replace or corrupt the enforcement verdict.

Forked pull requests may receive a read-only token depending on repository settings. In that case, retain artifact or step-summary reporting and treat the comment as best-effort delivery.

---

## Inputs

| Input | Default | Purpose |
|---|---|---|
| `base` | `origin/main` | Base git ref or immutable commit SHA for the diff. |
| `head` | `HEAD` | Head git ref for the diff. |
| `diff` | empty | Optional path to a unified diff file. Overrides base/head. |
| `config` | `rules/default.yml` | Path to caller-repo policy file. If missing, built-in defaults are used. |
| `format` | `markdown` | `text`, `json`, `markdown`, or `sarif`. |
| `fail_on_halt` | `true` | Exit non-zero when route is `HALT`. |
| `quiet` | `false` | Print only the final route decision. |
| `github_token` | empty | Optional token for PR comment updates. |

---

## Local equivalent

```bash
npm ci
npm run build
npx tsx src/cli.ts scan --base origin/main --head HEAD --format markdown --fail-on-halt
```

---

## Current maturity

The composite action is live-validated for loading, scanning, evidence generation, PR comment creation/update, `REVIEW` routing, and `HALT` enforcement without dependency installation in the caller repository. In the controlled HALT proof, the report and comment were published before the workflow failed as designed. TypeScript and Python CI jobs also generate ALLOW / REVIEW / HALT evidence artifacts.

The next assurance gate is external validation across representative repositories and additional monorepo shapes.

## Hardened integration (unreleased)

The controls below are available only on a reviewed commit containing this hardening,
not the existing v0.2.0 release. Replace the marked action-ref placeholder with its
exact reviewed commit SHA before using this example. No new release is implied.

| Control | Default | Opt-in behavior |
|---|---|---|
| `require_config` | `false` | Missing, incomplete, or malformed policy fails with exit 1; no built-in fallback. |
| `fail_on_review` | `false` | REVIEW reports are produced before exit 3. This does not grant or verify human approval. |

CLI equivalents are `--require-config` and `--fail-on-review`. HALT remains exit 2
when `fail_on_halt` is enabled. Enable both route flags for hardened enforcement.
Existing invocations retain their previous defaults and report schema.

Required policy format is the documented block subset: all four sections
(`thresholds`, `ignorePaths`, `protectedPaths`, `haltPatterns`) must be explicitly
present, with both numeric `review` and `halt` thresholds. List entries use two-space
indentation and plain or matching-quoted strings. Empty block list sections are
allowed. Duplicate or unknown sections, unknown syntax, inline lists/maps, anchors,
multiline scalars, and incomplete policies are rejected. This is not a general YAML
parser. Ordinary optional loading remains compatible with earlier policy files.

### Trusted base policy

Obtain the policy from the PR's exact base commit in a separate checkout. Check out
the exact PR head for scanning, without executing candidate code. Protect the
workflow and the action SHA through repository governance. A path alone does not
prove trust: `require_config` validates policy structure, not its authority.

```yaml
name: DiffWall hardened scan
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          fetch-depth: 0
          path: candidate
          persist-credentials: false
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          path: trusted-policy
          persist-credentials: false
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      # Placeholder: replace with an exact reviewed hardening commit SHA.
      - uses: dburt-proex/diffwall/action@REPLACE_WITH_REVIEWED_COMMIT_SHA
        env:
          GITHUB_WORKSPACE: ${{ github.workspace }}/candidate
        with:
          base: ${{ github.event.pull_request.base.sha }}
          head: ${{ github.event.pull_request.head.sha }}
          config: ${{ github.workspace }}/trusted-policy/rules/default.yml
          require_config: true
          fail_on_review: true
          fail_on_halt: true
          format: json
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: diffwall-hardened-evidence
          path: |
            candidate/diffwall-report.json
            candidate/diffwall-policy-evidence.json
            candidate/diffwall-action.log
          if-no-files-found: error
```

`diffwall-policy-evidence.json` records resolved base/head commit SHAs, the policy
file's SHA-256, its checkout HEAD when available, the report path, and scan exit
status. The route and findings stay in the accompanying report. A checkout HEAD
is provenance metadata, not proof the file is unmodified or authorized. Bind an
approval to the head SHA, base-policy revision, and policy hash; never approve a
mutable branch name. Null provenance must be investigated rather than invented.
Preserve both evidence files even on REVIEW, HALT, or operational failure.

### Human approval boundary

The scan remains failed on REVIEW even after someone submits a GitHub review.
For a simple deployment, require this scan and keep REVIEW changes blocked while
the underlying concern is resolved. If approved REVIEW changes may merge, use a
separately reviewed protected aggregate gate that consumes the scan result and
explicit authorized human approval. Require that aggregate check, and retain the
failed scan as evidence. Do not merely add another green check beside a failing
required check or mark the scanner successful with `continue-on-error`.

The aggregate gate must reject HALT and operational errors, verify approval for
the exact current head and policy hash, invalidate approval on new commits or
policy changes, restrict authorized reviewers, and prevent candidate code from
producing its own approval. Approval must never downgrade HALT. Repository rules,
workflow protection, bypass permissions, and approval enforcement must be verified
before calling the integration production-enforced. This increment does not
change live branch protection, create an approval service, or implement that gate.

Rollback: revert this hardening or remove its opt-in inputs through reviewed
workflow changes. Preserve v0.2.0 and publish any successor under a new version.
