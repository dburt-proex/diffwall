# DiffWall GitHub Action

DiffWall includes an initial composite GitHub Action wrapper at:

```text
action/action.yml
```

Use it from another repository with:

```yaml
uses: dburt-proex/diffwall/action@main
```

For a pinned release later, replace `main` with a tag such as `v0.1.0` after the action has been validated in CI and tagged.

---

## Basic PR workflow

```yaml
name: DiffWall

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: read

jobs:
  diffwall:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run DiffWall
        uses: dburt-proex/diffwall/action@main
        with:
          base: origin/${{ github.base_ref }}
          head: HEAD
          config: rules/default.yml
          format: markdown
          fail-on-halt: true
```

This runs DiffWall against the PR diff and fails the job when the route is `HALT`.

---

## With PR comment update

To let DiffWall create or update a marked PR comment, pass `github-token` and grant comment-write permission.

```yaml
name: DiffWall

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: read
  issues: write

jobs:
  diffwall:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run DiffWall
        uses: dburt-proex/diffwall/action@main
        with:
          base: origin/${{ github.base_ref }}
          head: HEAD
          config: rules/default.yml
          format: markdown
          fail-on-halt: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

Notes:

- Forked PRs may receive a read-only token depending on repository settings.
- If no token is provided, DiffWall writes markdown to the job step summary when available.
- The action now attempts to publish the report/comment before exiting with the HALT failure status.

---

## Inputs

| Input | Default | Purpose |
|---|---|---|
| `base` | `origin/main` | Base git ref for the diff. |
| `head` | `HEAD` | Head git ref for the diff. |
| `diff` | empty | Optional path to a unified diff file. Overrides base/head. |
| `config` | `rules/default.yml` | Path to caller repo policy file. If missing, built-in defaults are used. |
| `format` | `markdown` | `text`, `json`, or `markdown`. |
| `fail-on-halt` | `true` | Exit non-zero when route is `HALT`. |
| `quiet` | `false` | Print only the final route decision. |
| `github-token` | empty | Optional token for PR comment updates. |

---

## Local equivalent

```bash
npm install
npm run build
npx tsx src/cli.ts scan --base origin/main --head HEAD --format markdown --fail-on-halt
```

---

## Current maturity

This action wrapper is **initial but functional in design**. Treat it as a hardening target until the repo has a passing self-test workflow that invokes the action through `uses:` and demonstrates all three routes: `ALLOW`, `REVIEW`, and `HALT`.
