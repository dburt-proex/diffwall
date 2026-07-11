# DiffWall Live Validation Case Study

Date: 2026-07-11

## Executive result

DiffWall was exercised through real GitHub pull-request workflows against two controlled changes:

1. a governance-sensitive workflow change that should require human review;
2. a destructive SQL migration that must be blocked.

The system produced the expected deterministic routes, published evidence before enforcement, and preserved independent green CI for both the TypeScript PR Firewall and Python Action Firewall.

## Test 1 — REVIEW path

Validation pull request: [PR #15 — Validate DiffWall action end to end](https://github.com/dburt-proex/diffwall/pull/15)

The pull request contained workflow and action-hardening changes. DiffWall:

- loaded through the composite GitHub Action;
- installed dependencies and built the TypeScript scanner;
- compared the pull request against its immutable base commit;
- generated a markdown report;
- created a persistent marked PR comment;
- uploaded a workflow evidence artifact;
- routed the change to `REVIEW` with a score of `48 / 100`.

Triggered review signals included protected-path changes, GitHub Actions workflow changes, and medium diff size.

This was the correct outcome: governance and CI workflow changes should not silently auto-merge, but they were not inherently destructive enough to force `HALT`.

## Test 2 — HALT path

Validation pull request: [PR #16 — DiffWall must HALT destructive migration](https://github.com/dburt-proex/diffwall/pull/16)

The pull request deliberately added an unmergeable migration containing:

```sql
DROP TABLE production_customers;
```

DiffWall:

- detected the protected migration path;
- detected destructive SQL;
- assigned a risk score of `100 / 100`;
- published the `HALT` markdown report and PR comment;
- uploaded the evidence artifact;
- failed the enforcement workflow after evidence publication;
- left the TypeScript and Python engine CI workflows green.

The proof pull request was closed without merge.

## What this proves

The live tests demonstrate that DiffWall can currently:

- load and execute as a local composite GitHub Action;
- parse a real pull-request diff;
- apply deterministic repository-local rules;
- distinguish `REVIEW` from `HALT`;
- create or update a marked PR comment;
- preserve report delivery before blocking a dangerous change;
- upload diagnostic and decision evidence;
- separate enforcement failure from scanner or test-suite failure.

## What this does not prove

These tests do not establish full enterprise production readiness. Remaining hardening areas include:

- pinned release distribution;
- compatibility testing across representative repository types;
- security review of the action supply chain;
- performance testing on very large diffs and monorepos;
- SARIF and native check-run annotations;
- CODEOWNERS-aware routing and policy packs;
- retention and export strategy for long-lived audit evidence.

## Reproduction pattern

A repository can reproduce the validated integration with:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0

- uses: actions/setup-node@v4
  with:
    node-version: 20

- name: Run DiffWall
  uses: dburt-proex/diffwall/action@main
  with:
    base: ${{ github.event.pull_request.base.sha }}
    head: HEAD
    config: rules/default.yml
    format: markdown
    fail_on_halt: true
    github_token: ${{ github.token }}
```

Pin a release tag rather than `main` before using DiffWall as a required production merge gate.
