# DiffWall Launch Copy

## One-line headline

DiffWall is an open-source firewall for AI-generated pull requests.

## Short post

Built DiffWall — an open-source PR risk firewall for agent-written code.

AI coding agents are generating bigger diffs faster than humans can review them. DiffWall scans a PR diff, scores the risk, explains the triggers, and routes it:

- ALLOW — low risk
- REVIEW — human review needed
- HALT — block merge

It is deterministic, repo-local, and runs as a GitHub Action.

Looking for feedback on which AI-generated PR changes should default to HALT.

## Show HN title

Show HN: DiffWall — an open-source firewall for AI-generated pull requests

## Show HN body

AI coding agents are producing larger diffs faster than teams can review them. I built DiffWall as an open-source GitHub Action that scans PR diffs, scores risk, explains triggered rules, and routes the change to ALLOW, REVIEW, or HALT.

It looks for changes like auth/security paths, GitHub workflow edits, dependency manifest changes, deleted tests, dangerous shell commands, destructive migrations, TLS disablement, and new network egress near environment access.

The first release is intentionally deterministic: no LLM scoring, no SaaS, no dashboard. I would like feedback on which rules should default to HALT vs REVIEW.
