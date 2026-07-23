# DiffWall Status

Last updated: 2026-07-23

## Current verdict

DiffWall is an **early working deterministic enforcement firewall** with two independent control surfaces:

1. **PR Firewall** — TypeScript CLI and CI integrations that scan unified diffs, apply deterministic rules, score risk, and route changes to `ALLOW`, `REVIEW`, or `HALT`.
2. **Action Firewall** — Python stdlib-only validator that evaluates structured AI or agent actions before execution.

The repository includes live-controlled GitHub pull-request validation, PR comment delivery, evidence artifacts, merged SARIF output, CODEOWNERS-aware reviewer suggestions, GitLab CI guidance, Terraform and Python/Django policy packs, GitHub Actions workflow-risk fixtures, and a canonical buyer-facing pilot runbook.

DiffWall is **not** a fully hardened enterprise DevSecOps product. Required production gates remain a pinned release, broader compatibility testing, supply-chain and operational security review, performance testing, and defined long-term evidence retention.

## Canonical evidence

- [`docs/ai-coding-governance-pilot.md`](docs/ai-coding-governance-pilot.md) — buyer-facing evaluation and validation contract.
- [`docs/live-validation-case-study.md`](docs/live-validation-case-study.md) — controlled real-PR `REVIEW` and `HALT` proof.
- [`docs/github-action.md`](docs/github-action.md) — validated GitHub Action contract.
- [`docs/gitlab-ci.md`](docs/gitlab-ci.md) — GitLab merge-request execution pattern.
- [`docs/use-cases.md`](docs/use-cases.md) — buyer problems and bounded commercial concepts.

## Capability matrix

| Capability | Status | Evidence boundary |
|---|---:|---|
| TypeScript PR diff scanner | Working | Unified-diff parsing and deterministic rule evaluation on `main`. |
| Deterministic `ALLOW` / `REVIEW` / `HALT` routing | Working | Threshold routing plus critical hard-HALT findings. |
| Local CLI | Working | Saved diff, staged changes, and base/head refs. |
| Markdown and JSON output | Working | Used by local and CI reporting. |
| SARIF output | Working | Implemented in `src/output/sarif.ts` with regression coverage. |
| TypeScript build and test CI | Proven | Existing build, test, demo, and route fixtures. |
| Python Action Firewall | Working | Structured action validation with verdict exit codes. |
| Python unit and CLI CI | Proven | Rule and CLI regression evidence. |
| Composite GitHub Action | Live validated | Executed through controlled real pull requests. |
| PR comment updater | Live validated | Marked `REVIEW` and `HALT` comments created or updated. |
| Evidence-before-enforcement behavior | Proven | Controlled HALT report and evidence published before job failure. |
| CODEOWNERS-aware routing | Working | Triggered files map to suggested reviewers. |
| GitLab CI pattern | Documented and fixture-backed | CLI execution against merge-request refs. |
| Node/Express policy pack | Working | Merged repository policy pack. |
| Python/Django policy pack | Working | Merged through PR #23 with REVIEW and HALT fixtures. |
| Terraform policy pack | Working | Merged through PR #22 with protected paths and destructive patterns. |
| GitHub Actions workflow-risk detection | Working | Merged REVIEW and HALT fixtures, including unsafe `pull_request_target`. |
| AI Coding Governance Pilot | Pilot-ready contract | Merged through PR #25; not yet externally buyer-validated. |
| Runtime middleware integration | Not implemented | Future separately governed work. |
| Long-lived audit export and retention | Not implemented | Future productization gate. |
| Buyer-facing screenshots and demo media | Missing | Product proof backlog. |
| Pinned action release | Missing | Required before production merge enforcement. |

## Safe claim

> DiffWall is an early working PR and structured-action firewall. It scans diffs and structured actions, applies explainable deterministic risk rules, routes changes to `ALLOW`, `REVIEW`, or `HALT`, supports GitHub and GitLab-oriented CI patterns, and includes controlled live `REVIEW` and `HALT` proof.

Do not claim full enterprise production readiness, certification, regulatory compliance, universal coverage, guaranteed risk prevention, or customer adoption without new evidence.

## Product and system independence

DiffWall is independently deployable and does not require another repository or control plane at runtime.

Operator Intelligence, CASA, VIL, PromptBP, and the Governance Harness Toolkit may support assessment, runtime governance, evidence, specifications, or workflow control, but they remain independent systems. CASA canonical repository ownership is unresolved and no DiffWall runtime dependency should be inferred.

## Hardening progress

### Completed

- repository-level status and claim boundaries;
- composite GitHub Action hardening;
- real-PR `REVIEW` and `HALT` validation;
- PR comment and evidence delivery;
- CI coverage for PR and action engines;
- deterministic route fixtures;
- SARIF output;
- CODEOWNERS-aware routing;
- GitLab CI guidance;
- Node/Express, Python/Django, and Terraform policy packs;
- GitHub Actions workflow-risk fixtures;
- canonical AI Coding Governance Pilot.

### Remaining

- pinned action release;
- broader repository and monorepo compatibility testing;
- supply-chain and operational security review;
- large-diff and performance testing;
- long-lived audit export and retention strategy;
- buyer-facing screenshots or demo media;
- external pilot validation;
- separately governed runtime middleware work.

## Near-term product lane

> AI Coding Governance Pilot for engineering teams using Codex, Claude Code, Cursor, Copilot, OpenCode, or other coding agents.

The pilot evaluates whether repository-local policy can produce explainable `REVIEW` and `HALT` decisions with preserved evidence. A successful pilot is bounded evidence, not enterprise certification.
