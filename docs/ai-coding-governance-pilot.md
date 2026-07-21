# DiffWall AI Coding Governance Pilot

**Status:** Evaluation runbook  
**Directive:** `LD-2026-07-21-001`  
**Evidence snapshot:** 2026-07-21  
**Product maturity:** Early working deterministic enforcement system, not a fully hardened enterprise DevSecOps product

## Purpose

This runbook converts DiffWall's existing, merged controls into a bounded evaluation process for engineering teams adopting AI coding agents.

The pilot is designed to answer one question:

> Can the team apply explainable, repository-local policy to AI-assisted software changes, distinguish changes that require human review from changes that must stop, and preserve inspectable evidence before enforcement?

This document operationalizes the existing **AI PR Governance Audit** and **DiffWall Implementation Sprint** concepts described in [`docs/use-cases.md`](use-cases.md). It does not create a new product tier, binding service commitment, or pricing model.

## Intended customer

The pilot is intended for a software team that:

- uses AI coding assistants or agents in normal development;
- manages code through GitHub pull requests or GitLab merge requests;
- has identifiable high-consequence paths such as authentication, permissions, billing, customer data, workflows, infrastructure, or database migrations;
- can run a repository-local Node-based scanner in CI;
- wants deterministic `ALLOW`, `REVIEW`, and `HALT` routing in addition to ordinary tests and code review;
- can provide a technical owner and a human reviewer for policy decisions.

## Explicit non-customer

The pilot is not appropriate when the team:

- requires an already-certified or fully hardened enterprise security product;
- cannot run controlled fixtures in a non-production branch;
- expects DiffWall to replace code review, SAST, dependency scanning, CI, or incident response;
- requires organization-wide hosted policy management or a hosted dashboard;
- requires a pinned production release before evaluation;
- cannot identify who owns approval and override decisions;
- wants autonomous production enforcement without a human-reviewed policy baseline.

## Pilot boundaries

The pilot evaluates DiffWall as an independent developer-control system.

It does not require or couple to another repository, control plane, scoring engine, portfolio, or runtime service. It does not modify production infrastructure, deploy a hosted service, publish customer data, or grant new repository permissions beyond those deliberately approved for the evaluation.

The pilot must use controlled changes that are safe to close without merge.

## Prerequisites and access assumptions

### Required

- One selected repository and a named repository owner.
- A non-production branch or test repository for controlled fixtures.
- Node.js 20 or later.
- Read access to repository content and pull-request diffs.
- Permission to add or test a CI workflow on the selected evaluation branch.
- A human reviewer authorized to interpret `REVIEW` and confirm `HALT` evidence.
- A written list of protected paths, destructive patterns, and current CI controls.

### Optional

- `pull-requests: write` permission for marked PR comment updates.
- A `CODEOWNERS` file for suggested-reviewer routing.
- GitHub code-scanning support when SARIF output is selected.
- GitLab merge-request pipeline access when evaluating the CLI outside GitHub Actions.

### Access constraints

- Use the least privilege required for the selected proof path.
- Do not provide production secrets, customer data, signing keys, or administrator credentials.
- Treat PR comments as optional delivery. Artifact or step-summary evidence must remain available when comment permissions are absent.
- Do not make DiffWall a required production merge gate while invoking `@main`. The current documentation recommends a pinned release before production enforcement.

## Merged capability baseline

Only capabilities present on the default branch at the evidence snapshot may be used in the pilot readiness claim.

| Capability | Pilot use | Evidence |
|---|---|---|
| Deterministic PR diff scanning | Classify repository changes by explicit rules and thresholds | [`README.md`](../README.md), [`src/scanner.ts`](../src/scanner.ts) |
| `ALLOW` / `REVIEW` / `HALT` routing | Produce a governed route with explainable findings | [`README.md`](../README.md), [`STATUS.md`](../STATUS.md) |
| Composite GitHub Action | Execute the scanner in pull-request workflows | [`docs/github-action.md`](github-action.md) |
| PR comment and step-summary reporting | Preserve a readable decision record | [`docs/github-action.md`](github-action.md), [`src/github-comment.ts`](../src/github-comment.ts) |
| Evidence-before-enforcement behavior | Publish evidence before failing a controlled `HALT` workflow | [`docs/live-validation-case-study.md`](live-validation-case-study.md) |
| Markdown, JSON, and SARIF output | Produce human-readable or machine-ingestible reports | [`docs/github-action.md`](github-action.md), [`src/output/sarif.ts`](../src/output/sarif.ts) |
| CODEOWNERS-aware routing | Suggest owners for files associated with triggered findings | [`src/codeowners.ts`](../src/codeowners.ts), [`test/codeowners.test.ts`](../test/codeowners.test.ts) |
| GitLab CI execution pattern | Run the Node CLI against merge-request refs and fail only on `HALT` | [`docs/gitlab-ci.md`](gitlab-ci.md), [`examples/gitlab-ci.yml`](../examples/gitlab-ci.yml) |
| Terraform policy pack | Protect infrastructure paths and detect high-risk infrastructure patterns | [`policy-packs/terraform.yml`](../policy-packs/terraform.yml) |
| GitHub Actions workflow-risk fixtures | Exercise safe workflow review and unsafe workflow halt paths | [`test/fixtures/review-github-actions-workflow-change.diff`](../test/fixtures/review-github-actions-workflow-change.diff), [`test/fixtures/halt-github-actions-pull-request-target.diff`](../test/fixtures/halt-github-actions-pull-request-target.diff) |

