# Target Standalone File Tree

This is the intended all-around system boundary. Checked items are implemented
in the current vertical slice. Unchecked items are sequenced work, not implied
capability.

```text
governed-revenue-operator/
├── README.md                                      [implemented]
├── AGENTS.md                                      [implemented]
├── LICENSE                                        [owner decision]
├── pyproject.toml                                 [implemented]
├── .env.example                                   [after secret-store decision]
├── config/
│   ├── agent-manifest.yaml                        [phase 2]
│   ├── project.example.yaml                       [phase 2]
│   ├── policy.example.json                        [implemented]
│   ├── policies/
│   │   ├── authority.yaml                         [phase 2]
│   │   ├── communications.yaml                    [phase 2]
│   │   ├── commercial.yaml                        [phase 2]
│   │   ├── privacy.yaml                           [phase 2]
│   │   └── retention.yaml                         [phase 3]
│   └── connectors/
│       ├── github.readonly.yaml                   [phase 3]
│       ├── crm.sandbox.yaml                       [phase 3]
│       ├── email.sandbox.yaml                     [phase 3]
│       └── payments.readonly.yaml                 [phase 4]
├── docs/
│   ├── system-spec.md                             [implemented]
│   ├── target-file-tree.md                        [implemented]
│   ├── threat-model.md                            [phase 2 gate]
│   ├── data-retention.md                          [phase 2 gate]
│   ├── connector-approval.md                      [phase 3 gate]
│   ├── incident-response.md                       [phase 3]
│   └── runbooks/
│       ├── campaign-release.md                    [phase 3]
│       ├── revoke-authority.md                    [phase 3]
│       └── partial-execution.md                   [phase 3]
├── prompts/
│   ├── chief-of-staff.md                          [phase 2]
│   ├── researcher.md                              [phase 2]
│   ├── qualification.md                           [phase 2]
│   ├── messaging.md                               [phase 2]
│   ├── sales.md                                   [phase 2]
│   └── recursive-check.md                         [phase 2]
├── schemas/
│   ├── project.schema.json                        [phase 2]
│   ├── action-intent.schema.json                  [phase 2]
│   ├── approval-grant.schema.json                 [phase 2]
│   ├── policy-decision.schema.json                [phase 2]
│   ├── execution-receipt.schema.json              [phase 2]
│   ├── lead.schema.json                           [phase 2]
│   ├── opportunity.schema.json                    [phase 2]
│   └── revenue-event.schema.json                  [phase 2]
├── src/governed_revenue_operator/
│   ├── __init__.py                                [implemented]
│   ├── domain.py                                  [implemented]
│   ├── policy.py                                  [implemented]
│   ├── ledger.py                                  [implemented]
│   ├── workflow.py                                [implemented]
│   ├── demo.py                                    [implemented]
│   ├── api/
│   │   ├── app.py                                 [phase 3]
│   │   ├── approvals.py                           [phase 3]
│   │   ├── projects.py                            [phase 3]
│   │   ├── runs.py                                [phase 3]
│   │   └── webhooks.py                            [phase 4]
│   ├── agents/
│   │   ├── chief_of_staff.py                      [phase 3]
│   │   ├── project_analyst.py                     [phase 3]
│   │   ├── market_researcher.py                   [phase 3]
│   │   ├── qualification_operator.py              [phase 3]
│   │   ├── messaging_operator.py                  [phase 3]
│   │   ├── sales_operator.py                      [phase 4]
│   │   └── compliance_monitor.py                  [phase 3]
│   ├── orchestration/
│   │   ├── planner.py                             [phase 2]
│   │   ├── scheduler.py                           [phase 3]
│   │   ├── state_machine.py                       [phase 2 extraction]
│   │   ├── retry.py                               [phase 3]
│   │   └── circuit_breaker.py                     [phase 3]
│   ├── governance/
│   │   ├── policy_engine.py                       [phase 2 extraction]
│   │   ├── authority.py                           [phase 2 extraction]
│   │   ├── capability_broker.py                   [phase 3 gate]
│   │   ├── data_classifier.py                     [phase 3]
│   │   ├── evidence_gate.py                       [phase 2]
│   │   └── claim_validator.py                     [phase 3]
│   ├── workflows/
│   │   ├── project_intake.py                      [phase 2]
│   │   ├── offer_packaging.py                     [phase 3]
│   │   ├── targeting.py                           [phase 3]
│   │   ├── outreach.py                            [phase 3 sandbox]
│   │   ├── followup.py                            [phase 3 sandbox]
│   │   ├── qualification.py                       [phase 3]
│   │   ├── proposal.py                            [phase 4 sandbox]
│   │   ├── invoicing.py                           [phase 4 sandbox]
│   │   └── revenue_verification.py                [phase 4 readonly]
│   ├── connectors/
│   │   ├── base.py                                [phase 3]
│   │   ├── sandbox.py                             [phase 3 first]
│   │   ├── github.py                              [phase 3 readonly]
│   │   ├── crm.py                                 [phase 3]
│   │   ├── email.py                               [phase 3]
│   │   ├── calendar.py                            [phase 4]
│   │   └── payments.py                            [phase 4 readonly]
│   ├── memory/
│   │   ├── working.py                             [phase 2]
│   │   ├── project.py                             [phase 2]
│   │   ├── retrieval.py                           [phase 3]
│   │   └── retention.py                           [phase 3]
│   ├── records/
│   │   ├── repository.py                          [phase 2]
│   │   ├── decision_ledger.py                     [phase 2 extraction]
│   │   └── outbox.py                              [phase 3]
│   ├── security/
│   │   ├── secrets.py                             [phase 3 gate]
│   │   ├── redaction.py                           [phase 2]
│   │   ├── tenant_scope.py                        [phase 3]
│   │   └── prompt_injection.py                    [phase 3]
│   └── telemetry/
│       ├── events.py                              [phase 2]
│       ├── metrics.py                             [phase 3]
│       └── traces.py                              [phase 3]
├── tests/
│   ├── test_policy.py                             [implemented]
│   ├── test_ledger.py                             [implemented]
│   ├── test_workflow.py                           [implemented]
│   ├── fixtures/                                  [phase 2]
│   ├── integration/                               [phase 3]
│   ├── security/                                  [phase 3]
│   └── acceptance/                                [phase 4]
├── migrations/                                    [phase 2]
├── scripts/
│   ├── validate.py                                [phase 2]
│   ├── replay_run.py                              [phase 3]
│   └── export_receipts.py                         [phase 3]
└── .github/workflows/
    ├── ci.yml                                     [on extraction]
    ├── security.yml                               [phase 3]
    └── release-readiness.yml                      [phase 4]
```

## Component ownership

| Component | Responsibility | Owner type |
|---|---|---|
| Chief of staff | Plan and route bounded work | Automated, advisory |
| Specialist agents | Produce evidence, drafts, scores, and proposed actions | Automated, advisory |
| Policy engine | Deterministically route action intents | Automated, non-LLM |
| Capability broker | Enforce route and grant immediately before execution | Automated, non-LLM |
| Approval service | Issue, revoke, expire, and consume authority leases | Human-controlled |
| Connector workers | Execute one idempotent approved provider action | Automated within grant |
| Decision ledger | Preserve evidence, decisions, receipts, and supersession | Automated, append-only |
| Human owner | Approve scope, external impact, terms, money, exceptions, and release | Human |

