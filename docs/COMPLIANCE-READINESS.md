# DiffWall Compliance Readiness Baseline

Status: REVIEW
Assessment date: 2026-11-14
Canonical control registry: `dburt-proex/casa/governance/CONTROL-REGISTRY.yaml` v0.1

## Claim boundary

This is an internal readiness baseline. It does not establish certification, attestation, regulatory compliance, enterprise production readiness, universal coverage, or customer adoption.

## Authority and source reconciliation

Main commit `973f712c2f8cad1821e5e1e3b5b3f0a005058bdd` resolved the CASA repository reference. This candidate incorporates main through `7e179f25f77226360e111a91179350351260d1ba`, preserves README/STATUS authority, and binds the manifest to the existing registry v0.1. No cross-repository runtime dependency is added. Referencing an internal control registry is not independent assurance.

SEC-001 evidence uses the tracked `test` and `packages/action-firewall/tests` directories. There is no root `tests` directory.

## Release candidate controls

The compliance gate parses YAML with a SafeLoader-derived loader, rejects duplicate keys and aliases, validates root/control/remediation fields and statuses, resolves repository-contained evidence paths, and checks tracked evidence when running in a Git checkout. Seventeen adversarial/positive regression cases cover the contract. A successful structural gate does not prove the effectiveness of a control or authorize a VERIFIED status.

Current package-manager generation evidence: [run 43609822176](https://github.com/dburt-proex/diffwall/actions/runs/43609822176). That run regenerated the lockfile and compiled runtime on Node 20/npm 10, passed 96 TypeScript tests, and reported zero npm vulnerabilities. The initial nanoid-only fix was insufficient: newer advisories required Vitest 4.1.12 and an updated transitive tree. No package integrity value was edited by hand.

Merge/release review requires fresh complete checks on the final committed candidate, not only this generation run. See [release candidate record](releases/2026-11-14-candidate.md) and the latest PR checks.

## External assurance gap register

| Priority | Control | Remaining assurance work |
|---|---|---|
| P0 | SEC-001 | Independent security assessment and retained exact-candidate security evidence |
| P0 | LOG-001 | Long-lived canonical audit export and retention, with integrity verification |
| P0 | INC-001 | Incident-response SOP, tabletop, RCA, corrective action and retest records |
| P0 | DAT-001 | Data inventory, classification, retention, deletion and handling policy |
| P0 | SUP-001 | Supplier/model-provider inventory, assessment and approved-use review |
| P0 | BCM-001 | Backup/recovery policy and successful restore evidence |
| P1 | RSK-001 | Enterprise risk treatment and residual-risk decisions |
| P1 | IAM-001 | Access inventory, privilege review and periodic access evidence |
| P1 | AI-001 | Applicable AI lifecycle inventory, evaluation, monitoring and retirement records |
| P1 | REV-001 | Internal audit, management review and corrective-action records |

These assurance prerequisites remain separate from a bounded software release candidate. Do not close issue #42 merely because the dependency audit passes.

## Validation workflow

1. Resolve every manifest evidence path against the exact assessed checkout.
2. Run schema regressions, TypeScript/Python CI, action route tests, release-readiness checks and package smoke tests.
3. Retain the commit, workflow run/attempt, toolchain versions, dependency tree, audit JSON, archive and checksum.
4. Keep source and committed runtime compiler-identical.
5. Review the complete self-scan report without changing thresholds or suppressing findings to obtain a green result.
6. Record owner disposition for material protected workflow/dependency changes before merge or publication.
7. Before external assurance, close or formally treat P0 gaps, map exact framework requirements, prove retention and record internal review.

## Phase 10 entry criteria

External assurance remains blocked until its P0 gaps are closed or formally risk-treated and the required evidence and management review exist. Passing release checks does not remove this boundary.