### Pending capability excluded from readiness

The Python/Django policy pack is under review in PR #23. Until that pull request is merged and its resulting default-branch state is verified:

- do not present Python/Django policy support as shipped;
- do not include its fixtures in required pilot proof;
- do not use it as evidence of current framework breadth;
- describe it only as pending review work.

## Five-stage pilot flow

```text
Inventory
   ↓
Policy selection
   ↓
Controlled fixtures
   ↓
Evidence review
   ↓
Recommendation handoff
```

## Stage 1 — Inventory

### Objective

Identify the repository surfaces where AI-assisted changes could create disproportionate risk.

### Activities

1. Record the repository, default branch, primary languages, package manifests, and CI provider.
2. Identify how coding assistants or agents currently contribute changes.
3. List protected paths, including as applicable:
   - authentication and authorization;
   - permissions and security configuration;
   - billing and payment logic;
   - database migrations;
   - deployment and workflow files;
   - infrastructure definitions;
   - secret-bearing configuration;
   - dependency manifests and lockfiles.
4. Record existing controls, including tests, branch protections, required reviews, SAST, dependency checks, and CODEOWNERS.
5. Identify the human owner for policy changes, `REVIEW` decisions, and any override process.

### Output

A repository risk-surface inventory containing:

- protected paths;
- critical patterns;
- existing controls;
- ownership gaps;
- selected evaluation route;
- known exclusions.

### Evidence requirement

Every proposed protected path or halt pattern must be tied to an identifiable repository risk, ownership rule, or operational consequence.

## Stage 2 — Policy selection

### Objective

Select the smallest policy configuration that can test meaningful governance behavior without pretending to cover the entire repository.

### Activities

1. Start with [`rules/default.yml`](../rules/default.yml) unless a merged policy pack is a closer fit.
2. Use [`policy-packs/terraform.yml`](../policy-packs/terraform.yml) only when infrastructure files are in scope.
3. Review `ignorePaths`, `protectedPaths`, thresholds, and `haltPatterns` with the repository owner.
4. Confirm that policy-definition files themselves are ignored where required to prevent self-scanning false positives.
5. Document why each change should cause `ALLOW`, `REVIEW`, or `HALT`.
6. Preserve unknown or uncertain changes for human review rather than weakening the route to silent allow.

### Output

A proposed evaluation policy with:

- selected configuration source;
- any repository-local adjustments;
- expected route for each controlled fixture;
- named policy approver;
- rollback instructions.

### Evidence requirement

No policy becomes a production merge requirement during the pilot. The evaluation policy must remain branch-scoped and reversible.

## Stage 3 — Controlled fixtures

### Objective

Prove that DiffWall distinguishes a meaningful review boundary from a mandatory halt boundary.

### Required `REVIEW` proof

The pilot must include one controlled, non-destructive change that is expected to require human judgment.

Acceptable examples include:

- a GitHub Actions workflow edit;
- an authentication or permissions-path change without a critical destructive pattern;
- a dependency-manifest change;
- an infrastructure-path edit that does not contain a halt pattern.

The repository already contains a safe reference fixture at [`test/fixtures/review-github-actions-workflow-change.diff`](../test/fixtures/review-github-actions-workflow-change.diff).

A successful `REVIEW` proof must show:

- completed scanning rather than an operational error;
- route `REVIEW`;
- triggered rules and file evidence;
- a readable report;
- no false claim that the change was blocked;
- named human review ownership.

### Required `HALT` proof

The pilot must include one controlled fixture containing an explicitly unsafe pattern. It must not execute the unsafe operation.

Acceptable examples include:

- destructive SQL in a fixture-only migration diff;
- unsafe `pull_request_target` use with untrusted checkout;
- broad secret exposure in a workflow fixture;
- a Terraform destroy or destructive infrastructure pattern inside a saved diff.

Reference evidence includes:

