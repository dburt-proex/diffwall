# DiffWall Status

Last updated: 2026-07-11

## Current verdict

DiffWall is **not just theory**. The repository contains working enforcement code for two surfaces:

1. **PR Firewall** — TypeScript CLI that scans unified diffs, applies deterministic rules, scores risk, and routes changes to `ALLOW`, `REVIEW`, or `HALT`.
2. **Action Firewall** — Python stdlib-only validator that evaluates structured AI/agent action objects before execution.

DiffWall is currently best described as an **early deterministic enforcement firewall** with a working local CLI, rule tests, and an initial GitHub Action wrapper.

It should **not yet** be described as a fully hardened production DevSecOps product.

---

## Capability matrix

| Capability | Status | Notes |
|---|---:|---|
| TypeScript PR diff scanner | Working | Parses unified diffs and applies default rules. |
| Deterministic ALLOW / REVIEW / HALT routing | Working | Score thresholds plus hard HALT findings. |
| Local CLI scan | Working | `diffwall scan` supports diff files, staged changes, and base/head refs. |
| Markdown output | Working | Suitable for PR comments or audit notes. |
| JSON output | Working | Suitable for artifacts and automation. |
| Unit tests for TypeScript rules/scoring | Present | Vitest coverage exists for key rules and thresholds. |
| Python Action Firewall | Working | Validates structured action JSON and exits by verdict severity. |
| Python unit tests | Present | Covers rule behavior and fail-safe routing. |
| GitHub Action wrapper | Initial | Composite wrapper added; needs CI validation in real PR workflow. |
| PR comment updater | Not implemented | Markdown output exists, but automatic GitHub comment posting is future work. |
| SARIF export | Not implemented | Roadmap item. |
| CODEOWNERS-aware routing | Not implemented | Roadmap item. |
| Policy packs | Not implemented | Roadmap item. |
| Runtime middleware | Not implemented | Roadmap item. |
| Demo screenshots/GIF | Missing | Needed for buyer-facing proof. |

---

## What is safe to claim now

Use this language:

> DiffWall is an early deterministic PR and agent-action firewall. It locally scans diffs and structured actions, applies explainable risk rules, and routes each change to ALLOW, REVIEW, or HALT.

Avoid this language for now:

> Production-ready GitHub Action for enterprise AI PR governance.

That may become true after the GitHub Action path is validated in CI and a real PR demo exists.

---

## Hardening priorities

### Phase 1 — Truth alignment

- Keep this `STATUS.md` current.
- Keep README claims aligned with implemented capability.
- Document what is working, experimental, and planned.

### Phase 2 — GitHub Action hardening

- Add and validate composite GitHub Action wrapper.
- Add example workflow using the real action path.
- Confirm `fail-on-halt` blocks a PR job.
- Publish the exact supported invocation path.

### Phase 3 — CI proof

- Run TypeScript build, unit tests, and demo scan.
- Run Python Action Firewall unit tests.
- Add self-test workflow that invokes DiffWall as an action.
- Upload JSON/Markdown scan artifacts.

### Phase 4 — Product proof

- Add screenshots/GIF for ALLOW, REVIEW, and HALT flows.
- Add sample PRs or fixtures for each route.
- Add buyer-facing use cases.

### Phase 5 — Productization

- PR comment updater.
- SARIF export.
- Policy packs.
- CODEOWNERS-aware routing.
- Runtime action middleware.
- Audit log export.

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
