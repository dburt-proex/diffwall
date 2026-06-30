# CASA Mapping

CASA is the policy layer. DiffWall is the enforcement layer.

## Governance gates

| CASA gate | DiffWall route | Meaning |
|---|---|---|
| ALLOW | `ALLOW` | Safe enough to proceed under current policy |
| REVIEW | `REVIEW` | Human review required before execution or merge |
| HALT | `HALT` | Blocked because the proposed action violates a hard boundary |

## Action Firewall rule mapping

| Rule | Route | Boundary |
|---|---|---|
| R1 Irreversible destruction | HALT | Delete, wipe, drop, purge, truncate, destructive shell |
| R2 Financial transfer | HALT | Funds or financial value movement |
| R3 Exposed secret | HALT | API keys, private keys, credentials, tokens |
| R4 Public broadcast | REVIEW | Email, SMS, public post, press release |
| R5 Data mutation | REVIEW | Writes, deploys, config changes, persistent mutations |
| R6 Read-only | ALLOW | Read, query, fetch, list, search, summarize |

## Engine behavior

- Run every rule against the proposed action.
- Collect all matched rules.
- Return the most restrictive matched verdict.
- If no rule matches, return `REVIEW` as the fail-safe default.

## Product implication

CASA defines what the organization believes is controllable, reviewable, or forbidden.

DiffWall makes that belief executable.
