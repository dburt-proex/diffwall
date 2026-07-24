# DiffWall Architecture History and Authority

**Status:** Canonical interpretation record  
**Current architecture authority:** `README.md`, `STATUS.md`, `docs/ai-coding-governance-pilot.md`, and current merged source/tests

DiffWall was originally described as an enforcement layer inside a broader CASA and VIL control-plane concept. That framing remains useful historical context, but it is not a runtime dependency or current repository ownership rule.

## Current authority order

When documents disagree, use this order:

1. current merged source, tests, fixtures, and action manifests;
2. `README.md` and `STATUS.md` for current capability and maturity;
3. `docs/ai-coding-governance-pilot.md` for the buyer-facing evaluation contract;
4. `docs/live-validation-case-study.md` for the original controlled real-PR proof;
5. current integration documentation and policy packs;
6. historical architecture documents for design origin and vocabulary only.

## System independence

DiffWall is independently deployable.

- It does not require a CASA service to scan a diff or structured action.
- It does not require VIL to calculate a route.
- It does not require Operator Intelligence to run a pilot.
- It does not require PromptBP or the Governance Harness Toolkit at runtime.
- It must not import, call, or modify another project without a separately approved integration.

The independent systems may participate in a broader governance platform, but that relationship is optional and architectural, not a hidden runtime coupling.

## Historical document classification

| Document | Current classification | Use |
|---|---|---|
| `docs/architecture.md` | Reconciled architecture overview | Current DiffWall boundaries plus historical ecosystem context |
| `docs/live-validation-case-study.md` | Evidence authority | Original real-PR `REVIEW` and `HALT` proof |
| `docs/use-cases.md` | Commercial context | Buyer problems and initial package concepts |
| `docs/ai-coding-governance-pilot.md` | Current product contract | Canonical pilot scope, proof, and claim boundaries |
| README or docs that describe a mandatory CASA/VIL pipeline | Historical wording | Do not interpret as a runtime requirement |

## Archival rules

- Do not delete historical architecture merely because positioning changed.
- Add a visible authority note when historical wording could mislead current users.
- Preserve dates, decisions, and validation context.
- Do not silently rewrite original evidence records.
- Supersede outdated product claims through current canonical documents.
- Keep CASA repository ownership unresolved until one canonical repository is explicitly approved.

## Current platform relationship

```text
Operator Intelligence  → optional assessment and prioritization
DiffWall               → independent change-time and structured-action enforcement
CASA                   → separate runtime-governance architecture, canonical repository unresolved
VIL / PromptBP / Toolkit → optional independent supporting systems
```

This map describes possible coordination, not package ownership, deployment topology, or required data flow.
