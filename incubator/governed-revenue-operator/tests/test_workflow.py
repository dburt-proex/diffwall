from datetime import datetime, timedelta, timezone
import unittest

from governed_revenue_operator import (
    ActionIntent,
    ActionType,
    ApprovalGrant,
    InvalidTransition,
    PaymentEvidence,
    PaymentSource,
    PaymentStatus,
    RevenueRun,
    Route,
    RunState,
)


NOW = datetime(2026, 7, 30, 12, 0, tzinfo=timezone.utc)
PROJECT = "diffwall"
TARGET = "agency-1"


def action(
    identifier: str,
    action_type: ActionType,
    *,
    target: str = TARGET,
    external: bool = False,
    amount_cents: int | None = None,
    artifact_hash: str | None = None,
) -> ActionIntent:
    return ActionIntent(
        id=identifier,
        project_id=PROJECT,
        action_type=action_type,
        target=target,
        rationale="test",
        external_impact=external,
        amount_cents=amount_cents,
        currency="USD" if amount_cents is not None else None,
        artifact_hash=artifact_hash,
        created_at=NOW,
    )


def approval(
    identifier: str,
    action_type: ActionType,
    *,
    target: str = TARGET,
    amount_cents: int | None = None,
    artifact_hash: str | None = None,
) -> ApprovalGrant:
    return ApprovalGrant(
        id=identifier,
        project_id=PROJECT,
        action_types=frozenset({action_type}),
        issued_by="owner",
        issued_at=NOW - timedelta(minutes=1),
        expires_at=NOW + timedelta(hours=1),
        allowed_targets=frozenset({target}),
        max_amount_cents=amount_cents,
        artifact_hashes=(
            frozenset({artifact_hash}) if artifact_hash else frozenset()
        ),
    )


