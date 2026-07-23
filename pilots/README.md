# DiffWall External Pilot Program

**Program status:** Repository-local execution kit ready  
**External recruitment status:** `REVIEW`  
**Production enforcement:** Prohibited during validation

This directory turns DiffWall's buyer-validation protocol into a repeatable, evidence-backed pilot workflow. It does not authorize outreach, production deployment, customer claims, pricing commitments, or access to confidential systems.

## Approved Pilot 001 boundary

### Eligible participant classes

- developer-tool company;
- small SaaS or AI startup;
- open-source project team;
- software agency or consultancy.

### Commercial structure

The first pilot is a **free validation pilot with an optional paid follow-on engagement**. The pilot itself creates no obligation to purchase, and no paid work may begin without separate written scope and approval.

### Evidence and citation

Anonymized findings may be cited only when the participant explicitly permits anonymized use in the signed pilot boundary record. Names, repository identifiers, code, screenshots, logs, and confidential facts remain private unless separately approved in writing.

## Non-negotiable controls

1. Use a non-production branch or test repository.
2. Do not require customer data, production credentials, signing keys, live secrets, or unrestricted source access.
3. Name one repository owner and one human reviewer.
4. Run one controlled `ALLOW`, one non-destructive `REVIEW`, and one inert `HALT` scenario.
5. Keep enforcement advisory during the pilot.
6. Preserve route evidence, execution timing, reviewer disposition, participant feedback, and rollback proof.
7. Separate verified behavior from participant opinion and commercial hypothesis.
8. Do not claim enterprise readiness, certification, guaranteed prevention, universal compatibility, or broad customer adoption.

## Pilot lifecycle

```text
Qualification
→ consent and boundaries
→ baseline interview
→ repository risk map
→ fixture approval
→ controlled execution
→ participant feedback
→ outcome decision
→ optional paid follow-on proposal
```

## Required technical dependency

External execution should use an immutable DiffWall release tag. Pilot preparation may proceed before `v0.2.0`, but no participant proof run should begin against a moving branch.

The buyer-validation protocol is currently represented by the release-assurance work and Issue #29. It must be canonical on `main` before the live pilot closes.

## Directory map

- [`templates/participant-intake.md`](templates/participant-intake.md)
- [`templates/consent-and-boundaries.md`](templates/consent-and-boundaries.md)
- [`templates/baseline-interview.md`](templates/baseline-interview.md)
- [`templates/repository-risk-map.md`](templates/repository-risk-map.md)
- [`templates/fixture-plan.md`](templates/fixture-plan.md)
- [`templates/run-record.md`](templates/run-record.md)
- [`templates/participant-feedback.md`](templates/participant-feedback.md)
- [`templates/outcome-report.md`](templates/outcome-report.md)
- [`PILOT-001/README.md`](PILOT-001/README.md)

## Outcome states

- `VALIDATED_SIGNAL`
- `PARTIAL_SIGNAL`
- `NEGATIVE_SIGNAL`
- `INCONCLUSIVE`

One completed pilot can support only the bounded statement that DiffWall completed a controlled external evaluation with one engineering team and recorded repository-specific route evidence.