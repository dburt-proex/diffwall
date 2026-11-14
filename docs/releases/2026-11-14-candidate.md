# DiffWall release candidate repair — 2026-11-14

Scope: repair PR #43 on top of current main. No merge, tag, release, deployment, permission change or certification claim is authorized by this record.

## Changes

- Preserve main's hardened policy loading, opt-in REVIEW enforcement, report-write failure handling, saved-diff provenance, ecosystem classification and recorded CASA ownership.
- Pin Vitest 4.1.12 and use the npm-generated patched transitive tree. Retain zero direct npm runtime dependencies.
- Reject conflicting CLI diff sources and a head reference without a base.
- Correct the GitHub issue-comment PATCH URL and the portable module entrypoint.
- Parse and validate the compliance manifest, tracked evidence paths and control/remediation shapes; reject malformed YAML, duplicate keys and unsafe paths.
- Execute composite action route checks on pull requests.
- Pin official workflow actions to reviewed upstream commit identities.
- Run the full suite and compiler parity on Windows Node 22 as well as Linux Node 20/22.
- Audit both supported Node jobs and verify the extracted candidate archive without source or installed dependencies.

## Reproduction and provenance

The package-manager/compiler generation job [43609822176](https://github.com/dburt-proex/diffwall/actions/runs/43609822176), job `132492177275`, ran Node 20.20.2/npm 10.8.2. It installed from a regenerated lockfile, built TypeScript, passed 96 tests and reported zero audited vulnerabilities. The generated JSON export SHA-256 was `df2f8a052ad62bc733d81ef2471baf9a0d19141b95834c95589dc180c26cd2f6`. Lockfile integrity and committed JavaScript originate from npm/TypeScript output, not manual integrity edits or handwritten compiler output.

The generation job is preparatory evidence. Acceptance requires the final PR commit's clean-install, build-parity, complete Node/Python matrix, compliance gate, route checks, package smoke test and retained artifacts. The latest PR check URLs and final candidate SHA belong in the PR review packet.

## Approval and assurance

The existing v0.2.0 release is historical and must not move. New publication requires a separate owner decision. DiffWall thresholds remain REVIEW 40 / HALT 75. A self-scan escalation caused by protected workflow/dependency/execution changes requires explicit owner disposition; technical test success is not an automatic governance override.

The independent-assurance, incident-response, retention, data, supplier and recovery gaps in issue #42 remain visible. This record establishes no completed external buyer pilot or independent assessment.