class RevenueWorkflowTests(unittest.TestCase):
    def test_review_does_not_advance_state(self) -> None:
        run = RevenueRun(PROJECT)
        run.perform(
            action("a-1", ActionType.RESEARCH_PUBLIC),
            RunState.RESEARCHING,
            at=NOW,
        )
        run.perform(
            action("a-2", ActionType.DRAFT_TARGETING_PLAN),
            RunState.TARGETING_PLAN_READY,
            at=NOW,
        )
        decision = run.perform(
            action("a-3", ActionType.IDENTIFY_TARGET),
            RunState.TARGETS_READY,
            at=NOW,
        )
        self.assertEqual(Route.REVIEW, decision.route)
        self.assertEqual(RunState.TARGETING_PLAN_READY, run.state)
        self.assertEqual("a-3", run.pending_action_id)

    def test_invalid_transition_fails_closed(self) -> None:
        run = RevenueRun(PROJECT)
        with self.assertRaises(InvalidTransition):
            run.perform(
                action("a-1", ActionType.SEND_OUTREACH, external=True),
                RunState.OUTREACH_ACTIVE,
                at=NOW,
            )
        self.assertEqual(RunState.INTAKE, run.state)

    def test_wrong_action_cannot_advance_a_valid_destination(self) -> None:
        run = RevenueRun(PROJECT)
        with self.assertRaises(InvalidTransition):
            run.perform(
                action("a-1", ActionType.DRAFT_OUTREACH),
                RunState.RESEARCHING,
                at=NOW,
            )
        self.assertEqual(RunState.INTAKE, run.state)

    def test_prohibited_action_halts_the_run(self) -> None:
        run = RevenueRun(PROJECT)
        decision = run.perform(
            action("a-1", ActionType.TRANSFER_FUNDS, amount_cents=100),
            RunState.RESEARCHING,
            at=NOW,
        )
        self.assertEqual(Route.HALT, decision.route)
        self.assertEqual(RunState.HALTED, run.state)

    def test_end_to_end_path_requires_grants_and_settled_evidence(self) -> None:
        run = RevenueRun(PROJECT)
        message_hash = "message-v1"
        proposal_hash = "proposal-v1"

        steps = [
            (
                action("a-1", ActionType.RESEARCH_PUBLIC),
                RunState.RESEARCHING,
                (),
            ),
            (
                action("a-2", ActionType.DRAFT_TARGETING_PLAN),
                RunState.TARGETING_PLAN_READY,
                (),
            ),
            (
                action("a-3", ActionType.IDENTIFY_TARGET),
                RunState.TARGETS_READY,
                (approval("g-1", ActionType.IDENTIFY_TARGET),),
            ),
            (
                action("a-4", ActionType.DRAFT_OUTREACH),
                RunState.OUTREACH_DRAFTED,
                (),
            ),
            (
                action(
                    "a-5",
                    ActionType.SEND_OUTREACH,
                    external=True,
                    artifact_hash=message_hash,
                ),
                RunState.OUTREACH_ACTIVE,
                (
                    approval(
                        "g-2",
                        ActionType.SEND_OUTREACH,
                        artifact_hash=message_hash,
                    ),
                ),
            ),
            (
                action("a-6", ActionType.RECORD_RESPONSE),
                RunState.RESPONSE_RECEIVED,
                (),
            ),
            (
                action("a-7", ActionType.QUALIFY_OPPORTUNITY),
                RunState.QUALIFIED,
                (),
            ),
            (
                action("a-8", ActionType.DRAFT_PROPOSAL),
                RunState.PROPOSAL_DRAFTED,
                (),
            ),
            (
                action(
                    "a-9",
                    ActionType.SEND_PROPOSAL,
                    external=True,
                    amount_cents=50000,
                    artifact_hash=proposal_hash,
                ),
                RunState.PROPOSAL_SENT,
                (
                    approval(
                        "g-3",
                        ActionType.SEND_PROPOSAL,
                        amount_cents=50000,
                        artifact_hash=proposal_hash,
                    ),
                ),
            ),
            (
                action(
                    "a-10",
                    ActionType.ISSUE_INVOICE,
                    external=True,
                    amount_cents=50000,
                ),
                RunState.PAYMENT_PENDING,
                (
                    approval(
                        "g-4",
                        ActionType.ISSUE_INVOICE,
                        amount_cents=50000,
                    ),
                ),
            ),
        ]

        for intent, destination, grants in steps:
            decision = run.perform(intent, destination, grants, at=NOW)
            self.assertEqual(Route.ALLOW, decision.route)

        payment_intent = action(
            "a-11",
            ActionType.RECORD_REVENUE,
            target="payment-1",
            amount_cents=50000,
        )
        pending = PaymentEvidence(
            source=PaymentSource.PAYMENT_PROVIDER,
            transaction_id="payment-1",
            amount_cents=50000,
            currency="USD",
            status=PaymentStatus.PENDING,
            observed_at=NOW,
        )
        with self.assertRaisesRegex(ValueError, "settled"):
            run.record_payment(payment_intent, pending, at=NOW)
        self.assertEqual(RunState.PAYMENT_PENDING, run.state)

        settled = PaymentEvidence(
            source=PaymentSource.PAYMENT_PROVIDER,
            transaction_id="payment-1",
            amount_cents=50000,
            currency="USD",
            status=PaymentStatus.SETTLED,
            observed_at=NOW,
        )
        decision = run.record_payment(payment_intent, settled, at=NOW)
        self.assertEqual(Route.ALLOW, decision.route)
        self.assertEqual(RunState.FIRST_REVENUE_VERIFIED, run.state)
        self.assertTrue(run.ledger.verify())

    def test_generic_perform_cannot_bypass_revenue_evidence_gate(self) -> None:
        run = RevenueRun(PROJECT)
        run.state = RunState.PAYMENT_PENDING
        with self.assertRaisesRegex(InvalidTransition, "record_payment"):
            run.perform(
                action(
                    "a-1",
                    ActionType.RECORD_REVENUE,
                    target="payment-1",
                    amount_cents=100,
                ),
                RunState.FIRST_REVENUE_VERIFIED,
                at=NOW,
            )
        self.assertEqual(RunState.PAYMENT_PENDING, run.state)

    def test_self_reported_payment_is_rejected(self) -> None:
        run = RevenueRun(PROJECT)
        run.state = RunState.PAYMENT_PENDING
        payment_intent = action(
            "a-1",
            ActionType.RECORD_REVENUE,
            target="payment-1",
            amount_cents=100,
        )
        evidence = PaymentEvidence(
            source=PaymentSource.SELF_REPORTED,
            transaction_id="claim-1",
            amount_cents=100,
            currency="USD",
            status=PaymentStatus.SETTLED,
            observed_at=NOW,
        )
        with self.assertRaisesRegex(ValueError, "self-reported"):
            run.record_payment(payment_intent, evidence, at=NOW)
        self.assertEqual(RunState.PAYMENT_PENDING, run.state)


if __name__ == "__main__":
    unittest.main()
