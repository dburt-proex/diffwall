"""First CASA-enforcing rule set for agent actions.

Each rule inspects a proposed Action and returns a RuleResult. A rule either
matches (its verdict applies) or not. The engine merges matched verdicts by
taking the most restrictive one.

Rule tiers:
    HALT   — R1 irreversible destruction, R2 financial transfer, R3 exposed secret
    REVIEW — R4 public broadcast, R5 data mutation
    ALLOW  — R6 read-only
"""
from __future__ import annotations

import re
from typing import Callable, List

from .models import Action, RuleResult, Verdict

Rule = Callable[[Action], RuleResult]


def _result(rule, verdict, matched, reason="", fix="") -> RuleResult:
    return RuleResult(rule=rule, verdict=verdict, matched=matched,
                      reason=reason, suggested_fix=fix)


def _any(patterns, text) -> bool:
    return any(p.search(text) for p in patterns)


# ----------------------------------------------------------------------------
# R1 — Irreversible destruction → HALT
# ----------------------------------------------------------------------------
_R1_TYPES = {
    "delete_database", "drop_table", "wipe", "purge", "destroy",
    "factory_reset", "delete_all",
}
_R1_PATTERNS = [re.compile(p) for p in [
    r"rm\s+-rf",
    r"drop\s+table",
    r"drop\s+database",
    r"truncate\s+table",
    r"delete\s+from\b.*\bwhere\s+1\s*=\s*1",
    r"format\s+.*\bdrive\b",
]]


def r1_irreversible_destruction(a: Action) -> RuleResult:
    rid = "R1_IRREVERSIBLE_DESTRUCTION"
    hit = a.type in _R1_TYPES or _any(_R1_PATTERNS, a.searchable_text())
    if hit:
        return _result(rid, Verdict.HALT, True,
                       "Action performs irreversible data destruction.",
                       "Require explicit human approval and a verified backup before proceeding.")
    return _result(rid, Verdict.HALT, False)


# ----------------------------------------------------------------------------
# R2 — Financial transfer → HALT
# ----------------------------------------------------------------------------
_R2_TYPES = {
    "transfer_funds", "payment", "withdraw", "wire_transfer",
    "send_money", "charge_card", "crypto_transfer",
}
_R2_PATTERNS = [re.compile(p) for p in [
    r"\b(transfer|wire|withdraw)\b.*\b(amount|usd|btc|eth)\b",
    r"\b(transfer|wire|withdraw)\b.*\$\s*\d",
    r"\bsend\b.*\b(usd|btc|eth)\b",
]]


def r2_financial_transfer(a: Action) -> RuleResult:
    rid = "R2_FINANCIAL_TRANSFER"
    hit = a.type in _R2_TYPES or _any(_R2_PATTERNS, a.searchable_text())
    if hit:
        return _result(rid, Verdict.HALT, True,
                       "Action moves funds or financial value.",
                       "Route to a human approver with transaction limits and out-of-band confirmation.")
    return _result(rid, Verdict.HALT, False)


# ----------------------------------------------------------------------------
# R3 — Exposed secret → HALT  (case-sensitive; uses raw_text)
# ----------------------------------------------------------------------------
_R3_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    r"sk-[a-z0-9]{20,}",
    r"AKIA[0-9A-Z]{16}",
    r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    r"password\s*[:=]",
    r"api_key\s*[:=]",
    r"ghp_[a-z0-9]{20,}",
    r"xox[baprs]-[a-z0-9-]+",
]]


def r3_exposed_secret(a: Action) -> RuleResult:
    rid = "R3_EXPOSED_SECRET"
    hit = _any(_R3_PATTERNS, a.raw_text())
    if hit:
        return _result(rid, Verdict.HALT, True,
                       "Action payload contains a credential/secret pattern.",
                       "Strip the secret; load from a secrets manager or env var at runtime.")
    return _result(rid, Verdict.HALT, False)


# ----------------------------------------------------------------------------
# R4 — Public broadcast → REVIEW
# ----------------------------------------------------------------------------
_R4_TYPES = {
    "post_public", "publish", "send_email", "send_sms",
    "tweet", "social_post", "press_release",
}


def r4_public_broadcast(a: Action) -> RuleResult:
    rid = "R4_PUBLIC_BROADCAST"
    if a.type in _R4_TYPES:
        return _result(rid, Verdict.REVIEW, True,
                       "Action broadcasts content externally.",
                       "Have a human review recipients and content before sending.")
    return _result(rid, Verdict.REVIEW, False)


# ----------------------------------------------------------------------------
# R5 — Data mutation → REVIEW
# ----------------------------------------------------------------------------
_R5_TYPES = {
    "db_write", "file_write", "update_record", "create_record",
    "config_change", "deploy",
}


def r5_data_mutation(a: Action) -> RuleResult:
    rid = "R5_DATA_MUTATION"
    if a.type in _R5_TYPES:
        return _result(rid, Verdict.REVIEW, True,
                       "Action mutates persistent state.",
                       "Confirm scope and ensure the change is reversible or backed up.")
    return _result(rid, Verdict.REVIEW, False)


# ----------------------------------------------------------------------------
# R6 — Read-only → ALLOW
# ----------------------------------------------------------------------------
_R6_TYPES = {
    "read_file", "query", "fetch", "list", "search",
    "get", "describe", "summarize",
}


def r6_read_only(a: Action) -> RuleResult:
    rid = "R6_READ_ONLY"
    if a.type in _R6_TYPES:
        return _result(rid, Verdict.ALLOW, True,
                       "Action is read-only / non-mutating.")
    return _result(rid, Verdict.ALLOW, False)


RULES: List[Rule] = [
    r1_irreversible_destruction,
    r2_financial_transfer,
    r3_exposed_secret,
    r4_public_broadcast,
    r5_data_mutation,
    r6_read_only,
]
