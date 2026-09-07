from datetime import datetime, timedelta, timezone
import unittest

from governed_revenue_operator import (
    ActionIntent,
    ActionType,
    ApprovalGrant,
    DataClass,
    PolicyEngine,
    Route,
)


NOW = datetime(2026, 7, 30, 12, 0, tzinfo=timezone.utc)


def action(
    action_type: ActionType,
    *,
    project_id: str = "diffwall",
    target: str = "agency-1",
    external: bool = False,
    data_class: DataClass = DataClass.INTERNAL,
    amount_cents: int | None = None,
    artifact_hash: str | None = None,
) -> ActionIntent:
    return ActionIntent(
        id=f"action-{action_type.value.lower()}",
        project_id=project_id,
        action_type=action_type,
        target=target,
        rationale="test",
        external_impact=external,
        data_class=data_class,
        amount_cents=amount_cents,
        currency="USD" if amount_cents is not None else None,
        artifact_hash=artifact_hash,
        created_at=NOW,
    )


def grant(
    action_type: ActionType,
    *,
    project_id: str = "diffwall",
    target: str = "agency-1",
    issued_at: datetime = NOW - timedelta(minutes=5),
    expires_at: datetime = NOW + timedelta(hours=1),
    max_amount_cents: int | None = None,
    artifact_hash: str | None = None,
) -> ApprovalGrant:
    return ApprovalGrant(
        id=f"grant-{action_type.value.lower()}",
        project_id=project_id,
        action_types=frozenset({action_type}),
        issued_by="owner",
        issued_at=issued_at,
        expires_at=expires_at,
        allowed_targets=frozenset({target}),
        max_amount_cents=max_amount_cents,
        artifact_hashes=(
            frozenset({artifact_hash}) if artifact_hash else frozenset()
        ),
    )


class PolicyEngineTests(unittest.TestCase):
    def setUp(self) -> None:
        self.policy = PolicyEngine()

    def test_safe_internal_research_is_allowed(self) -> None:
        decision = self.policy.evaluate(
            action(ActionType.RESEARCH_PUBLIC),
            at=NOW,
        )
        self.assertEqual(Route.ALLOW, decision.route)
        self.assertIn("INTERNAL_BOUNDED_ACTION", decision.reason_codes)

    def test_outreach_requires_active_approval(self) -> None:
        intent = action(ActionType.SEND_OUTREACH, external=True)
        decision = self.policy.evaluate(intent, at=NOW)
        self.assertEqual(Route.REVIEW, decision.route)
        self.assertIsNone(decision.matched_approval_id)

    def test_matching_approval_allows_bounded_outreach(self) -> None:
        intent = action(
            ActionType.SEND_OUTREACH,
            external=True,
            artifact_hash="message-v1",
        )
        approval = grant(
            ActionType.SEND_OUTREACH,
            artifact_hash="message-v1",
        )
        decision = self.policy.evaluate(intent, (approval,), at=NOW)
        self.assertEqual(Route.ALLOW, decision.route)
        self.assertEqual(approval.id, decision.matched_approval_id)

    def test_outreach_grant_must_bind_an_artifact_hash(self) -> None:
        missing_hash = action(ActionType.SEND_OUTREACH, external=True)
        unbound_grant = grant(ActionType.SEND_OUTREACH)
        decision = self.policy.evaluate(
            missing_hash,
            (unbound_grant,),
            at=NOW,
        )
        self.assertEqual(Route.REVIEW, decision.route)
        self.assertIn(
            "APPROVED_ARTIFACT_HASH_REQUIRED",
            decision.reason_codes,
        )

    def test_expired_cross_project_and_wrong_target_grants_do_not_authorize(
        self,
    ) -> None:
        intent = action(ActionType.SEND_OUTREACH, external=True)
        expired = grant(
            ActionType.SEND_OUTREACH,
            expires_at=NOW - timedelta(seconds=1),
        )
        cross_project = grant(
            ActionType.SEND_OUTREACH,
            project_id="other-project",
        )
        wrong_target = grant(
            ActionType.SEND_OUTREACH,
            target="agency-2",
        )
        decision = self.policy.evaluate(
            intent,
            (expired, cross_project, wrong_target),
            at=NOW,
        )
        self.assertEqual(Route.REVIEW, decision.route)

    def test_amount_and_artifact_bounds_are_enforced(self) -> None:
        intent = action(
            ActionType.SEND_PROPOSAL,
            external=True,
            amount_cents=75000,
            artifact_hash="proposal-v2",
        )
        approval = grant(
            ActionType.SEND_PROPOSAL,
            max_amount_cents=50000,
            artifact_hash="proposal-v1",
        )
        decision = self.policy.evaluate(intent, (approval,), at=NOW)
        self.assertEqual(Route.REVIEW, decision.route)

    def test_prohibited_action_halts_even_with_grant(self) -> None:
        intent = action(
            ActionType.TRANSFER_FUNDS,
            external=True,
            amount_cents=100,
        )
        approval = grant(
            ActionType.TRANSFER_FUNDS,
            max_amount_cents=100,
        )
        decision = self.policy.evaluate(intent, (approval,), at=NOW)
        self.assertEqual(Route.HALT, decision.route)
        self.assertIn("PROHIBITED_ACTION", decision.reason_codes)

    def test_restricted_data_halts(self) -> None:
        decision = self.policy.evaluate(
            action(
                ActionType.DRAFT_OUTREACH,
                data_class=DataClass.RESTRICTED,
            ),
            at=NOW,
        )
        self.assertEqual(Route.HALT, decision.route)


if __name__ == "__main__":
    unittest.main()
