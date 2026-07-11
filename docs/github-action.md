# DiffWall GitHub Action

DiffWall includes a composite GitHub Action at:

```text
action/action.yml
```

Use it from another repository with:

```yaml
uses: dburt-proex/diffwall/action@main
```

The action has been validated in a real pull-request workflow. Pin a release tag instead of `main` before making it a required production merge gate.

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
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run DiffWall
        uses: dburt-proex/diffwall/action@main
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
| `format` | `markdown` | `text`, `json`, or `markdown`. |
| `fail_on_halt` | `true` | Exit non-zero when route is `HALT`. |
| `quiet` | `false` | Print only the final route decision. |
| `github_token` | empty | Optional token for PR comment updates. |

---

## Local equivalent

```bash
npm install
npm run build
npx tsx src/cli.ts scan --base origin/main --head HEAD --format markdown --fail-on-halt
```

---

## Current maturity

The composite action is implemented and live-validated for loading, dependency installation, build, scanning, evidence generation, PR comment creation/update, and `REVIEW` enforcement. TypeScript and Python CI jobs also generate ALLOW / REVIEW / HALT evidence artifacts.

Remaining release gate: prove the live PR `HALT` path blocks the workflow after the report and comment are published, then cut and document a pinned action tag.