- [`docs/live-validation-case-study.md`](live-validation-case-study.md);
- [`test/fixtures/halt-github-actions-pull-request-target.diff`](../test/fixtures/halt-github-actions-pull-request-target.diff);
- [`policy-packs/terraform.yml`](../policy-packs/terraform.yml).

A successful `HALT` proof must show:

- completed scanning rather than an operational error;
- route `HALT`;
- critical rule evidence;
- report or comment publication before enforcement failure when `fail_on_halt` is enabled;
- no merge of the controlled unsafe branch;
- a documented closure or rollback path.

### Optional `ALLOW` baseline

An `ALLOW` fixture may be included to verify that low-risk changes are not automatically escalated. It is useful for calibration but does not replace the required `REVIEW` and `HALT` evidence.

### Safety rule

Fixtures must be inert representations of risk. Do not run destructive commands, expose real credentials, modify production data, or test against a live customer environment.

## Stage 4 — Evidence review

### Objective

Determine whether the route, evidence, and enforcement behavior are understandable enough for an engineering team to operate.

### Review dimensions

- **Route correctness:** Did the observed route match the declared expectation?
- **Rule explainability:** Can the reviewer identify why each finding was triggered?
- **Evidence delivery:** Was the report preserved in the selected output surface?
- **Enforcement ordering:** For `HALT`, was evidence produced before the workflow failed?
- **Ownership routing:** When CODEOWNERS is present, were relevant owner suggestions produced?
- **Operational separation:** Can the team distinguish scanner failure from policy `HALT`?
- **Noise level:** Did the policy create avoidable findings that require calibration?
- **Reproducibility:** Can the same fixture produce the same route under the same policy?

### Output

An evidence review table containing:

| Fixture | Expected route | Observed route | Evidence location | Reviewer | Result |
|---|---|---|---|---|---|
| Controlled review change | `REVIEW` |  |  |  |  |
| Controlled unsafe change | `HALT` |  |  |  |  |
| Optional low-risk change | `ALLOW` |  |  |  |  |

### Decision states

- **Ready for extended evaluation:** Required proofs pass and material false positives are understood.
- **Ready with conditions:** Required proofs pass, but policy calibration or ownership work remains.
- **Not ready:** Required routes fail, evidence is missing, or the team cannot operate the review boundary safely.

These are pilot conclusions, not enterprise certification levels.

## Stage 5 — Recommendation handoff

### Objective

Translate the controlled evidence into a bounded next-step decision without silently enabling production enforcement.

### Required recommendations

1. Proposed protected paths and their owners.
2. Proposed threshold or pattern changes, each with justification.
3. Recommended report format: Markdown, JSON, or SARIF.
4. Recommended evidence-retention location.
5. Required human-review path for `REVIEW`.
6. Required incident or exception path for `HALT`.
7. Release-pinning requirement before production gating.
8. Compatibility, performance, and supply-chain validation still required.
9. A clear recommendation to proceed, proceed with conditions, or stop.

### Output

A final pilot report and a reversible implementation plan. No production deployment, merge-rule change, or binding commercial commitment occurs automatically.

## Pilot deliverables

- Repository risk-surface inventory.
- Evaluation policy and route expectations.
- At least one controlled `REVIEW` fixture and one controlled `HALT` fixture.
- DiffWall reports and evidence locations for each required fixture.
- Evidence review table.
- Policy-calibration findings.
- Ownership and escalation recommendations.
- Final readiness conclusion.
- Rollback and cleanup checklist.

## Acceptance criteria

The pilot is accepted only when all of the following are true:

- [ ] The repository and evaluation branch are explicitly identified.
- [ ] Protected paths and critical patterns have written rationales.
- [ ] The required `REVIEW` fixture completes with route `REVIEW`.
- [ ] The required `HALT` fixture completes with route `HALT`.
- [ ] The `HALT` fixture remains unmerged and executes no destructive operation.
- [ ] Each route has an inspectable report or artifact.
- [ ] The team can distinguish operational exit code `1` from policy `HALT` exit code `2` when using `--fail-on-halt`.
- [ ] Evidence is preserved before enforcement failure in the selected `HALT` path.
- [ ] A human owner is named for policy and review decisions.
- [ ] Pending Python/Django work is excluded from shipped-capability claims.
- [ ] The final report states current maturity limits.
- [ ] Rollback and cleanup steps are documented.

## Evidence checklist

### Repository context

- [ ] Repository name and default branch
- [ ] Evaluation branch or test repository
- [ ] Primary language and framework
- [ ] CI provider
- [ ] AI coding tools in use
- [ ] Protected paths
- [ ] Existing branch protections
- [ ] Existing security and test controls
- [ ] CODEOWNERS status

### Policy context

