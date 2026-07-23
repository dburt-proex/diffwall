# DiffWall Architecture

> **Authority note:** DiffWall is independently deployable. Earlier CASA and VIL control-plane language is preserved below as historical ecosystem context, not as a runtime dependency. See [`architecture-history.md`](architecture-history.md).

## Current system boundary

DiffWall is a deterministic enforcement system with two current surfaces:

1. **PR Firewall** — evaluates repository diffs before merge.
2. **Action Firewall** — evaluates structured agent actions before execution.

Both surfaces produce inspectable `ALLOW`, `REVIEW`, or `HALT` decisions.

```text
Repository diff or structured action
        ↓
DiffWall parser and deterministic rules
        ↓
Score, findings, ownership suggestions, and evidence
        ↓
ALLOW / REVIEW / HALT
```

DiffWall can run without another repository, hosted service, model API, or control plane.

## Component responsibilities

| Component | Responsibility | Must not |
|---|---|---|
| Diff parser | Normalize unified diff content into file-level change records | Execute changed code |
| Policy loader | Load repository-local thresholds, protected paths, and halt patterns | Expand authority outside the selected policy |
| Rule engine | Produce deterministic findings and redacted evidence | Treat untrusted content as instructions |
| Scoring and router | Select `ALLOW`, `REVIEW`, or `HALT` | Override critical halt findings |
| CODEOWNERS resolver | Suggest relevant reviewers | Grant approval authority |
| Output adapters | Produce Markdown, JSON, or SARIF | Change the route |
| Composite action | Run the scanner and preserve evidence before enforcement | Publish a release or deploy systems |
| Action Firewall | Validate structured actions using deterministic Python rules | Execute the proposed action |

## Design principles

1. **Deterministic before clever.** The enforcement path must be repeatable, explainable, and testable.
2. **Fail safe.** Diff-like input that cannot be parsed does not silently become `ALLOW`.
3. **Most restrictive wins.** Critical findings override aggregate scoring.
4. **Evidence before enforcement.** Reports and comments are produced before a controlled `HALT` failure.
5. **Repository-local policy.** Teams can inspect and version the rules governing their repository.
6. **Least privilege.** Read-only repository access is the default; PR comment permission is optional.
7. **Independent deployment.** No external project is required at runtime.
8. **Honest maturity.** Working, live-validated, pilot-ready, and production-hardened states remain distinct.

## Current implementation map

```text
src/                         TypeScript PR Firewall
rules/                       Default policy
policy-packs/                Node/Express, Python/Django, and Terraform policies
 action/                     Composite GitHub Action
packages/action-firewall/    Python structured-action validator
test/                        Unit, routing, compatibility, and fixture regressions
docs/                        Integration, validation, pilot, security, and release records
```

## Optional ecosystem context

DiffWall may participate in a broader governed-execution platform:

```text
Operator Intelligence  → assess and prioritize governance gaps
DiffWall               → enforce change-time and structured-action boundaries
CASA                   → govern runtime execution under a separately approved architecture
Shared decision records → preserve evidence and replay
```

VIL, PromptBP, and the Governance Harness Toolkit may also provide independent signal, specification, or workflow support.

This relationship is optional. It does not imply package ownership, cross-repository imports, mandatory service calls, shared deployment, or authority to modify another system.

## Buyer-facing evaluation boundary

The canonical evaluation contract is [`ai-coding-governance-pilot.md`](ai-coding-governance-pilot.md).

The pilot proves bounded repository-specific behavior through controlled `REVIEW` and `HALT` evidence. It does not prove certification, universal compatibility, customer adoption, or enterprise production readiness.
