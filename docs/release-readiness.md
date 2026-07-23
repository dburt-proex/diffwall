# DiffWall Pinned-Release Readiness

**Status:** Release candidate evidence package  
**Publication state:** `REVIEW`  
**Automatic tag or release publication:** Prohibited

This document defines the evidence required before DiffWall may be referenced by a pinned GitHub Action tag for production merge enforcement.

It does not publish a release, authorize production use, or claim enterprise readiness.

## Readiness decision

The repository may advance to a human release decision only when all internal checks below pass on the exact candidate commit.

| Area | Required evidence | Gate |
|---|---|---|
| Build and unit behavior | TypeScript build, Vitest suite, Python Action Firewall suite | Required |
| Repository compatibility | Node 20 and 22, Python 3.11 and 3.12, nested monorepo and CRLF regressions | Required |
| Large-diff behavior | Deterministic benchmark result below the recorded five-second ceiling | Required |
| Supply chain | Exact direct development versions, no runtime npm dependencies, dependency tree, high-severity audit check | Required |
| Action packaging | Composite manifest, entrypoint, compiled CLI, policy files, checksums, dry-run package inventory | Required |
| Security review | Completed review in [`security-review.md`](security-review.md) | Required |
| Audit contract | Retention and export contract in [`audit-retention-and-export.md`](audit-retention-and-export.md) | Required |
| Product proof | Versioned buyer-facing media and pilot runbook | Required |
| External buyer proof | At least one completed external pilot record | Required before customer-validation claims, not before an experimental tag |
| Human approval | Named owner records `ALLOW`, `REVIEW`, or `HALT` for publication | Required |

## Candidate evidence workflow

The repository-native workflow at `.github/workflows/release-readiness.yml` must:

1. run with read-only repository permissions;
2. install dependencies without publishing anything;
3. run build and unit checks across the supported runtime matrix;
4. execute repository and monorepo compatibility regressions;
5. execute the large-diff benchmark;
6. run the release-readiness verifier;
7. run dependency-tree and high-severity vulnerability checks;
8. create a local action candidate archive and SHA-256 checksum;
9. upload evidence only as a workflow artifact;
10. avoid tags, releases, deployments, package publication, permission changes, or external messages.

## Pinned release procedure

After the candidate workflow succeeds, a human owner must complete these steps manually:

1. Confirm the candidate commit SHA.
2. Review all workflow jobs and uploaded evidence.
3. Confirm PR comments and artifacts do not contain secrets or customer data.
4. Confirm the package version and proposed tag agree.
5. Confirm the tag has not already been used.
6. Record the release decision and unresolved risks.
7. Create an annotated tag only after explicit approval.
8. Create release notes that preserve the maturity and claim boundaries.
9. Update integration examples from `@main` to the approved immutable tag.
10. Re-run a controlled `ALLOW`, `REVIEW`, and `HALT` validation against the tag.

## Release decision states

- `ALLOW`: Internal evidence passes, the proposed tag is approved, and the owner accepts documented residual risks.
- `REVIEW`: Evidence is incomplete, a result is ambiguous, or an identified risk requires qualified judgment.
- `HALT`: Tests fail, artifacts are missing, secrets appear, the candidate differs from reviewed code, or publication would overstate maturity.

## Current claim boundary

A successful readiness run proves that a specific commit:

- builds and passes the recorded tests;
- produces deterministic route evidence;
- works across the recorded runtime matrix;
- completes the recorded synthetic performance benchmark;
- can be packaged as a GitHub Action candidate.

It does not prove universal repository compatibility, zero vulnerabilities, complete protection against malicious code, regulatory compliance, customer adoption, or unattended production safety.

## Rollback

Before publication, rollback means closing the draft pull request or reverting the candidate commits.

After a future tag is published, the tag must never be silently moved. A defective release must be deprecated through a new documented decision and superseded by a new immutable tag.
