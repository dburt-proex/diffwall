# Security Policy

DiffWall is a defensive developer tool. Please report security issues privately before opening public issues.

For now, open a private GitHub security advisory on the repository or contact the maintainer directly.

## Scope

Security-sensitive areas include:

- false negatives for critical HALT conditions
- unsafe handling of diff content
- command execution in the GitHub Action wrapper
- secret leakage in reports
- dependency or packaging compromise

DiffWall should not print full secrets. If a detector finds credential-like content, reports should redact evidence.