- [ ] Policy source and commit
- [ ] Thresholds
- [ ] Ignore paths
- [ ] Protected paths
- [ ] Halt patterns
- [ ] Policy owner
- [ ] Expected route per fixture

### Execution evidence

- [ ] Command or workflow invocation
- [ ] Base and head refs
- [ ] DiffWall version or commit reference
- [ ] Report format
- [ ] Route and score
- [ ] Triggered rules
- [ ] Evidence artifact, summary, comment, or SARIF location
- [ ] Workflow exit code
- [ ] Reviewer disposition

### Boundary evidence

- [ ] No production data changed
- [ ] No real secret included
- [ ] Unsafe branch not merged
- [ ] No new persistent permission granted
- [ ] No production gate enabled automatically
- [ ] Cleanup or branch-close action recorded

## Sample final pilot report outline

```markdown
# DiffWall AI Coding Governance Pilot Report

## 1. Executive decision
- Proceed / proceed with conditions / stop
- Evidence summary
- Primary risk and readiness finding

## 2. Evaluation scope
- Repository and branch
- AI-assisted development context
- Included and excluded risk surfaces

## 3. Existing control environment
- CI and test controls
- Review and ownership controls
- Current governance gaps

## 4. Policy evaluated
- Configuration source
- Thresholds and protected paths
- Critical patterns
- Named owner

## 5. Controlled proof results
- REVIEW fixture and evidence
- HALT fixture and evidence
- Optional ALLOW baseline

## 6. Findings
- Route accuracy
- False positives or missing coverage
- Evidence quality
- Reviewer usability
- Operational failure handling

## 7. Recommendations
- Policy calibration
- Ownership and escalation
- Evidence retention
- Release pinning
- Additional compatibility and security validation

## 8. Maturity boundary
- What the pilot proves
- What the pilot does not prove
- Pending capabilities excluded from the claim

## 9. Rollback and cleanup
- Branch disposition
- Workflow removal or disablement
- Evidence retention decision
- Remaining approvals
```

## Exclusions

This pilot does not include:

- new scanner, rule, or action-firewall behavior;
- a production deployment;
- automatic merge-rule or branch-protection changes;
- customer-data processing;
- external publication or outreach;
- pricing or binding delivery terms;
- organization-wide hosted policy management;
- a hosted dashboard;
- certification, compliance attestation, or enterprise-readiness claims;
- the pending Python/Django policy pack;
- integration or runtime coupling with another project.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| False confidence from two controlled routes | State that the pilot proves bounded behavior only; require broader compatibility testing before production use. |
| False positives from broad protected paths | Record each finding and calibrate only with a named owner. |
| Policy self-scanning or stale configuration | Verify ignore paths and pin the evaluated policy commit. |
| PR comment permission failure | Preserve step-summary or artifact evidence; do not change the route. |
| Confusion between operational error and policy halt | Record the exit code and scanner completion status. |
| Unsafe fixture accidentally merged | Use a dedicated branch, require human review, and close the branch after evidence capture. |
| Capability drift after the evidence snapshot | Recheck default-branch files and active pull requests before every new pilot. |
| Documentation drift | Prefer current source, tests, and merged history when status documents disagree. |

## Rollback and cleanup

At the end of the pilot:

1. Close controlled unsafe pull requests without merge.
2. Remove branch-scoped test workflows if they are not approved for continued evaluation.
3. Revoke any temporary token or permission created specifically for the pilot.
4. Preserve only the approved evidence artifacts and final report.
5. Record whether the policy is rejected, retained for evaluation, or proposed for a separately reviewed production change.
6. Do not make DiffWall a required production gate until the release, compatibility, security, and ownership prerequisites are approved.

## Maturity and claim boundaries

A successful pilot may support this statement:

> DiffWall completed controlled `REVIEW` and `HALT` evaluations against an explicitly defined repository policy and preserved inspectable decision evidence.

It does not support claims of:

- full enterprise production readiness;
- universal language or framework coverage;
- complete protection against malicious or incorrect AI-generated code;
- regulatory certification;
- zero false positives or false negatives;
- organization-wide policy administration;
- unattended production autonomy.

## Evidence freshness note

[`docs/live-validation-case-study.md`](live-validation-case-study.md) and [`STATUS.md`](../STATUS.md) preserve the July 11 validation boundary. The default branch later gained additional merged capability, including SARIF output, CODEOWNERS-aware routing, a Terraform policy pack, GitLab CI guidance, and GitHub Actions workflow-risk fixtures.

For pilot claims, use the current default-branch source and tests as the capability authority, while retaining the live case study as the authority for the original real-PR `REVIEW` and `HALT` proof. Recheck active pull requests before each evaluation so pending work is not represented as shipped.
