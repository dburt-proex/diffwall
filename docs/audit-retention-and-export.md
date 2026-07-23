# DiffWall Audit Retention and Export Contract

**Status:** Canonical specification  
**Runtime implementation:** Partial, reports and workflow artifacts exist; long-lived storage remains caller-owned

This contract defines what DiffWall evidence should be retained, how it should be exported, and which privacy and integrity controls apply.

DiffWall does not silently create a hosted audit database. The caller owns the retention destination and access policy.

## Audit record classes

| Class | Examples | Default retention recommendation |
|---|---|---:|
| Decision summary | route, score, thresholds, timestamp, candidate version | 365 days |
| Finding evidence | rule IDs, severity, redacted evidence, affected files | 180 days |
| Execution context | repository identifier, base/head refs, policy identifier, tool version | 365 days |
| Human disposition | reviewer, decision, reason, exception, approval reference | 365 days or organization policy |
| Diagnostic logs | operational errors, timing, parser diagnostics | 30 days |
| Synthetic fixtures | controlled validation inputs and expected routes | Indefinite in source control |
| Raw pull-request diff | complete source change | Do not duplicate by default; retain through the source repository |
| Secrets or credentials | any live secret value | Never retain |

These values are defaults for evaluation. Legal, regulatory, contractual, or organizational requirements may require a different reviewed policy.

## Canonical export envelope

Each retained decision should be exportable as one JSON object or one JSONL line.

```json
{
  "schema_version": "diffwall.audit.v1",
  "record_id": "dw-20260723-example-001",
  "recorded_at": "2026-07-23T20:00:00Z",
  "repository": "owner/repository",
  "base_ref": "immutable-base-sha",
  "head_ref": "candidate-head-sha",
  "diffwall_version": "0.1.0",
  "policy": {
    "path": "rules/default.yml",
    "content_sha256": "sha256-of-policy-content"
  },
  "decision": {
    "route": "REVIEW",
    "score": 45,
    "thresholds": { "review": 40, "halt": 75 },
    "halted": false
  },
  "summary": {
    "files_changed": 2,
    "additions": 12,
    "deletions": 3,
    "changed_files": ["src/auth/session.ts", "test/session.test.ts"]
  },
  "findings": [
    {
      "rule_id": "protected-path-change",
      "severity": "medium",
      "score": 20,
      "files": ["src/auth/session.ts"],
      "evidence": []
    }
  ],
  "owners": {
    "suggested_reviewers": ["@security-team"]
  },
  "human_disposition": null,
  "integrity": {
    "record_sha256": "sha256-of-canonical-record-without-this-field",
    "previous_record_sha256": null
  },
  "redaction": {
    "secret_values_retained": false,
    "raw_diff_embedded": false
  }
}
```

A reference record is available at [`../examples/audit/scan-record.example.jsonl`](../examples/audit/scan-record.example.jsonl).

## Required fields

- schema version;
- stable record identifier;
- UTC timestamp;
- repository identity or approved pseudonymous identifier;
- immutable base and head references where available;
- DiffWall version or commit;
- policy path and policy content hash;
- route, score, thresholds, and halt state;
- changed-file summary;
- finding rule IDs, severity, scores, and redacted evidence;
- suggested reviewers when available;
- redaction statement;
- record integrity hash.

## Export formats

- **JSON:** one complete decision record for API or artifact use.
- **JSONL:** append-friendly stream for long-lived archives and downstream analytics.
- **SARIF:** code-scanning interoperability, not the complete audit envelope.
- **Markdown:** human review surface, not the canonical machine record.

JSON or JSONL should be the canonical long-lived export. SARIF and Markdown are derived views.

## Integrity requirements

1. Canonicalize field order before hashing.
2. Exclude the current `record_sha256` value from its own hash input.
3. Store the policy content hash with every decision.
4. Prefer an append-only destination.
5. Link records through `previous_record_sha256` when an ordered chain is required.
6. Never silently rewrite an approved record; issue a superseding record.
7. Record human exceptions separately from scanner output.

## Privacy requirements

- do not embed the full diff by default;
- do not retain live credentials, tokens, private keys, or session values;
- preserve redacted evidence only when it is necessary to explain the finding;
- allow repository names and paths to be pseudonymized for cross-client analysis;
- keep customer records separate from synthetic fixtures;
- require explicit approval before exporting evidence outside the source organization;
- apply the narrowest access scope that supports review and audit.

## Retention lifecycle

```text
Create decision record
→ validate required fields
→ redact prohibited values
→ calculate integrity hash
→ write to approved append-only destination
→ enforce retention class
→ review legal hold or exception
→ expire or supersede through an auditable process
```

Automatic destructive deletion is outside DiffWall's current scope. The caller's retention system owns expiry and legal-hold behavior.

## Acceptance criteria for future runtime export

- [ ] CLI can write the canonical envelope without changing the route.
- [ ] JSONL output is append-safe.
- [ ] policy and record hashes are deterministic.
- [ ] secret fixtures prove prohibited values are absent.
- [ ] human disposition can be added without rewriting scanner evidence.
- [ ] export failures are operational errors and never convert `HALT` to `ALLOW`.
- [ ] retention configuration is explicit and defaults to no external transmission.
