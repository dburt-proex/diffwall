# Governed Revenue Operator Build Contract

## Mission

Build a governed AI employee that advances an approved product toward verified
revenue without silently expanding its authority.

## Repository boundary

- Treat this incubator as a future standalone control plane.
- Do not introduce runtime imports from DiffWall, CASA, Operator Intelligence,
  Mirdexx, VIL, PromptBP, or the Governance Harness Toolkit.
- Integrate those systems only through versioned adapters or event contracts
  after a separate architecture decision.
- Do not change DiffWall product claims from this directory.

## Authority rules

- Default external, financial, contractual, destructive, public, credential,
  and restricted-data actions to `REVIEW` or `HALT`.
- Only the deterministic policy engine may issue an execution route.
- An LLM may propose an action but may not approve its own action.
- Every approval must be project-scoped, action-scoped, attributable, expiring,
  and revocable.
- A grant may narrow authority but may never override an unconditional `HALT`.
- Unknown actions, missing scope, missing evidence, and ambiguous recipients fail
  safe.
- Contract acceptance, fund transfer, destructive deletion, and secret exposure
  remain human-executed or prohibited.
- Revenue may be recorded only from settled source-of-truth evidence.

## Connector rules

- Agents never call provider SDKs directly.
- All connectors must sit behind a capability broker that validates the policy
  decision, approval grant, idempotency key, target, and data classification.
- Start with read-only scopes.
- Do not add a live connector until its threat model, scopes, revocation path,
  fixture, and failure behavior are approved.
- Never commit tokens, credentials, customer data, or real prospect lists.

## Evidence and logging

- Emit an action intent, policy decision, execution receipt, and state transition
  for every material step.
- Redact secrets and minimize personal data before logging.
- Preserve causation, actor, project, policy version, approval identifier, and
  evidence references.
- Use append-only records and explicit supersession.
- Never infer delivery, acceptance, payment, or revenue from an agent statement.

## Implementation rules

- Prefer deterministic orchestration and validation before probabilistic
  optimization.
- Keep state transitions explicit and test invalid transitions.
- Make commands idempotent before connecting external systems.
- Add tests with every behavioral increment.
- Keep changes bounded, reversible, and independently reviewable.
- Do not claim production readiness, compliance, customer adoption, or autonomous
  revenue generation without evidence.

## Required increment report

Each pull request must report:

- files and behavior changed;
- tests executed and results;
- permissions or data-handling impact;
- approval gates added or changed;
- known limitations and rollback;
- next bounded increment.

