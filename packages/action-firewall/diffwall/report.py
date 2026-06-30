"""Render a Report as human-readable text (CLI / PR comment / audit log)."""
from __future__ import annotations

from .models import Report, Verdict

_TAG = {Verdict.HALT: "[HALT]  ", Verdict.REVIEW: "[REVIEW]", Verdict.ALLOW: "[ALLOW] "}


def render_text(report: Report) -> str:
    lines = []
    lines.append("DIFFWALL — AGENT ACTION REPORT")
    lines.append("=" * 48)
    lines.append(f"Action   : {report.action_id} ({report.action_type})")
    lines.append(f"Verdict  : {report.verdict.value}")
    lines.append(f"Triggered: {', '.join(report.triggered_by) or '-'}")
    lines.append("")
    lines.append("Rule trace:")
    for r in report.results:
        mark = "x" if r.matched else " "
        lines.append(f"  [{mark}] {_TAG[r.verdict]} {r.rule}")
        if r.matched and r.reason:
            lines.append(f"        reason: {r.reason}")
            if r.suggested_fix:
                lines.append(f"        fix   : {r.suggested_fix}")
    return "\n".join(lines)
