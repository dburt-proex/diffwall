# Pilot Controlled Fixture Plan

**Pilot ID:** `PILOT-001`  
**Participant:**  
**DiffWall version or immutable commit:**  
**Policy file or content hash:**  
**Execution environment:**

## Global fixture controls

- [ ] Non-production branch or test repository only.
- [ ] No customer data, production secrets, signing keys, or live credentials.
- [ ] No destructive command will execute.
- [ ] All unsafe content is inert test data.
- [ ] Expected routes are approved before execution.
- [ ] Rollback steps are recorded.
- [ ] Repository owner and human reviewer are present or available.

## Scenario 1: ALLOW

- Change description:
- Files changed:
- Why the change should be low risk:
- Expected route: `ALLOW`
- Expected score range:
- Expected findings:
- Success criteria:
  - [ ] No material protected boundary triggered.
  - [ ] Route explanation is understandable.
  - [ ] No operational error occurs.

## Scenario 2: REVIEW

- Change description:
- Protected surface:
- Files changed:
- Why human review is appropriate:
- Expected route: `REVIEW`
- Expected score range:
- Expected findings:
- Expected suggested reviewers:
- Success criteria:
  - [ ] Change remains non-destructive.
  - [ ] Protected surface is identified.
  - [ ] Evidence supports a human review decision.
  - [ ] Participant agrees or records why the route is misaligned.

## Scenario 3: HALT

- Inert unsafe pattern:
- Files changed:
- Why the change should stop:
- Expected route: `HALT`
- Expected score range:
- Expected findings:
- Safety proof confirming no destructive action executes:
- Success criteria:
  - [ ] Deterministic stop occurs.
  - [ ] Report exists before enforcement failure.
  - [ ] Participant reviewer agrees or records why the route is misaligned.
  - [ ] No production effect occurs.

## Execution commands

Record the exact commands or workflow references used:

```text

```

## Rollback and cleanup

- Branch cleanup action:
- Fixture removal action:
- Evidence retention action:
- Permission rollback action:
- Rollback owner:

## Fixture approval

- Repository owner: `APPROVED | REVIEW | REJECTED`
- Human reviewer: `APPROVED | REVIEW | REJECTED`
- DiffWall pilot owner: `APPROVED | REVIEW | REJECTED`
- Approval date:
- Conditions: