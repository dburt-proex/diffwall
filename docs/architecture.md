# DiffWall Architecture

DiffWall is the enforcement layer inside the CASA Control Plane.

```txt
Signal / diff / proposed action
        ↓
VIL: Verified Intelligence Layer
        ↓
CASA: Control Awareness System Architecture
        ↓
DiffWall: enforcement firewall
        ↓
ALLOW / REVIEW / HALT + audit trail
```

## Layer responsibilities

| Layer | Role | Primary question |
|---|---|---|
| VIL | Intelligence and signal scoring | Is this signal meaningful enough to act on? |
| CASA | Governance policy and routing | What should be allowed, reviewed, or halted? |
| DiffWall | Enforcement boundary | Can this action or diff proceed right now? |

## Enforcement surfaces

DiffWall has two enforcement surfaces:

1. **PR Firewall** — evaluates code diffs before merge.
2. **Action Firewall** — evaluates proposed agent actions before execution.

Both surfaces converge on the same governance route model: `ALLOW`, `REVIEW`, `HALT`.

## Design principles

1. **Deterministic before clever.** The enforcement path must be repeatable, explainable, and testable.
2. **Fail safe.** Unknown actions do not become allowed actions by default.
3. **Most restrictive wins.** Layered risk escalates to the strictest matched verdict.
4. **Audit trace is product surface.** Every decision should explain which policy fired and why.
5. **Adapters are replaceable.** PR diffs, agent actions, deploy requests, and workflow automations are different inputs to the same control philosophy.

## Current implementation map

```txt
packages/pr-firewall
  TypeScript implementation for GitHub PR diff risk routing.

packages/action-firewall
  Python stdlib-only CASA validator for proposed AI/agent actions.
```

## Strategic positioning

DiffWall should not be framed as only a code-review tool or only a Python toy validator. It is the enforcement firewall for governed AI execution.

The commercial wedge is the PR Firewall because it fits existing DevSecOps and GitHub workflows.

The deeper IP is the Action Firewall because it proves CASA can become executable policy instead of a slide deck.
