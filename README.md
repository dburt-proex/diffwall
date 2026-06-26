# DiffWall

A PR risk firewall for agent-written code.

DiffWall scans code diffs before merge, scores risk, explains what changed, and routes every PR:

- **ALLOW**: low-risk change
- **REVIEW**: human review required
- **HALT**: unsafe or policy-violating change

Built for teams using Codex, Claude Code, Cursor, Copilot, OpenCode, and other coding agents.

```txt
GitHub PR
   ↓
Diff parser
   ↓
Risk detectors
   ↓
Policy engine
   ↓
ALLOW / REVIEW / HALT
   ↓
PR check + comment + audit JSON
```

## Why DiffWall exists

AI coding agents can generate and modify large diffs faster than humans can safely review them. Traditional CI tells you whether tests passed. AI PR reviewers tell you what might be wrong. DiffWall decides what level of trust a PR deserves before merge.

This is not an LLM reviewer. The first version is deterministic, transparent, and repo-local.

## Quickstart

Use DiffWall as a GitHub Action:

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

      - name: Run DiffWall
        uses: dburt-proex/diffwall/action@v0.1.0
        with:
          base: origin/${{ github.base_ref }}
          head: HEAD
          config: rules/default.yml
          fail-on-halt: true
```

Run locally from a checkout:

```bash
npm install
npm run build
node dist/cli.js scan --diff test/fixtures/auth-bypass.diff --format markdown
```

## Demo diffs

DiffWall ships with three proof fixtures:

```bash
node dist/cli.js scan --diff demo/diffs/allow-docs.diff --format markdown
node dist/cli.js scan --diff demo/diffs/review-auth-no-tests.diff --format markdown
node dist/cli.js scan --diff demo/diffs/halt-destructive-migration.diff --format markdown --fail-on-halt
```

Expected routes:

| Demo diff | Expected route | Why |
|---|---|---|
| `demo/diffs/allow-docs.diff` | ALLOW | Docs-only change ignored by default policy |
| `demo/diffs/review-auth-no-tests.diff` | REVIEW | Auth-sensitive source changed without tests |
| `demo/diffs/halt-destructive-migration.diff` | HALT | Destructive SQL migration forces block |

## Example output

```txt
DiffWall: REVIEW
Risk score: 58 / 100

Triggered rules:
  +25  Authentication, authorization, billing, or security-sensitive files changed
  +20  Dependency manifest or lockfile changed
  +10  Source changed without test changes
  +3   Medium diff size
```

## Routing model

| Route | Score | Meaning |
|---|---:|---|
| ALLOW | 0–39 | Low-risk under current policy. Normal CI still applies. |
| REVIEW | 40–74 | Human review required before merge. |
| HALT | 75–100 or critical finding | Block until fixed or explicitly overridden. |

Critical findings force **HALT** even when the diff is small.

## Default risk signals

- Sensitive files changed
- GitHub workflow changed
- Auth, session, JWT, OAuth, permissions, security, or billing code changed
- Dependency manifest or lockfile changed
- Secret-like string added
- Destructive SQL migration
- Dangerous shell command
- TLS verification disabled
- Remote script piped into shell
- Dynamic execution or unsafe deserialization
- New network egress near environment access
- Large generated diff
- Source changed without test changes
- Test removal

## Policy file

See `rules/default.yml`.

```yaml
thresholds:
  review: 40
  halt: 75

protectedPaths:
  - ".github/workflows/**"
  - "src/auth/**"
  - "billing/**"
  - "migrations/**"
```

## Test coverage

DiffWall's test suite is organized around three deterministic layers:

- **Scanner/orchestration tests**: fixture-based `scanDiff` tests that prove end-to-end routing behavior.
- **Rule-level tests**: direct unit tests for risk detectors such as protected paths, secrets, dependency lifecycle scripts, destructive operations, and network/exec patterns.
- **Scoring threshold tests**: direct tests for ALLOW / REVIEW / HALT routing boundaries, critical halt precedence, score capping, and summary metadata.

Run the full test suite with:

```bash
npm test
```

## Launch copy

Launch-ready post copy lives in `docs/launch-copy.md`.

## Why not just CodeQL, Semgrep, CI, or an AI PR reviewer?

| Tool type | What it does | Gap |
|---|---|---|
| Code scanners | Find known vulnerability patterns | Do not route agent-generated diffs by merge risk |
| AI PR reviewers | Comment on possible issues | Often do not enforce policy |
| CI | Runs tests and builds | Does not judge blast radius or trust boundary changes |
| DiffWall | Scores PR risk and routes merge policy | Designed for AI-agent coding workflows |

## Local development

```bash
npm install
npm run build
npm test
npm run scan:demo
```

## Roadmap

- GitHub PR comment updater
- SARIF export
- CODEOWNERS-aware routing
- Policy packs for Node, Python, Rails, Django, Terraform, GitHub Actions
- GitLab CI support
- Semgrep/CodeQL result ingestion
- Agent identity detection
- Audit log export

## License

Apache-2.0