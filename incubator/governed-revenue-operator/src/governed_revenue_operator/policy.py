from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime

from .domain import (
    ActionIntent,
    ActionType,
    ApprovalGrant,
    DataClass,
    PolicyDecision,
    Route,
    utc_now,
)


class PolicyEngine:
    """Deterministic execution gate. Content-generating models do not call ALLOW."""

    APPROVAL_REQUIRED = frozenset(
        {
            ActionType.IDENTIFY_TARGET,
            ActionType.SEND_OUTREACH,
            ActionType.SCHEDULE_FOLLOWUP,
            ActionType.SEND_PROPOSAL,
            ActionType.ISSUE_INVOICE,
        }
    )

    UNCONDITIONAL_HALT = frozenset(
        {
            ActionType.ACCEPT_CONTRACT,
            ActionType.TRANSFER_FUNDS,
            ActionType.DELETE_RECORD,
            ActionType.PUBLIC_BROADCAST,
        }
    )

    ARTIFACT_BOUND_ACTIONS = frozenset(
        {
            ActionType.SEND_OUTREACH,
            ActionType.SEND_PROPOSAL,
        }
    )

    def __init__(self, policy_version: str = "gro-default-v0.1") -> None:
        self.policy_version = policy_version

    def evaluate(
        self,
        intent: ActionIntent,
        grants: Iterable[ApprovalGrant] = (),
        *,
        at: datetime | None = None,
    ) -> PolicyDecision:
        evaluated_at = at or utc_now()

        if intent.action_type in self.UNCONDITIONAL_HALT:
            return self._decision(
                Route.HALT,
                ("PROHIBITED_ACTION", intent.action_type.value),
                evaluated_at,
            )

        if intent.data_class is DataClass.RESTRICTED:
            return self._decision(
                Route.HALT,
                ("RESTRICTED_DATA",),
                evaluated_at,
            )

        if (
            intent.external_impact
            and intent.data_class is DataClass.CONFIDENTIAL
        ):
            return self._decision(
                Route.HALT,
                ("CONFIDENTIAL_EXTERNAL_TRANSMISSION",),
                evaluated_at,
            )

        if (
            intent.action_type in self.ARTIFACT_BOUND_ACTIONS
            and not intent.artifact_hash
        ):
            return self._decision(
                Route.REVIEW,
                ("APPROVED_ARTIFACT_HASH_REQUIRED",),
                evaluated_at,
            )

        matching_grant = next(
            (
                grant
                for grant in grants
                if grant.authorizes(intent, evaluated_at)
                and (
                    intent.action_type not in self.ARTIFACT_BOUND_ACTIONS
                    or bool(grant.artifact_hashes)
                )
            ),
            None,
        )

        if intent.action_type in self.APPROVAL_REQUIRED:
            if matching_grant is None:
                return self._decision(
                    Route.REVIEW,
                    ("ACTIVE_APPROVAL_REQUIRED", intent.action_type.value),
                    evaluated_at,
                )
            return self._decision(
                Route.ALLOW,
                ("ACTIVE_APPROVAL_MATCHED",),
                evaluated_at,
                matched_approval_id=matching_grant.id,
            )

        if intent.external_impact:
            if matching_grant is None:
                return self._decision(
                    Route.REVIEW,
                    ("EXTERNAL_IMPACT_REQUIRES_APPROVAL",),
                    evaluated_at,
                )
            return self._decision(
                Route.ALLOW,
                ("ACTIVE_APPROVAL_MATCHED",),
                evaluated_at,
                matched_approval_id=matching_grant.id,
            )

        return self._decision(
            Route.ALLOW,
            ("INTERNAL_BOUNDED_ACTION",),
            evaluated_at,
        )

    def _decision(
        self,
        route: Route,
        reasons: tuple[str, ...],
        evaluated_at: datetime,
        *,
        matched_approval_id: str | None = None,
    ) -> PolicyDecision:
        return PolicyDecision(
            route=route,
            reason_codes=reasons,
            policy_version=self.policy_version,
            evaluated_at=evaluated_at,
            matched_approval_id=matched_approval_id,
        )
