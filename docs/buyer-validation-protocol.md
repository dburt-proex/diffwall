# DiffWall External Buyer Validation Protocol

**Status:** Protocol ready, external execution not yet authorized  
**Gate:** `REVIEW`

This protocol defines how to validate the AI Coding Governance Pilot with a real engineering team without converting interest, feedback, or a controlled test into an unsupported customer-adoption claim.

## Validation question

> Can an engineering team understand, operate, and evaluate DiffWall's deterministic `ALLOW`, `REVIEW`, and `HALT` boundaries against its own repository risks with acceptable setup effort and evidence quality?

## Eligible validation participant

The participant should:

- use GitHub pull requests or GitLab merge requests;
- use or actively evaluate AI coding assistants or agents;
- identify at least one protected repository surface;
- provide a repository owner and human reviewer;
- permit controlled synthetic fixtures on a non-production branch or test repository;
- agree that no production enforcement is enabled during validation;
- avoid customer data, live credentials, signing keys, and production secrets.

## Disqualifying conditions

Do not proceed when the participant:

- expects certification, compliance attestation, or guaranteed prevention;
- requires production deployment before evidence review;
- cannot identify approval ownership;
- cannot run inert fixtures safely;
- requires unreviewed access to confidential code or production systems;
- asks for hidden monitoring or unrestricted agent access.

## Validation sequence

1. **Qualification**
   - record the participant type, repository context, AI coding workflow, and intended decision;
   - confirm scope, exclusions, data boundaries, and named owners.

2. **Baseline interview**
   - capture current review rules, protected paths, security tooling, false-positive tolerance, and evidence-retention expectations;
   - record the participant's current pain in their own words.

3. **Controlled setup**
   - select the smallest relevant policy;
   - use a non-production branch or test repository;
   - retain the current pinned-release warning;
   - document every permission and rollback step.

4. **Proof execution**
   - run one `ALLOW` baseline;
   - run one non-destructive `REVIEW` fixture;
   - run one inert unsafe `HALT` fixture;
   - preserve reports, route evidence, execution time, and reviewer disposition.

5. **Usability review**
   - measure setup time;
   - ask whether the finding explanation is understandable;
   - ask whether the route matches the team's expectation;
   - record false positives, missing coverage, ownership gaps, and evidence-delivery issues.

6. **Decision handoff**
   - issue `proceed`, `proceed with conditions`, or `stop`;
   - distinguish validated behavior from participant opinion and future hypothesis;
   - preserve maturity and claim boundaries.

## Required evidence

- participant consent and named technical owner;
- repository type and non-production proof boundary;
- policy commit or content hash;
- DiffWall commit or immutable release tag;
- expected and observed routes;
- redacted reports or approved evidence locations;
- setup and execution timing;
- reviewer disposition;
- direct participant feedback;
- unresolved risks and rollback outcome;
- permission to cite, anonymize, or keep the result private.

## Interview prompts

1. What AI-assisted development risk are you trying to control?
2. Which paths or changes currently require experienced human judgment?
3. Which changes should never merge without an explicit stop?
4. What evidence would make a route defensible to engineering leadership or security?
5. Which findings were immediately understandable?
6. Which findings felt noisy, missing, or incorrectly prioritized?
7. How much setup and maintenance would be acceptable?
8. Would you run this as advisory evidence, a required check, or neither?
9. What would block adoption?
10. What next step would be valuable enough to approve?

## Validation outcome states

- `VALIDATED_SIGNAL`: The participant completed the proof and confirmed a concrete problem, useful evidence, and a plausible adoption path.
- `PARTIAL_SIGNAL`: The participant confirmed the problem but identified material usability, coverage, or ownership gaps.
- `NEGATIVE_SIGNAL`: The participant completed the proof and rejected the value proposition or operating model.
- `INCONCLUSIVE`: Evidence, authority, participation, or scope was insufficient.

A single participant never establishes broad market validation.

## Claim rules

Without explicit written permission, report only anonymized aggregate findings.

Allowed after one completed validation:

> DiffWall completed a controlled pilot with an external engineering team and recorded repository-specific `ALLOW`, `REVIEW`, and `HALT` evidence.

Not allowed without stronger evidence:

- adopted by customers;
- proven enterprise-ready;
- reduces incidents by a stated percentage;
- guarantees safe AI-generated code;
- satisfies a named regulation or certification;
- works across all repositories or frameworks.

## Exact approval required to execute externally

Record an explicit owner decision authorizing:

- the named participant or participant class;
- outreach or invitation method;
- data and confidentiality boundary;
- whether compensation, discounts, or free work are permitted;
- evidence retention and citation rights;
- the person authorized to send messages and schedule the validation.

Until that approval exists, no outreach, invitation, customer claim, or external pilot execution should occur.
