# DiffWall

A deterministic enforcement firewall for AI-generated code and agent actions.

DiffWall is the enforcement layer in the CASA Control Plane:

```txt
VIL finds risk signals.
CASA decides the route.
DiffWall enforces the gate.
```

It protects two execution surfaces:

1. **PR Firewall** — scans pull-request diffs before merge, scores risk, and routes each PR to `ALLOW`, `REVIEW`, or `HALT`.
2. **Action Firewall** — validates proposed AI/agent actions before execution and blocks destructive, financial, or secret-leaking actions.

DiffWall is not an LLM reviewer. The core design goal is deterministic, transparent, repo-local enforcement.

> **Current status:** early working enforcement system. Local CLI, TypeScript PR scanner, Python Action Firewall, and rule tests exist. GitHub Action support is now in initial wrapper form and should be validated in real PR workflows before calling it production-ready. See [`STATUS.md`](STATUS.md).

```txt
External signal / PR diff / agent intent
        ↓
VIL: signal evaluation and prioritization
        ↓
CASA: governance policy and route decision
        ↓
DiffWall: enforcement firewall
        ↓
ALLOW / REVIEW / HALT + audit trace
```

## Why DiffWall exists

AI coding agents and workflow agents can move faster than human review. Traditional CI tells you whether tests passed. AI PR reviewers comment on possible issues. DiffWall decides what level of trust an action deserves before it is allowed to proceed.

The failure mode is simple: an agent proposes a risky diff, a destructive migration, a credential-bearing config write, a production deletion, a payment action, or an external broadcast — and nothing sits between intent and execution.

DiffWall is that boundary.

## Routing model

| Route | Meaning |
|---|---|
| `ALLOW` | Low-risk / read-only / acceptable under current policy |
| `REVIEW` | Human review required before execution or merge |
| `HALT` | Unsafe, irreversible, financial, secret-leaking, or policy-violating |

Critical findings force `HALT`. Unknown agent actions fail safe to `REVIEW`, never silent allow.

## Repository layout

```txt
src/                         # Current TypeScript PR Firewall implementation
rules/                       # PR Firewall policy config
demo/                        # PR Firewall diff fixtures / demos
test/                        # PR Firewall tests
action/                      # Composite GitHub Action wrapper
packages/action-firewall/    # Python CASA agent-action validator
docs/                        # CASA / VIL / DiffWall architecture docs
```

Future package migration target:

```txt
packages/pr-firewall/        # TypeScript GitHub PR diff firewall
packages/action-firewall/    # Python CASA agent-action firewall
```

## PR Firewall

The PR Firewall scans code diffs before merge, scores risk, explains what changed, and routes every PR:

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
Markdown / JSON output + CI route
```

Built for teams using Codex, Claude Code, Cursor, Copilot, OpenCode, and other coding agents.

### GitHub Action quickstart

> Initial wrapper available. Validate it in your repo before using it as a required merge gate.

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

### Local development

```bash
npm install
npm run build
npm test
npm run scan:demo
```

### Local CLI usage

```bash
# Scan a fixture or saved unified diff
npx tsx src/cli.ts scan --diff test/fixtures/auth-bypass.diff --format markdown

# Scan staged local changes
npx tsx src/cli.ts scan --staged --format markdown

# Scan two refs
npx tsx src/cli.ts scan --base origin/main --head HEAD --format json --fail-on-halt
```

### Default PR risk signals

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

## Action Firewall

The Action Firewall is the Python CASA proof: a stdlib-only validator that intercepts proposed AI/agent actions and returns an audit-ready decision.

```bash
cd packages/action-firewall
python -m unittest discover -s tests -v
python demo/halt_demo.py
python -m diffwall.cli validate examples/actions/allow_read_file.json
python -m diffwall.cli validate examples/actions/halt_delete_prod_db.json
```

CLI exit codes:

| Exit | Verdict |
|---:|---|
| 0 | `ALLOW` |
| 1 | `REVIEW` |
| 2 | `HALT` |

The Action Firewall currently includes rules for irreversible destruction, financial transfer, exposed secrets, public broadcast, data mutation, and read-only actions.

## CASA Control Plane mapping

| Layer | Responsibility | Artifact |
|---|---|---|
| VIL | Find and score meaningful risk/opportunity signals | Verified Intelligence Layer |
| CASA | Define policy routes and governance gates | Control Awareness System Architecture |
| DiffWall | Enforce gates before merge or execution | PR Firewall + Action Firewall |

## Why not just CodeQL, Semgrep, CI, or an AI PR reviewer?

| Tool type | What it does | Gap |
|---|---|---|
| Code scanners | Find known vulnerability patterns | Do not route agent-generated diffs by merge risk |
| AI PR reviewers | Comment on possible issues | Often do not enforce policy |
| CI | Runs tests and builds | Does not judge blast radius or trust boundary changes |
| DiffWall | Scores risk and enforces route decisions | Designed for AI-agent coding and execution workflows |

## Roadmap

- Validate composite GitHub Action wrapper in PR workflow
- Add self-test workflow that invokes DiffWall through `uses:`
- Add GitHub PR comment updater
- Add SARIF export
- Add CODEOWNERS-aware routing
- Add policy packs for Node, Python, Rails, Django, Terraform, and GitHub Actions
- Add runtime agent middleware for action validation
- Add audit log export

## License

Apache-2.0
