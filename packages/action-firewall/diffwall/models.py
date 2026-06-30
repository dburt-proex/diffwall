"""Core data models for Diffwall.

CASA mapping: a Verdict is the governance gate a proposed action is routed to.
The Report is the audit-ready artifact a reviewer (or CI) consumes.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from typing import Iterable


class Verdict(str, Enum):
    ALLOW = "ALLOW"
    REVIEW = "REVIEW"
    HALT = "HALT"


# Higher rank = more restrictive. Used to merge multiple rule verdicts.
_RANK = {Verdict.ALLOW: 0, Verdict.REVIEW: 1, Verdict.HALT: 2}


def most_restrictive(verdicts: Iterable[Verdict]) -> Verdict:
    """Return the most restrictive verdict.

    Fail-safe: with no verdicts, default to REVIEW (never auto-ALLOW).
    """
    vs = list(verdicts)
    if not vs:
        return Verdict.REVIEW
    return max(vs, key=lambda v: _RANK[v])


@dataclass
class Action:
    """A proposed agent action to be validated."""
    id: str
    type: str
    target: str = ""
    payload: str = ""
    params: dict = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict) -> "Action":
        return cls(
            id=str(d.get("id", "")),
            type=str(d.get("type", "")).strip().lower(),
            target=str(d.get("target", "")),
            payload=str(d.get("payload", "")),
            params=d.get("params", {}) or {},
        )

    def _concat(self) -> str:
        return " ".join([
            self.type, self.target, self.payload, json.dumps(self.params),
        ])

    def searchable_text(self) -> str:
        """Lowercased text for case-insensitive keyword/intent matching."""
        return self._concat().lower()

    def raw_text(self) -> str:
        """Case-preserving text for case-sensitive secret detection."""
        return self._concat()


@dataclass
class RuleResult:
    rule: str
    verdict: Verdict
    matched: bool
    reason: str = ""
    suggested_fix: str = ""


@dataclass
class Report:
    action_id: str
    action_type: str
    verdict: Verdict
    triggered_by: list = field(default_factory=list)   # list[str] rule ids
    results: list = field(default_factory=list)        # list[RuleResult]

    def to_dict(self) -> dict:
        return {
            "action_id": self.action_id,
            "action_type": self.action_type,
            "verdict": self.verdict.value,
            "triggered_by": list(self.triggered_by),
            "results": [
                {
                    "rule": r.rule,
                    "verdict": r.verdict.value,
                    "matched": r.matched,
                    "reason": r.reason,
                    "suggested_fix": r.suggested_fix,
                }
                for r in self.results
            ],
        }
