# DiffWall Supply-Chain and Operational Security Review

**Review date:** 2026-07-23  
**Scope:** PR Firewall, composite GitHub Action, Python Action Firewall, release-readiness workflow  
**Decision:** `REVIEW` until the exact candidate commit passes the release-readiness workflow

This review evaluates the security of distributing and operating DiffWall. It does not certify the project or replace an independent security assessment.

## Protected assets

- repository source and policy definitions;
- caller repository contents and pull-request diffs;
- optional GitHub token used for PR comments;
- generated reports, SARIF, diagnostics, and evidence artifacts;
- release tags and candidate archives;
- structured agent-action inputs evaluated by the Python Action Firewall.

## Trust boundaries

1. The caller repository is untrusted input.
2. Diff content, file paths, PR metadata, CODEOWNERS content, and action objects are untrusted input.
3. The GitHub token is optional and must remain least privilege.
4. Dependency registries and third-party GitHub Actions are supply-chain dependencies.
5. Uploaded workflow artifacts are evidence, not trusted executable input.
6. A release tag is an immutable authority boundary and must not move after publication.

## Review findings

| ID | Finding | Severity | Control or required disposition |
|---|---|---:|---|
| SEC-001 | JavaScript tooling dependencies could drift when ranges are used | High | Direct development dependencies are pinned to exact versions; a committed lockfile is required before publication. |
| SEC-002 | The composite action installs and builds tooling at execution time | High | The release candidate must use `npm ci` against the committed lockfile. No production tag may be approved while the action falls back to an unlocked install. |
| SEC-003 | Untrusted diff content may contain commands, secrets, or prompt-injection text | High | DiffWall parses input as data, does not execute changed code, redacts secret-like evidence, and runs with read-only contents permission by default. |
| SEC-004 | PR comment delivery requires write permission | Medium | `pull-requests: write` is optional and scoped to comment delivery. Report artifacts and step summaries remain valid when the token is absent or denied. |
| SEC-005 | A malformed diff could fail open | High | Existing scanner fail-safe behavior routes diff-like unparseable content to at least `REVIEW`. |
| SEC-006 | Large inputs could exhaust time or memory | Medium | Git diff reads use a bounded 256 MiB buffer; the release workflow runs a deterministic large-diff benchmark and records duration and input size. |
| SEC-007 | Workflow artifacts could retain sensitive evidence too long | Medium | Retention classes and redaction requirements are defined in [`audit-retention-and-export.md`](audit-retention-and-export.md). |
| SEC-008 | Floating action references may change upstream behavior | Medium | Official actions are restricted to required steps and least privilege. Commit-SHA pinning remains recommended before a hardened enterprise release. |
| SEC-009 | Release automation could publish without human review | Critical | The readiness workflow uploads evidence only. It has no tag, release, package-publish, deployment, or write permission. Publication remains manual and REVIEW-gated. |
| SEC-010 | Historical CASA language could imply an unapproved runtime dependency | Medium | Current authority is documented in README and [`architecture-history.md`](architecture-history.md); DiffWall remains independently deployable. |

## Supply-chain controls

- no direct runtime npm dependencies;
- exact direct development dependency versions;
- committed npm lockfile required for a release candidate;
- `npm ci` required for candidate and action execution once the lockfile is present;
- dependency-tree evidence captured in CI;
- high-severity npm audit check captured in CI;
- candidate archive and SHA-256 checksum captured as evidence;
- read-only workflow permissions;
- no automatic tag, release, npm publish, or deployment behavior;
- Apache-2.0 license retained.

## Operational controls

- immutable pull-request base SHA is supported by the GitHub Action contract;
- `HALT` evidence is produced before enforcement failure;
- operational errors use exit code `1`, distinct from policy `HALT` exit code `2`;
- secret-like evidence is redacted;
- unknown structured actions fail safe to `REVIEW`;
- CODEOWNERS suggestions are advisory and do not grant authority;
- caller policy files remain repository-local and reviewable;
- production enforcement requires an immutable release tag;
- no customer data is required for synthetic validation.

## Required pre-release checks

- [ ] Committed lockfile matches `package.json`.
- [ ] Composite action uses `npm ci` against the lockfile.
- [ ] TypeScript build and tests pass on Node 20 and 22.
- [ ] Python Action Firewall tests pass on Python 3.11 and 3.12.
- [ ] High-severity dependency audit passes or receives a documented `REVIEW` disposition.
- [ ] Large-diff benchmark passes and produces evidence.
- [ ] Candidate archive checksum is recorded.
- [ ] PR comment and report artifacts contain no live secrets or customer data.
- [ ] Human owner approves the exact candidate commit.

## Residual risk

Even after these checks, DiffWall remains an early enforcement system. It has not completed an independent penetration test, exhaustive repository compatibility program, formal secure-development lifecycle assessment, or long-duration production operation.

Those residual risks must remain visible in release notes and buyer-facing claims.
