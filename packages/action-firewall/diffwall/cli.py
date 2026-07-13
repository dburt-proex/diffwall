"""Diffwall CLI.

Usage:
    python -m diffwall.cli validate <file_or_dir> [--json]

Exit codes (for CI gating):
    0 = ALLOW, 1 = REVIEW, 2 = HALT   (max severity across a batch)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import List

from .models import Action, Verdict
from .engine import validate
from .report import render_text

_EXIT = {Verdict.ALLOW: 0, Verdict.REVIEW: 1, Verdict.HALT: 2}


class ActionLoadError(Exception):
    """Raised when an action file cannot be parsed into valid actions."""


def _load_actions(path: Path) -> List[Action]:
    files = sorted(path.glob("*.json")) if path.is_dir() else [path]
    actions = []
    for f in files:
        try:
            data = json.loads(f.read_text())
        except (OSError, ValueError) as exc:
            raise ActionLoadError(f"could not read/parse {f}: {exc}") from exc
        records = data if isinstance(data, list) else [data]
        for rec in records:
            if not isinstance(rec, dict):
                raise ActionLoadError(
                    f"invalid action in {f}: expected a JSON object, got {type(rec).__name__}")
            rec.setdefault("id", f.stem)
            actions.append(Action.from_dict(rec))
    if not actions:
        raise ActionLoadError(f"no actions found in {path}")
    return actions


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    as_json = "--json" in argv
    argv = [a for a in argv if a != "--json"]

    if len(argv) < 2 or argv[0] != "validate":
        print("usage: python -m diffwall.cli validate <file_or_dir> [--json]")
        return 2

    path = Path(argv[1])
    if not path.exists():
        print(f"error: path not found: {path}")
        return 2

    # Fail closed: if an action cannot be loaded we must not report ALLOW.
    try:
        actions = _load_actions(path)
    except ActionLoadError as exc:
        print(f"error: {exc}")
        return 2

    reports = [validate(a) for a in actions]

    if as_json:
        print(json.dumps([r.to_dict() for r in reports], indent=2))
    else:
        for i, r in enumerate(reports):
            if i:
                print()
            print(render_text(r))

    return max((_EXIT[r.verdict] for r in reports), default=1)


if __name__ == "__main__":
    raise SystemExit(main())
