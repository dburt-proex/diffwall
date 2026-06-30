"""Diffwall HALT demo.

Runs a mixed batch of proposed agent actions through the validator and prints a
summary table, then the full report for every HALTed action.

Run from package root:
    python demo/halt_demo.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import json
from diffwall.models import Action, Verdict
from diffwall.engine import validate
from diffwall.report import render_text

ACTIONS_DIR = Path(__file__).resolve().parents[1] / "examples" / "actions"


def load():
    out = []
    for f in sorted(ACTIONS_DIR.glob("*.json")):
        d = json.loads(f.read_text())
        d.setdefault("id", f.stem)
        out.append(Action.from_dict(d))
    return out


def main():
    reports = [validate(a) for a in load()]

    print("DIFFWALL — BATCH SUMMARY")
    print("=" * 48)
    print(f"{'VERDICT':8}  {'ACTION ID':10}  ACTION TYPE")
    print("-" * 48)
    for r in reports:
        print(f"{r.verdict.value:8}  {r.action_id:10}  {r.action_type}")
    halts = [r for r in reports if r.verdict == Verdict.HALT]
    print("-" * 48)
    print(f"{len(reports)} actions | {len(halts)} HALTED | "
          f"{sum(1 for r in reports if r.verdict==Verdict.REVIEW)} REVIEW | "
          f"{sum(1 for r in reports if r.verdict==Verdict.ALLOW)} ALLOW")

    for r in halts:
        print("\n" + render_text(r))


if __name__ == "__main__":
    main()
