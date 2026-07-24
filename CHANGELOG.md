# Changelog

## Unreleased

No unreleased changes recorded.

## v0.2.0 — 2026-07-24

Release-candidate line for DiffWall's pilot-ready, independently deployable GitHub Action.

### Added

- AI Coding Governance Pilot runbook as the canonical buyer-facing evaluation and validation contract.
- Python/Django policy pack with controlled `REVIEW` and destructive-migration `HALT` fixtures.
- Terraform policy pack with infrastructure protected paths and destructive-pattern controls.
- GitHub Actions workflow-risk fixtures for governed review and unsafe `pull_request_target` halt behavior.
- SARIF report output for machine-ingestible findings.
- CODEOWNERS-aware reviewer suggestions in Markdown and JSON reports.
- GitLab merge-request CI guidance and example.
- PR comment updater with a step-summary fallback when comment delivery is unavailable.
- Committed `dist/**` runtime for action execution without installing dependencies in the caller repository.
- Node 20/22 and Python 3.11/3.12 release-readiness matrix.
- Nested monorepo, CRLF, strict-route, ignored-documentation, and self-scan regression coverage.
- Synthetic large-diff benchmark, package inventory, dependency-tree audit, candidate archive, and checksum evidence.
- Security review, audit-retention and export contract, buyer-validation protocol, demo media, and architecture-history records.

### Changed

- Reconciled `README.md`, `STATUS.md`, and `ROADMAP.md` with merged capability and pilot state.
- Reframed DiffWall as an independent developer-control system rather than a runtime-dependent CASA component.
- Preserved CASA, Operator Intelligence, VIL, PromptBP, and Governance Harness Toolkit as optional independent systems.
- Moved completed SARIF, CODEOWNERS, GitLab, policy-pack, and GitHub Actions detector work out of future-roadmap language.
- Clarified the distinction between working capability, live-controlled proof, pilot-ready capability, and future production hardening.
- Pinned direct development dependency versions and upgraded Vitest to `3.2.7` for the audited candidate graph.
- Hardened the action entrypoint to fail closed when committed runtime files are absent.

### Current maturity limits

- This entry defines a release candidate; no immutable `v0.2.0` tag or GitHub Release is created by this change.
- External buyer validation remains incomplete.
- The performance fixture is synthetic and does not establish universal repository performance.
- Audit retention and export are specified; a dedicated runtime envelope exporter remains future work.
- No claim of enterprise readiness, certification, regulatory compliance, universal coverage, customer adoption, or guaranteed risk prevention.

## v0.1.0

Initial action-first release of DiffWall.

### Added

- Deterministic PR diff scanner
- `ALLOW` / `REVIEW` / `HALT` routing model
- Rule-based risk scoring
- GitHub Action wrapper
- Markdown and JSON report output
- Default policy file at `rules/default.yml`
- CI workflow for install, build, test, and demo scan
- Risk detectors for:
  - protected paths
  - GitHub workflow changes
  - auth/security/billing paths
  - secret-like strings
  - dependency manifest changes
  - package install scripts
  - destructive SQL and shell operations
  - TLS verification disablement
  - remote shell pipes
  - network egress near environment access
  - large diffs
  - source changes without tests

### Known limits at release

- No npm package published.
- GitHub Action builds from the action checkout on each run.
- Production enforcement requires a pinned release and broader hardening.
