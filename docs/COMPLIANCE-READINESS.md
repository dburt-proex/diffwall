# DiffWall Compliance Readiness Baseline

Status: REVIEW  
Assessment date: 2026-08-16  
Canonical control registry: `dburt-proex/casa/governance/CONTROL-REGISTRY.yaml` v0.1

## Claim boundary

DiffWall must not claim ISO/IEC certification, SOC 2 attestation, full enterprise production readiness, regulatory compliance, universal coverage, guaranteed risk prevention, or customer adoption without evidence supporting the exact claim.

## Scope

DiffWall is assessed as the change-time enforcement surface for repository diffs and structured actions: deterministic risk rules, ALLOW/REVIEW/HALT routing, CI enforcement, evidence-before-enforcement, reviewer routing, release gating, and security/change fixtures.

## Evidence-backed strengths

- Deterministic change scanning and risk routing.
- GitHub/GitLab-oriented CI integration and controlled release gating.
- Controlled real-PR REVIEW/HALT proof and evidence artifacts.
- CODEOWNERS-aware reviewer suggestions and negative fixtures.
- Explicit claim boundary in `STATUS.md`.

## Gap register

| Priority | Control | Gap | Closure evidence |
|---|---|---|---|
| P0 | LOG-001 | Long-lived audit export/retention not implemented | canonical audit envelope + retained export + integrity check |
| P0 | INC-001 | Full incident process absent | IR SOP + tabletop + RCA + CAPA/retest record |
| P0 | DAT-001 | Data governance absent | data inventory/classification/retention/deletion policy |
| P0 | SUP-001 | Supplier/model-provider governance absent | supplier inventory + assessment + approved-use review |
| P0 | BCM-001 | Recovery controls absent | backup/recovery policy + successful restore test |
| P1 | RSK-001 | Product risk scoring is not enterprise risk treatment | risk register + treatment/acceptance records |
| P1 | IAM-001 | Reviewer suggestions are not access governance | access inventory + privilege review evidence |
| P1 | AI-001 | Change-time AI governance is not full AI lifecycle governance | AI inventory + TEVV + monitoring + retirement records |
| P1 | REV-001 | Release readiness is not recurring internal audit/management review | audit report + management review + CAPA status |
| P1 | SEC-001 | Independent security assessment outstanding | independent security assessment and closure receipt |

## Validation workflow

1. Resolve every evidence path in `COMPLIANCE.yaml` against the assessed commit.
2. Execute TypeScript/Python CI, route fixtures, action self-tests, release-readiness checks and representative controlled PR validation.
3. Generate canonical CASA evidence receipts for each control test rather than relying only on prose status claims.
4. Preserve the exact commit SHA, workflow run, finding output and reviewer/owner decision.
5. Close or formally accept residual P0 risks.
6. Re-run the readiness assessment before external assurance.

## Phase 10 entry criteria

External assurance remains blocked until P0 gaps are closed or risk-accepted, exact framework requirements are mapped, evidence retention is proven over the required period, and internal review is recorded.
