"""Diffwall — a CASA-enforcing agent-action validator.

Routes proposed AI/agent actions through governance gates:
    ALLOW  — safe, read-only / low-impact
    REVIEW — impactful, needs a human (fail-safe default for unknowns)
    HALT   — unsafe / irreversible / exfiltrating; blocked

Stdlib-only. No external dependencies. Deterministic and explainable.
"""
from .models import Verdict, Action, RuleResult, Report, most_restrictive
from .engine import validate, validate_many
from .rules import RULES

__all__ = [
    "Verdict", "Action", "RuleResult", "Report",
    "most_restrictive", "validate", "validate_many", "RULES",
]
