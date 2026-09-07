# Governed Revenue Operator

Working title for a governed AI employee that can move an approved product from
commercial intake to verified first revenue while preserving human authority over
external communication, commitments, credentials, and money.

This directory is an incubator. It is not part of the DiffWall enforcement
runtime and must be extracted into a standalone repository before production use.

## Current proof

The first increment implements:

- deterministic `ALLOW`, `REVIEW`, and `HALT` policy decisions;
- project-scoped, action-scoped, target-scoped, expiring approval grants;
- a revenue workflow from research through verified payment;
- separate gates for target identification, outreach, proposals, and invoices;
- unconditional halts for contract acceptance, fund transfer, destructive
  deletion, restricted-data transmission, and public broadcast;
- settled-payment evidence requirements before revenue is recognized;
- a tamper-evident in-memory decision ledger;
- regression tests and a no-network demonstration.

It does **not** send messages, access accounts, sign contracts, transfer money,
identify real targets, or claim customer validation.

## Human checkpoints

| Checkpoint | Human decision | What autonomy resumes afterward |
|---|---|---|
| Targeting release | Approve a bounded ICP, source set, and target scope | Identify and qualify targets inside the grant |
| Campaign release | Approve message, channel, recipients, cadence, and expiry | Send and follow up inside the grant |
| Commercial release | Approve offer, price, claims, proposal recipients, and expiry | Send bounded proposals |
| Invoice release | Approve payer, amount ceiling, currency, and terms | Issue the approved invoice |
| Revenue verification | Confirm acceptable payment evidence policy | Record only settled provider or bank evidence |

An approval is an expiring authority lease, not a permanent permission.

## Run locally

```bash
cd incubator/governed-revenue-operator
PYTHONPATH=src python -m unittest discover -s tests -v
PYTHONPATH=src python -m governed_revenue_operator.demo
```

The demo uses synthetic identifiers and local memory only.

## Documents

- [`docs/system-spec.md`](docs/system-spec.md) — governed implementation
  specification.
- [`docs/target-file-tree.md`](docs/target-file-tree.md) — target standalone
  repository map and phased build boundary.
- [`AGENTS.md`](AGENTS.md) — implementation and authority rules for future
  builders.

## Extraction gate

Before adding live connectors, a human owner must:

1. choose the standalone repository name and visibility;
2. approve the canonical policy owner;
3. approve data retention and deletion rules;
4. approve the first connector and its least-privilege scopes;
5. approve an encrypted secret store;
6. approve a sandbox pilot using synthetic or owner-controlled recipients.

