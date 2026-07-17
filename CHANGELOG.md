# Changelog

## Unreleased

### Added

- PR comment updater: posts or updates a single marked DiffWall report comment per PR, with a GitHub step-summary fallback when a token is unavailable or lacks permission.

## v0.1.0

Initial action-first release of DiffWall.

### Added

- Deterministic PR diff scanner
- ALLOW / REVIEW / HALT routing model
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

### Known limits

- No npm package published yet
- GitHub Action builds from the action checkout on each run
- No SARIF export yet
- No CODEOWNERS-aware routing yet
