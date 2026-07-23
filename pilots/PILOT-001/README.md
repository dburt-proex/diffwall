# DiffWall Pilot 001

**Status:** `PREPARATION`  
**External gate:** `REVIEW`  
**Pilot owner:** Drew Burt  
**Commercial model:** Free validation pilot with optional paid follow-on  
**Citation boundary:** Anonymized findings may be cited with participant consent

## Approved participant classes

1. Developer-tool company
2. Small SaaS or AI startup
3. Open-source project team
4. Software agency or consultancy

## Recruitment priority

Prioritize participants in this order:

1. A developer-tool or small SaaS/AI team already using AI coding agents and GitHub pull requests.
2. A software agency managing multiple client repositories with repeated review patterns.
3. An open-source project with clear maintainers, protected surfaces, and safe fixture capacity.

Priority is based on the likelihood of producing both credible technical evidence and a plausible paid implementation follow-on. It is a recruitment hypothesis, not a validated market conclusion.

## Pilot offer

The participant receives:

- one qualification and baseline interview;
- one repository-risk map;
- one bounded DiffWall policy configuration;
- one `ALLOW`, one `REVIEW`, and one inert `HALT` proof;
- one evidence-review session;
- one written outcome report;
- an optional separately scoped paid implementation follow-on.

The participant does not receive certification, compliance attestation, production enforcement, unrestricted custom development, guaranteed risk reduction, or an automatic public case study.

## Success hypotheses

These thresholds must be tested, not represented as existing proof:

- setup completed within 45 minutes;
- three fixtures execute without operational errors;
- participant can explain why each route occurred;
- human reviewer agrees that the inert `HALT` fixture should not merge;
- at least one repository-specific policy improvement is identified;
- route evidence is useful enough for engineering or security review;
- participant chooses `PROCEED` or `PROCEED_WITH_CONDITIONS`.

## Execution stages

### Stage 0: technical prerequisite

- [ ] Release-assurance work is canonical on `main`.
- [ ] Package and changelog version are updated to `0.2.0`.
- [ ] Full release-readiness matrix passes on the exact candidate.
- [ ] Immutable `v0.2.0` tag is published.
- [ ] Controlled route checks pass against the tag.

### Stage 1: recruitment authorization

- [x] Participant classes approved.
- [x] Free pilot with paid follow-on approved.
- [x] Anonymized citation boundary approved.
- [ ] Outreach channel approved.
- [ ] Authorized sender approved.
- [ ] Participant shortlist recorded.

### Stage 2: participant qualification

- [ ] Participant intake completed.
- [ ] Repository owner and reviewer named.
- [ ] Non-production proof environment confirmed.
- [ ] Consent and boundaries approved.
- [ ] Disqualifying conditions cleared.

### Stage 3: pilot design

- [ ] Baseline interview completed.
- [ ] Repository-risk map approved.
- [ ] Policy version or hash recorded.
- [ ] Three fixtures approved.
- [ ] Evidence and rollback locations approved.

### Stage 4: execution

- [ ] `ALLOW` proof recorded.
- [ ] `REVIEW` proof recorded.
- [ ] `HALT` proof recorded.
- [ ] Timing and evidence retained.
- [ ] No production effect or secret exposure occurred.

### Stage 5: outcome

- [ ] Participant feedback recorded.
- [ ] Outcome state assigned.
- [ ] Claim boundary approved.
- [ ] Cleanup and rollback verified.
- [ ] Paid follow-on signal assessed.

## Recruitment funnel

The target funnel is:

```text
10 researched prospects
→ 5 qualified candidates
→ 3 approved invitations
→ 1 selected participant
→ 1 completed controlled pilot
```

Research and shortlist creation are permitted. Sending invitations remains blocked until the outreach channel and authorized sender are explicitly recorded.

## Required pilot records

Copy the templates into this directory only after a participant is selected:

- `participant-intake.md`
- `consent-and-boundaries.md`
- `baseline-interview.md`
- `repository-risk-map.md`
- `fixture-plan.md`
- `run-record.md`
- `participant-feedback.md`
- `outcome-report.md`

Do not commit participant secrets, proprietary code, live credentials, or confidential identifiers. Use redacted or private evidence locations when necessary.

## Current blockers

- Release-assurance work is not yet fully canonical on `main`.
- `v0.2.0` is not yet published.
- Outreach channel and authorized sender are not yet approved.
- No participant has consented.

## Next queued action

Complete the clean release-assurance integration and `v0.2.0` preparation while preparing a private, scored shortlist of ten qualified prospects. Do not send outreach until the remaining authorization fields are resolved.