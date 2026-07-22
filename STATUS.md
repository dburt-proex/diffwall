# DiffWall Status

Last updated: 2026-07-11

## Current verdict

DiffWall is **not just theory**. The repository contains working enforcement code for two surfaces:

1. **PR Firewall** — TypeScript CLI and GitHub Action that scan unified diffs, apply deterministic rules, score risk, and route changes to `ALLOW`, `REVIEW`, or `HALT`.
2. **Action Firewall** — Python stdlib-only validator that evaluates structured AI/agent action objects before execution.

DiffWall is currently best described as an **early working deterministic enforcement firewall** with live-validated PR workflow integration, PR comment delivery, evidence artifacts, live `REVIEW` and `HALT` proof, and CI coverage for both engines.

It should not yet be described as a fully hardened enterprise DevSecOps product. The next release gates are a pinned action tag, broader compatibility testing, and product-facing proof media.

Public proof:

- [`docs/live-validation-case-study.md`](docs/live-validation-case-study.md) — controlled real-PR `REVIEW` and `HALT` evidence.
- [`docs/use-cases.md`](docs/use-cases.md) — buyer problems, technical use cases, and initial commercial packages.
- [`docs/github-action.md`](docs/github-action.md) — validated integration contract and inputs.

---

## Capability matrix

| Capability | Status | Notes |
|---|---:|---|
| TypeScript PR diff scanner | Working | Parses unified diffs and applies default rules. |
| Deterministic ALLOW / REVIEW / HALT routing | Working | Score thresholds plus hard HALT findings. |
| Local CLI scan | Working | Supports diff files, staged changes, and base/head refs. |
| Markdown and JSON output | Working | Used by CI evidence and PR reporting. |
| TypeScript unit/build CI | Proven | Build, tests, demo scan, and three-route evidence completed successfully. |
| Python Action Firewall | Working | Validates structured action JSON and exits by verdict severity. |
| Python unit/CLI CI | Proven | Tests, demo, exit-code checks, and three-route evidence completed successfully. |
| Composite GitHub Action | Live validated | Loaded and executed through `uses: ./action` in real PR workflows. |
| PR workflow | Live validated | Immutable base SHA, evidence upload, and route enforcement completed successfully. |
| PR comment updater | Live validated | Created marked `REVIEW` and `HALT` reports on controlled proof PRs. |
| Evidence artifacts | Working | PR reports, diagnostics, and engine route evidence upload through GitHub Actions. |
| Live HALT PR enforcement | Proven | Published a 100/100 HALT report and then failed the workflow as designed. |
| SARIF export | Not implemented | Roadmap item. |
| CODEOWNERS-aware routing | Working | Maps triggered files to CODEOWNERS owners in Markdown/JSON reports. |
| Policy packs | Not implemented | Roadmap item. |
| Runtime middleware | Not implemented | Roadmap item. |
| Demo screenshots/GIF | Missing | Needed for buyer-facing proof. |

---

## What is safe to claim now

> DiffWall is an early working PR and agent-action firewall. It scans diffs and structured actions, applies explainable deterministic risk rules, routes changes to ALLOW, REVIEW, or HALT, and includes a live-validated GitHub Action with PR comments, evidence artifacts, and proven HALT enforcement.

Avoid claiming full enterprise production readiness until a pinned release, broader repository compatibility testing, security review, and operational hardening are complete.

---

## Hardening progress

### Phase 1 — Truth alignment

- [x] Add repo-level `STATUS.md`.
- [x] Align README claims with implemented capability.
- [x] Document what is working, experimental, and planned.

### Phase 2 — GitHub Action hardening

- [x] Harden composite GitHub Action wrapper inputs.
- [x] Fix strict action-manifest YAML parsing.
- [x] Ensure report publishing runs before verdict enforcement.
- [x] Publish the exact supported invocation path.
- [x] Add repository PR workflow invoking the local action wrapper.
- [x] Validate the action wrapper in a real PR workflow.
- [x] Validate PR comment create/update behavior.
- [x] Confirm live `HALT` blocks a PR job after report/comment publication.

### Phase 3 — CI proof

- [x] Run TypeScript build, unit tests, and demo scan.
- [x] Run Python Action Firewall unit tests and CLI exit-code checks.
- [x] Add action self-test workflow for ALLOW / REVIEW / HALT fixtures.
- [x] Generate and upload route evidence artifacts.
- [x] Persist PR report and diagnostics artifacts.

### Phase 4 — Product proof

- [ ] Add screenshots/GIF for ALLOW, REVIEW, and HALT flows.
- [x] Add deterministic fixtures for all three routes.
- [x] Add buyer-facing use cases.
- [x] Add one polished public validation case study.

### Phase 5 — Productization

- [ ] Cut and document a pinned action release.
- [ ] Add SARIF export.
- [x] Add CODEOWNERS-aware routing.
- [ ] Add policy packs.
- [ ] Add runtime middleware.
- [ ] Add audit log export.

---

## Current strategic role

DiffWall is the **developer-facing wedge** of the broader Operator Intelligence / CASA system:

```txt
VIL finds risk signals.
CASA decides the route.
DiffWall enforces the gate.
Decision Ledger records proof.
```

The strongest near-term product lane is:

> AI PR Firewall for teams using Codex, Claude Code, Cursor, Copilot, OpenCode, or other AI coding agents.
