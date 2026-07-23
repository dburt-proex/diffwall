# Changelog

## Unreleased

### Added

- AI Coding Governance Pilot runbook as the canonical buyer-facing evaluation and validation contract.
- Python/Django policy pack with controlled `REVIEW` and destructive-migration `HALT` fixtures.
- Terraform policy pack with infrastructure protected paths and destructive-pattern controls.
- GitHub Actions workflow-risk fixtures for governed review and unsafe `pull_request_target` halt behavior.
- SARIF report output for machine-ingestible findings.
- CODEOWNERS-aware reviewer suggestions in Markdown and JSON reports.
- GitLab merge-request CI guidance and example.
- PR comment updater with a step-summary fallback when comment delivery is unavailable.

### Changed

- Reconciled `README.md`, `STATUS.md`, and `ROADMAP.md` with merged capability and pilot state.
- Reframed DiffWall as an independent developer-control system rather than a runtime-dependent CASA component.
- Preserved CASA, Operator Intelligence, VIL, PromptBP, and Governance Harness Toolkit as optional independent systems.
- Moved completed SARIF, CODEOWNERS, GitLab, policy-pack, and GitHub Actions detector work out of future-roadmap language.
- Clarified the distinction between working capability, live-controlled proof, pilot-ready capability, and future production hardening.
- Retained the requirement to pin a release tag before using DiffWall as a required production merge gate.

### Current maturity limits

- No pinned production action release yet.
- Broader repository and monorepo compatibility testing remains incomplete.
- Supply-chain, operational security, and large-diff performance review remain incomplete.
- Long-lived audit retention and export remain undefined.
- Buyer-facing demo media and external pilot validation remain incomplete.
- No claim of enterprise readiness, certification, regulatory compliance, universal coverage, or guaranteed risk prevention.

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
