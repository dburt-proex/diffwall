# DiffWall

A deterministic enforcement firewall for AI-generated code and agent actions.

DiffWall scans pull-request diffs and structured agent actions, applies transparent repository-local policy, and routes each change to `ALLOW`, `REVIEW`, or `HALT`.

> **Current status:** early working enforcement system with live-validated GitHub pull-request integration, deterministic route evidence, policy packs, SARIF output, CODEOWNERS-aware reviewer suggestions, GitLab CI guidance, and a bounded buyer-facing pilot. DiffWall is not yet a fully hardened enterprise DevSecOps product.

## Product boundary

DiffWall is an independent developer-control system. It can operate by itself in a repository and does not require CASA, VIL, Operator Intelligence, PromptBP, or the Governance Harness Toolkit at runtime.

Those systems may be used independently around DiffWall:

- **Operator Intelligence** may assess and prioritize governance gaps.
- **DiffWall** enforces change-time and structured-action boundaries.
- **CASA** is a separate runtime-governance architecture with unresolved canonical repository ownership.
- **VIL**, **PromptBP**, and the **Governance Harness Toolkit** are optional independent supporting systems.

No cross-repository runtime dependency is implied.

## Enforcement surfaces

1. **PR Firewall** — scans pull-request or merge-request diffs, explains triggered rules, scores risk, and routes changes to `ALLOW`, `REVIEW`, or `HALT`.
2. **Action Firewall** — validates structured AI or agent actions before execution and blocks destructive, financial, public-broadcast, mutation, or secret-exposure risks.

DiffWall is not an LLM reviewer. Its core design goal is deterministic, inspectable, repository-local enforcement.

## Canonical evaluation path

The buyer-facing evaluation contract is:

- [`docs/ai-coding-governance-pilot.md`](docs/ai-coding-governance-pilot.md)

The pilot defines inventory, policy selection, controlled fixtures, evidence review, and recommendation handoff. It requires controlled `REVIEW` and `HALT` proof and preserves explicit maturity boundaries.

Live real-PR validation is documented in:

- [`docs/live-validation-case-study.md`](docs/live-validation-case-study.md)

## Routing model

| Route | Meaning |
|---|---|
| `ALLOW` | Low-risk, read-only, or acceptable under current policy |
| `REVIEW` | Human review is required before execution or merge |
| `HALT` | Unsafe, irreversible, financial, secret-leaking, destructive, or policy-violating |

Critical findings force `HALT`. Unknown structured actions fail safe to `REVIEW`, never silent allow.

## Current merged capability

### PR Firewall

- TypeScript unified-diff scanner
- deterministic `ALLOW` / `REVIEW` / `HALT` routing
- Markdown, JSON, and SARIF output
- composite GitHub Action
- PR comment create/update behavior
- evidence-before-enforcement ordering
- CODEOWNERS-aware reviewer suggestions
- GitLab merge-request CI pattern
- default and framework-specific policy packs
- controlled route fixtures and CI evidence

### Merged policy packs

- [`policy-packs/node-express.yml`](policy-packs/node-express.yml)
- [`policy-packs/python-django.yml`](policy-packs/python-django.yml)
- [`policy-packs/terraform.yml`](policy-packs/terraform.yml)

GitHub Actions workflow-risk behavior is covered by merged fixtures and tests, including safe review and unsafe `pull_request_target` patterns.

### Action Firewall

The Python Action Firewall validates structured action objects and returns an audit-ready route for:

- read-only actions;
- state mutations;
- external communication;
- public broadcast;
- irreversible destruction;
- financial transfer;
- exposed secrets.

## Repository layout

```text
src/                         # TypeScript PR Firewall
rules/                       # Default repository policy
policy-packs/                # Merged framework and infrastructure policy packs
demo/                        # Controlled diffs and demonstrations
test/                        # PR Firewall tests and regression fixtures
action/                      # Composite GitHub Action wrapper
packages/action-firewall/    # Python structured-action validator
docs/                        # Integration, validation, pilot, and architecture records
examples/                    # CI integration examples
```

## GitHub Action quickstart

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

This invocation has been exercised in controlled real pull requests. **Pin a release tag rather than `main` before making DiffWall a required production merge gate.**

See [`docs/github-action.md`](docs/github-action.md) for the integration contract.

## GitLab CI

DiffWall can run as a plain Node CLI in GitLab merge-request pipelines. See:

- [`examples/gitlab-ci.yml`](examples/gitlab-ci.yml)
- [`docs/gitlab-ci.md`](docs/gitlab-ci.md)

## Local development

```bash
npm install
npm run build
npm test
npm run scan:demo
```

Local CLI examples:

```bash
npx tsx src/cli.ts scan --diff test/fixtures/auth-bypass.diff --format markdown
npx tsx src/cli.ts scan --staged --format markdown
npx tsx src/cli.ts scan --base origin/main --head HEAD --format sarif --fail-on-halt
```

Action Firewall checks:

```bash
cd packages/action-firewall
python -m unittest discover -s tests -v
python demo/halt_demo.py
python -m diffwall.cli validate examples/actions/allow_read_file.json
python -m diffwall.cli validate examples/actions/halt_delete_prod_db.json
```

## Default PR risk signals

- protected and sensitive files;
- GitHub workflow changes;
- authentication, authorization, permissions, security, billing, and deployment changes;
- dependency manifests and install scripts;
- secret-like additions;
- destructive SQL and shell operations;
- unsafe GitHub Actions patterns;
- TLS verification disablement;
- remote scripts piped into shells;
- dynamic execution and unsafe deserialization;
- network egress near environment access;
- large generated diffs;
- source changes without tests;
- test removal.

## Evidence and claim boundary

Safe current claim:

> DiffWall is an early working PR and structured-action firewall. It applies explainable deterministic rules, routes changes to `ALLOW`, `REVIEW`, or `HALT`, supports repository-local CI integration, and includes live-controlled `REVIEW` and `HALT` evidence.

Do not claim:

- full enterprise production readiness;
- certification or regulatory compliance;
- universal repository or language coverage;
- zero false positives or false negatives;
- guaranteed prevention of unsafe AI-generated code;
- unattended production autonomy;
- customer adoption not supported by evidence.

## Remaining release gates

- cut and document a pinned action release;
- broaden compatibility testing across representative repositories and monorepos;
- complete supply-chain and operational security review;
- test large-diff and performance behavior;
- define long-lived audit retention and export;
- add buyer-facing screenshots or demo media;
- validate the pilot with an external repository or buyer.

See [`STATUS.md`](STATUS.md), [`ROADMAP.md`](ROADMAP.md), and [`CHANGELOG.md`](CHANGELOG.md) for the current maturity record.

## License

Apache-2.0
