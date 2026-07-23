# DiffWall Roadmap

Last reconciled: 2026-07-23

## Current product state

DiffWall is an early working deterministic PR and structured-action firewall with merged policy packs, CI integrations, reporting formats, reviewer routing, controlled route evidence, and a buyer-facing AI Coding Governance Pilot.

Completed capability must not remain listed as future work. Future items below are release, compatibility, assurance, and productization gates rather than claims that the current implementation does not exist.

## Completed foundation

- deterministic TypeScript CLI;
- unified-diff parser;
- `ALLOW` / `REVIEW` / `HALT` scoring and critical hard-HALT behavior;
- Markdown and JSON reports;
- composite GitHub Action;
- default repository policy;
- fixture-based tests;
- Python structured-action firewall;
- CI coverage for both engines.

## Completed enforcement and reporting

- PR comment create/update behavior;
- evidence-before-enforcement ordering;
- SARIF output;
- CODEOWNERS-aware reviewer suggestions;
- GitLab merge-request CI guidance and example;
- fail-safe handling for unparseable diff input;
- controlled real-PR `REVIEW` and `HALT` validation;
- GitHub Actions workflow-risk fixtures.

## Completed policy coverage

- Node/Express policy pack;
- Python/Django policy pack;
- Terraform policy pack;
- protected-path, dependency, migration, workflow, secret, network, shell, and destructive-operation controls.

## Completed product framing

- buyer-facing use cases;
- live validation case study;
- canonical AI Coding Governance Pilot runbook;
- maturity and claim boundaries;
- independent-system positioning.

## Next release gates

### Pinned distribution

- cut and document a pinned action release;
- update examples to recommend the pinned tag;
- verify installation and rollback instructions;
- preserve `@main` as evaluation-only guidance.

### Compatibility assurance

- validate representative Node, Python, infrastructure, and mixed-language repositories;
- test monorepo path and ownership behavior;
- test very large diffs and performance limits;
- document unsupported repository shapes and failure modes.

### Security and operational hardening

- review action supply-chain and dependency behavior;
- define token and permission guidance for forked pull requests;
- verify report delivery fallbacks and operational-error handling;
- define override, exception, and incident procedures;
- preserve fail-safe behavior under malformed or incomplete inputs.

### Evidence and audit

- define long-lived evidence retention;
- add governed audit export beyond per-run reports and workflow artifacts;
- define artifact integrity and replay expectations;
- separate operational telemetry from policy decisions.

### Product proof

- add buyer-facing screenshots or short demo media for `ALLOW`, `REVIEW`, and `HALT`;
- execute the AI Coding Governance Pilot against an external test repository or consenting buyer environment;
- record calibration findings and limitations;
- create a concise buyer brief only after the canonical pilot contract remains stable.

## Later, separately governed work

- runtime agent middleware integration;
- hosted dashboard;
- organization-wide policy management;
- Semgrep and CodeQL result ingestion;
- agent identity and provenance expansion;
- additional framework and enterprise policy packs.

These items require separate architecture, security, maintenance, and ownership review. They must not create an implicit dependency on CASA, Operator Intelligence, VIL, PromptBP, the Governance Harness Toolkit, or another repository.

## Non-goals for current maturity

DiffWall does not currently claim:

- full enterprise production readiness;
- certification or regulatory compliance;
- universal language or repository coverage;
- zero false positives or false negatives;
- guaranteed prevention of unsafe AI-generated code;
- unattended production autonomy;
- customer adoption without inspectable evidence.
