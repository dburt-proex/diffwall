from __future__ import annotations

from datetime import datetime
from typing import Iterable

from .domain import (
    ActionIntent,
    ActionType,
    ApprovalGrant,
    PaymentEvidence,
    PaymentSource,
    PaymentStatus,
    PolicyDecision,
    Route,
    RunState,
)
from .ledger import AppendOnlyLedger
from .policy import PolicyEngine


class InvalidTransition(RuntimeError):
    pass


class RevenueRun:
    """A small, deterministic orchestration proof with no provider side effects."""

    _TRANSITIONS: dict[
        RunState,
        dict[RunState, frozenset[ActionType]],
    ] = {
        RunState.INTAKE: {
            RunState.RESEARCHING: frozenset({ActionType.RESEARCH_PUBLIC})
        },
        RunState.RESEARCHING: {
            RunState.TARGETING_PLAN_READY: frozenset(
                {ActionType.DRAFT_TARGETING_PLAN}
            )
        },
        RunState.TARGETING_PLAN_READY: {
            RunState.TARGETS_READY: frozenset({ActionType.IDENTIFY_TARGET})
        },
        RunState.TARGETS_READY: {
            RunState.OUTREACH_DRAFTED: frozenset(
                {ActionType.DRAFT_OUTREACH}
            )
        },
        RunState.OUTREACH_DRAFTED: {
            RunState.OUTREACH_ACTIVE: frozenset(
                {ActionType.SEND_OUTREACH}
            )
        },
        RunState.OUTREACH_ACTIVE: {
            RunState.RESPONSE_RECEIVED: frozenset(
                {ActionType.RECORD_RESPONSE}
            )
        },
        RunState.RESPONSE_RECEIVED: {
            RunState.QUALIFIED: frozenset(
                {ActionType.QUALIFY_OPPORTUNITY}
            )
        },
        RunState.QUALIFIED: {
            RunState.PROPOSAL_DRAFTED: frozenset(
                {ActionType.DRAFT_PROPOSAL}
            )
        },
        RunState.PROPOSAL_DRAFTED: {
            RunState.PROPOSAL_SENT: frozenset(
                {ActionType.SEND_PROPOSAL}
            )
        },
        RunState.PROPOSAL_SENT: {
            RunState.PAYMENT_PENDING: frozenset(
                {ActionType.ISSUE_INVOICE}
            )
        },
        RunState.PAYMENT_PENDING: {
            RunState.FIRST_REVENUE_VERIFIED: frozenset(
                {ActionType.RECORD_REVENUE}
            )
        },
        RunState.FIRST_REVENUE_VERIFIED: {},
        RunState.PAUSED: {},
        RunState.HALTED: {},
        RunState.CLOSED: {},
    }

    def __init__(
        self,
        project_id: str,
        *,
        policy: PolicyEngine | None = None,
        ledger: AppendOnlyLedger | None = None,
    ) -> None:
        if not project_id.strip():
            raise ValueError("project_id is required")
        self.project_id = project_id
        self.state = RunState.INTAKE
        self.policy = policy or PolicyEngine()
        self.ledger = ledger or AppendOnlyLedger()
        self.pending_action_id: str | None = None
        self.ledger.append(
            "run_created",
            {"project_id": project_id, "state": self.state.value},
        )

    def perform(
        self,
        intent: ActionIntent,
        destination: RunState,
        grants: Iterable[ApprovalGrant] = (),
        *,
        at: datetime | None = None,
    ) -> PolicyDecision:
        return self._perform(
            intent,
            destination,
            grants,
            at=at,
            revenue_evidence_verified=False,
        )

    def _perform(
        self,
        intent: ActionIntent,
        destination: RunState,
        grants: Iterable[ApprovalGrant] = (),
        *,
        at: datetime | None = None,
        revenue_evidence_verified: bool,
    ) -> PolicyDecision:
        if intent.project_id != self.project_id:
            raise ValueError("intent project does not match run project")

        decision = self.policy.evaluate(intent, grants, at=at)
        if decision.route is Route.HALT:
            self._record_decision(intent, decision)
            self.pending_action_id = intent.id
            self._move_to_terminal(RunState.HALTED, intent.id)
            return decision

        if (
            destination is RunState.FIRST_REVENUE_VERIFIED
            and not revenue_evidence_verified
        ):
            raise InvalidTransition(
                "revenue state requires record_payment evidence validation"
            )
        self._assert_transition(intent.action_type, destination)
        self._record_decision(intent, decision)

        if decision.route is Route.REVIEW:
            self.pending_action_id = intent.id
            self.ledger.append(
                "approval_required",
                {
                    "project_id": self.project_id,
                    "action_id": intent.id,
                    "action_type": intent.action_type.value,
                    "state": self.state.value,
                    "reasons": list(decision.reason_codes),
                },
            )
            return decision

        self.pending_action_id = None
        previous = self.state
        self.state = destination
        self.ledger.append(
            "action_executed",
            {
                "project_id": self.project_id,
                "action_id": intent.id,
                "action_type": intent.action_type.value,
                "target": intent.target,
                "approval_id": decision.matched_approval_id,
            },
        )
        self.ledger.append(
            "state_transition",
            {
                "project_id": self.project_id,
                "from": previous.value,
                "to": self.state.value,
                "action_id": intent.id,
            },
        )
        return decision

    def record_payment(
        self,
        intent: ActionIntent,
        evidence: PaymentEvidence,
        *,
        at: datetime | None = None,
    ) -> PolicyDecision:
        if intent.action_type is not ActionType.RECORD_REVENUE:
            raise ValueError("record_payment requires a RECORD_REVENUE intent")
        if evidence.source not in {
            PaymentSource.PAYMENT_PROVIDER,
            PaymentSource.BANK_SETTLEMENT,
        }:
            self._reject_revenue(intent, "UNACCEPTED_PAYMENT_SOURCE")
            raise ValueError("self-reported payment is not revenue evidence")
        if evidence.status is not PaymentStatus.SETTLED:
            self._reject_revenue(intent, "PAYMENT_NOT_SETTLED")
            raise ValueError("payment must be settled before revenue is recorded")
        if intent.amount_cents != evidence.amount_cents:
            self._reject_revenue(intent, "PAYMENT_AMOUNT_MISMATCH")
            raise ValueError("intent amount does not match payment evidence")
        if intent.currency != evidence.currency:
            self._reject_revenue(intent, "PAYMENT_CURRENCY_MISMATCH")
            raise ValueError("intent currency does not match payment evidence")

        decision = self._perform(
            intent,
            RunState.FIRST_REVENUE_VERIFIED,
            at=at,
            revenue_evidence_verified=True,
        )
        if decision.route is Route.ALLOW:
            self.ledger.append(
                "revenue_verified",
                {
                    "project_id": self.project_id,
                    "transaction_id": evidence.transaction_id,
                    "source": evidence.source.value,
                    "amount_cents": evidence.amount_cents,
                    "currency": evidence.currency,
                    "status": evidence.status.value,
                    "observed_at": evidence.observed_at.isoformat(),
                },
            )
        return decision

    def close(self, action_id: str = "close-run") -> None:
        if self.state is not RunState.FIRST_REVENUE_VERIFIED:
            raise InvalidTransition(
                f"cannot transition from {self.state.value} to "
                f"{RunState.CLOSED.value}"
            )
        previous = self.state
        self.state = RunState.CLOSED
        self.ledger.append(
            "state_transition",
            {
                "project_id": self.project_id,
                "from": previous.value,
                "to": self.state.value,
                "action_id": action_id,
            },
        )

    def _record_decision(
        self,
        intent: ActionIntent,
        decision: PolicyDecision,
    ) -> None:
        self.ledger.append(
            "policy_decision",
            {
                "project_id": self.project_id,
                "action": {
                    "id": intent.id,
                    "type": intent.action_type.value,
                    "target": intent.target,
                    "external_impact": intent.external_impact,
                    "data_class": intent.data_class.value,
                    "amount_cents": intent.amount_cents,
                    "currency": intent.currency,
                    "artifact_hash": intent.artifact_hash,
                },
                "decision": {
                    "route": decision.route.value,
                    "reason_codes": list(decision.reason_codes),
                    "policy_version": decision.policy_version,
                    "evaluated_at": decision.evaluated_at.isoformat(),
                    "matched_approval_id": decision.matched_approval_id,
                },
            },
        )

    def _reject_revenue(self, intent: ActionIntent, reason: str) -> None:
        self.ledger.append(
            "revenue_evidence_rejected",
            {
                "project_id": self.project_id,
                "action_id": intent.id,
                "reason": reason,
            },
        )

    def _assert_transition(
        self,
        action_type: ActionType,
        destination: RunState,
    ) -> None:
        destinations = self._TRANSITIONS.get(self.state, {})
        allowed_actions = destinations.get(destination, frozenset())
        if action_type not in allowed_actions:
            raise InvalidTransition(
                f"{action_type.value} cannot transition from "
                f"{self.state.value} to {destination.value}"
            )

    def _move_to_terminal(
        self,
        destination: RunState,
        action_id: str,
    ) -> None:
        previous = self.state
        self.state = destination
        self.ledger.append(
            "state_transition",
            {
                "project_id": self.project_id,
                "from": previous.value,
                "to": destination.value,
                "action_id": action_id,
            },
        )
