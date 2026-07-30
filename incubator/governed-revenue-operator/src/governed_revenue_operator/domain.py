from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from types import MappingProxyType
from typing import Any, Mapping


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Route(StrEnum):
    ALLOW = "ALLOW"
    REVIEW = "REVIEW"
    HALT = "HALT"


class ActionType(StrEnum):
    RESEARCH_PUBLIC = "RESEARCH_PUBLIC"
    DRAFT_TARGETING_PLAN = "DRAFT_TARGETING_PLAN"
    IDENTIFY_TARGET = "IDENTIFY_TARGET"
    DRAFT_OUTREACH = "DRAFT_OUTREACH"
    SEND_OUTREACH = "SEND_OUTREACH"
    SCHEDULE_FOLLOWUP = "SCHEDULE_FOLLOWUP"
    RECORD_RESPONSE = "RECORD_RESPONSE"
    QUALIFY_OPPORTUNITY = "QUALIFY_OPPORTUNITY"
    DRAFT_PROPOSAL = "DRAFT_PROPOSAL"
    SEND_PROPOSAL = "SEND_PROPOSAL"
    ISSUE_INVOICE = "ISSUE_INVOICE"
    RECORD_REVENUE = "RECORD_REVENUE"
    ACCEPT_CONTRACT = "ACCEPT_CONTRACT"
    TRANSFER_FUNDS = "TRANSFER_FUNDS"
    DELETE_RECORD = "DELETE_RECORD"
    PUBLIC_BROADCAST = "PUBLIC_BROADCAST"


class DataClass(StrEnum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"


class RunState(StrEnum):
    INTAKE = "INTAKE"
    RESEARCHING = "RESEARCHING"
    TARGETING_PLAN_READY = "TARGETING_PLAN_READY"
    TARGETS_READY = "TARGETS_READY"
    OUTREACH_DRAFTED = "OUTREACH_DRAFTED"
    OUTREACH_ACTIVE = "OUTREACH_ACTIVE"
    RESPONSE_RECEIVED = "RESPONSE_RECEIVED"
    QUALIFIED = "QUALIFIED"
    PROPOSAL_DRAFTED = "PROPOSAL_DRAFTED"
    PROPOSAL_SENT = "PROPOSAL_SENT"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    FIRST_REVENUE_VERIFIED = "FIRST_REVENUE_VERIFIED"
    PAUSED = "PAUSED"
    HALTED = "HALTED"
    CLOSED = "CLOSED"


class PaymentSource(StrEnum):
    PAYMENT_PROVIDER = "PAYMENT_PROVIDER"
    BANK_SETTLEMENT = "BANK_SETTLEMENT"
    SELF_REPORTED = "SELF_REPORTED"


class PaymentStatus(StrEnum):
    PENDING = "PENDING"
    SETTLED = "SETTLED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


@dataclass(frozen=True, slots=True)
class ActionIntent:
    id: str
    project_id: str
    action_type: ActionType
    target: str
    rationale: str
    external_impact: bool = False
    reversible: bool = True
    data_class: DataClass = DataClass.INTERNAL
    amount_cents: int | None = None
    currency: str | None = None
    artifact_hash: str | None = None
    metadata: Mapping[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        if not self.id.strip():
            raise ValueError("action intent id is required")
        if not self.project_id.strip():
            raise ValueError("project_id is required")
        if not self.target.strip():
            raise ValueError("target is required")
        if self.amount_cents is not None and self.amount_cents < 0:
            raise ValueError("amount_cents cannot be negative")
        if self.amount_cents is not None and not self.currency:
            raise ValueError("currency is required when amount_cents is set")
        object.__setattr__(self, "metadata", MappingProxyType(dict(self.metadata)))


@dataclass(frozen=True, slots=True)
class ApprovalGrant:
    id: str
    project_id: str
    action_types: frozenset[ActionType]
    issued_by: str
    issued_at: datetime
    expires_at: datetime
    allowed_targets: frozenset[str] = field(default_factory=frozenset)
    max_amount_cents: int | None = None
    artifact_hashes: frozenset[str] = field(default_factory=frozenset)
    revoked_at: datetime | None = None

    def __post_init__(self) -> None:
        if not self.id.strip() or not self.issued_by.strip():
            raise ValueError("grant id and issuer are required")
        if not self.action_types:
            raise ValueError("grant requires at least one action type")
        if self.expires_at <= self.issued_at:
            raise ValueError("grant expiry must be after issue time")
        if self.max_amount_cents is not None and self.max_amount_cents < 0:
            raise ValueError("max_amount_cents cannot be negative")

    def authorizes(self, intent: ActionIntent, at: datetime) -> bool:
        if self.revoked_at is not None and self.revoked_at <= at:
            return False
        if at < self.issued_at or at >= self.expires_at:
            return False
        if self.project_id != intent.project_id:
            return False
        if intent.action_type not in self.action_types:
            return False
        if self.allowed_targets and intent.target not in self.allowed_targets:
            return False
        if (
            self.max_amount_cents is not None
            and intent.amount_cents is not None
            and intent.amount_cents > self.max_amount_cents
        ):
            return False
        if self.artifact_hashes:
            if intent.artifact_hash is None:
                return False
            if intent.artifact_hash not in self.artifact_hashes:
                return False
        return True


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    route: Route
    reason_codes: tuple[str, ...]
    policy_version: str
    evaluated_at: datetime
    matched_approval_id: str | None = None


@dataclass(frozen=True, slots=True)
class PaymentEvidence:
    source: PaymentSource
    transaction_id: str
    amount_cents: int
    currency: str
    status: PaymentStatus
    observed_at: datetime = field(default_factory=utc_now)

    def __post_init__(self) -> None:
        if not self.transaction_id.strip():
            raise ValueError("transaction_id is required")
        if self.amount_cents <= 0:
            raise ValueError("payment amount must be positive")
        if not self.currency.strip():
            raise ValueError("currency is required")

