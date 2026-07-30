from __future__ import annotations

from datetime import datetime, timedelta, timezone
import json

from .domain import (
    ActionIntent,
    ActionType,
    ApprovalGrant,
    DataClass,
    PaymentEvidence,
    PaymentSource,
    PaymentStatus,
    RunState,
)
from .workflow import RevenueRun


PROJECT = "synthetic-diffwall-pilot"
TARGET = "synthetic-agency-001"
ARTIFACT = "sha256:synthetic-message-v1"


def intent(
    identifier: str,
    action_type: ActionType,
    target: str,
    *,
    external: bool = False,
    amount_cents: int | None = None,
    artifact_hash: str | None = None,
) -> ActionIntent:
    return ActionIntent(
        id=identifier,
        project_id=PROJECT,
        action_type=action_type,
        target=target,
        rationale="Synthetic governed workflow demonstration",
        external_impact=external,
        data_class=DataClass.PUBLIC if external else DataClass.INTERNAL,
        amount_cents=amount_cents,
        currency="USD" if amount_cents is not None else None,
        artifact_hash=artifact_hash,
    )


def grant(
    identifier: str,
    action_type: ActionType,
    target: str,
    *,
    artifact_hash: str | None = None,
    max_amount_cents: int | None = None,
) -> ApprovalGrant:
    now = datetime.now(timezone.utc)
    hashes = frozenset({artifact_hash}) if artifact_hash else frozenset()
    return ApprovalGrant(
        id=identifier,
        project_id=PROJECT,
        action_types=frozenset({action_type}),
        issued_by="synthetic-owner",
        issued_at=now - timedelta(minutes=1),
        expires_at=now + timedelta(hours=1),
        allowed_targets=frozenset({target}),
        artifact_hashes=hashes,
        max_amount_cents=max_amount_cents,
    )


def main() -> None:
    run = RevenueRun(PROJECT)
    steps = [
        (
            intent("a-01", ActionType.RESEARCH_PUBLIC, "approved-public-sources"),
            RunState.RESEARCHING,
            (),
        ),
        (
            intent(
                "a-02",
                ActionType.DRAFT_TARGETING_PLAN,
                "synthetic-targeting-plan",
            ),
            RunState.TARGETING_PLAN_READY,
            (),
        ),
        (
            intent("a-03", ActionType.IDENTIFY_TARGET, TARGET),
            RunState.TARGETS_READY,
            (grant("g-target", ActionType.IDENTIFY_TARGET, TARGET),),
        ),
        (
            intent("a-04", ActionType.DRAFT_OUTREACH, ARTIFACT),
            RunState.OUTREACH_DRAFTED,
            (),
        ),
        (
            intent(
                "a-05",
                ActionType.SEND_OUTREACH,
                TARGET,
                external=True,
                artifact_hash=ARTIFACT,
            ),
            RunState.OUTREACH_ACTIVE,
            (
                grant(
                    "g-outreach",
                    ActionType.SEND_OUTREACH,
                    TARGET,
                    artifact_hash=ARTIFACT,
                ),
            ),
        ),
        (
            intent("a-06", ActionType.RECORD_RESPONSE, TARGET),
            RunState.RESPONSE_RECEIVED,
            (),
        ),
        (
            intent("a-07", ActionType.QUALIFY_OPPORTUNITY, TARGET),
            RunState.QUALIFIED,
            (),
        ),
        (
            intent("a-08", ActionType.DRAFT_PROPOSAL, "proposal-v1"),
            RunState.PROPOSAL_DRAFTED,
            (),
        ),
        (
            intent(
                "a-09",
                ActionType.SEND_PROPOSAL,
                TARGET,
                external=True,
                amount_cents=50000,
                artifact_hash="sha256:synthetic-proposal-v1",
            ),
            RunState.PROPOSAL_SENT,
            (
                grant(
                    "g-proposal",
                    ActionType.SEND_PROPOSAL,
                    TARGET,
                    artifact_hash="sha256:synthetic-proposal-v1",
                    max_amount_cents=50000,
                ),
            ),
        ),
        (
            intent(
                "a-10",
                ActionType.ISSUE_INVOICE,
                TARGET,
                external=True,
                amount_cents=50000,
            ),
            RunState.PAYMENT_PENDING,
            (
                grant(
                    "g-invoice",
                    ActionType.ISSUE_INVOICE,
                    TARGET,
                    max_amount_cents=50000,
                ),
            ),
        ),
    ]

    routes = []
    for action, destination, grants in steps:
        decision = run.perform(action, destination, grants)
        routes.append(
            {
                "action_id": action.id,
                "route": decision.route.value,
                "approval_id": decision.matched_approval_id,
                "state": run.state.value,
            }
        )

    payment_intent = intent(
        "a-11",
        ActionType.RECORD_REVENUE,
        "payment:synthetic-001",
        amount_cents=50000,
    )
    payment = PaymentEvidence(
        source=PaymentSource.PAYMENT_PROVIDER,
        transaction_id="synthetic-001",
        amount_cents=50000,
        currency="USD",
        status=PaymentStatus.SETTLED,
    )
    decision = run.record_payment(payment_intent, payment)
    routes.append(
        {
            "action_id": payment_intent.id,
            "route": decision.route.value,
            "approval_id": decision.matched_approval_id,
            "state": run.state.value,
        }
    )

    print(
        json.dumps(
            {
                "synthetic": True,
                "project_id": PROJECT,
                "final_state": run.state.value,
                "ledger_valid": run.ledger.verify(),
                "ledger_entries": len(run.ledger.entries),
                "routes": routes,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

