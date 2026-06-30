"""Routing engine: run rules, merge verdicts, produce an audit Report.

Determinism + explainability is the point: every action gets a full rule
trace, and the final verdict is the most restrictive matched verdict.
Unknown actions fail safe to REVIEW (never auto-ALLOW).
"""
from __future__ import annotations

from typing import List

from .models import Action, Report, Verdict, most_restrictive
from .rules import RULES


def validate(action: Action) -> Report:
    results = [rule(action) for rule in RULES]
    matched = [r for r in results if r.matched]

    if matched:
        final = most_restrictive([r.verdict for r in matched])
        triggered_by = [r.rule for r in matched if r.verdict == final]
    else:
        final = Verdict.REVIEW          # fail-safe default
        triggered_by = ["DEFAULT_FAIL_SAFE"]

    return Report(
        action_id=action.id,
        action_type=action.type,
        verdict=final,
        triggered_by=triggered_by,
        results=results,
    )


def validate_many(actions: List[Action]) -> List[Report]:
    return [validate(a) for a in actions]
