# DiffWall Use Cases

DiffWall is designed for teams that are increasing software and workflow velocity with coding agents but still need deterministic control over what can merge or execute.

## 1. AI-generated pull-request governance

**Buyer:** CTO, VP Engineering, platform lead, application-security lead

**Problem:** Coding agents can produce large changes faster than human reviewers can assess blast radius.

**DiffWall role:** Scan every pull-request diff, explain triggered rules, and route the change to `ALLOW`, `REVIEW`, or `HALT` before merge.

Typical signals:

- authentication and authorization changes;
- GitHub Actions modifications;
- dependency and install-script changes;
- removed tests;
- destructive migrations;
- secret-like additions;
- network egress near environment access.

## 2. Protected workflow and infrastructure changes

**Buyer:** Platform engineering, DevOps, DevSecOps

**Problem:** A small workflow, Terraform, deployment, or permission change can create more risk than a much larger application-code diff.

**DiffWall role:** Apply protected-path and critical-pattern policies that raise mandatory review or halt conditions independently of ordinary CI success.

## 3. Destructive database migration prevention

**Buyer:** Backend engineering, database reliability, fintech and regulated SaaS teams

**Problem:** Agent-written migrations may introduce destructive SQL that passes syntax checks but creates unacceptable operational risk.

**DiffWall role:** Force `HALT` for destructive operations such as `DROP TABLE`, `TRUNCATE TABLE`, and unsafe broad deletion patterns.

## 4. Credential and secret leakage control

**Buyer:** Security engineering, application security, engineering leadership

**Problem:** Generated configuration or test data can accidentally contain credentials, private keys, tokens, or secret-like strings.

**DiffWall role:** Detect secret patterns in added lines, redact evidence in the report, and force `HALT`.

## 5. Agent action governance

**Buyer:** AI platform lead, automation lead, risk and compliance engineering

**Problem:** An autonomous agent may propose a financial transfer, destructive operation, public broadcast, or persistent state mutation.

**DiffWall role:** Validate the structured action object before execution through the Python Action Firewall:

- read-only action → `ALLOW`;
- state mutation or external communication → `REVIEW`;
- destruction, financial transfer, or exposed secret → `HALT`.

## 6. Vendor-neutral AI engineering control

**Buyer:** Organizations using multiple coding agents or model providers

**Problem:** Teams need one enforcement policy across Codex, Claude Code, Cursor, Copilot, OpenCode, and internal agents.

**DiffWall role:** Govern the resulting diff or proposed action rather than trusting a specific model provider's self-review.

## Initial commercial packages

### AI PR Governance Audit

A fixed-scope review of repository risk surfaces, protected paths, current CI controls, AI coding usage, and recommended DiffWall policy thresholds.

### DiffWall Implementation Sprint

A short implementation engagement covering action installation, policy configuration, route calibration, evidence retention, and controlled ALLOW / REVIEW / HALT validation.

### Governed Agent Action Review

An architecture and prototype engagement that places the Action Firewall between agent intent and tools, APIs, payments, databases, or external communications.

## Best initial market

The strongest initial wedge is a software team that:

- actively uses AI coding agents;
- operates on GitHub;
- has sensitive authentication, billing, customer-data, workflow, or migration surfaces;
- lacks a deterministic policy gate between generated code and merge;
- can adopt a repository-local GitHub Action without a lengthy platform procurement cycle.
