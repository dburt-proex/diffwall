#!/usr/bin/env python3
"""Validate the repository compliance baseline; this is not an assurance assessment."""
import argparse
from datetime import date
from pathlib import Path, PurePosixPath
import subprocess
import sys

import yaml

CONTROLS = {"GOV-001", "RSK-001", "IAM-001", "CHG-001", "LOG-001", "EVD-001", "SEC-001", "INC-001", "AI-001", "DAT-001", "SUP-001", "BCM-001", "REV-001"}
STATES = {"NOT_APPLICABLE", "MISSING", "PARTIAL", "IMPLEMENTED", "VERIFIED"}
BOUNDARY = "no_certification_or_attestation_claim_without_independent_assurance"
GATE = "blocked_until_p0_closed_or_formally_risk_accepted"
FIELDS = {"version", "system", "repository", "canonical_registry", "canonical_registry_version", "claim_boundary", "assessment_date", "states", "controls", "remediation"}


class UniqueKeyLoader(yaml.SafeLoader):
    pass


def unique_mapping(loader, node):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node)
        if not isinstance(key, str):
            raise ValueError("manifest mapping keys must be strings")
        if key in mapping:
            raise ValueError(f"duplicate YAML key: {key}")
        mapping[key] = loader.construct_object(value_node)
    return mapping


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate(root):
    manifest = root / "COMPLIANCE.yaml"
    require(manifest.is_file(), "COMPLIANCE.yaml is missing")
    require((root / "docs/COMPLIANCE-READINESS.md").is_file(), "readiness document is missing")
    require(manifest.stat().st_size <= 1024 * 1024, "manifest exceeds 1 MiB")
    text = manifest.read_text(encoding="utf-8")
    # Aliases and merge keys hide provenance and permit cyclic or amplified structures.
    require(not any(isinstance(token, (yaml.tokens.AnchorToken, yaml.tokens.AliasToken)) for token in yaml.scan(text)), "YAML anchors and aliases are not supported")
    data = yaml.load(text, Loader=UniqueKeyLoader)
    require(isinstance(data, dict) and set(data) == FIELDS, "manifest has missing or unknown top-level fields")
    require(data["version"] == "0.1", "unsupported manifest version")
    require(data["system"] == "DiffWall" and data["repository"] == "dburt-proex/diffwall", "incorrect system or repository identity")
    require(data["claim_boundary"] == BOUNDARY, "unsupported claim boundary")
    require(isinstance(data["assessment_date"], str), "assessment_date must be an ISO date string")
    date.fromisoformat(data["assessment_date"])
    states = data["states"]
    require(isinstance(states, list) and all(isinstance(s, str) for s in states), "states must be a list of strings")
    require(len(states) == len(STATES) and set(states) == STATES, "invalid declared control states")
    require(data["canonical_registry"] == "dburt-proex/casa/governance/CONTROL-REGISTRY.yaml" and data["canonical_registry_version"] == "0.1", "invalid canonical registry binding; see main commit 973f712c2f8cad1821e5e1e3b5b3f0a005058bdd")
    controls = data["controls"]
    require(isinstance(controls, dict) and set(controls) == CONTROLS, "missing or unknown control identifiers")

    tracked = None
    if (root / ".git").exists():
        result = subprocess.run(["git", "ls-files", "-z"], cwd=root, check=True, capture_output=True, text=True)
        tracked = set(result.stdout.split("\0")) - {""}

    for name, control in controls.items():
        require(isinstance(control, dict), f"{name}: control must be a mapping")
        require({"status", "evidence"} <= set(control) <= {"status", "evidence", "note", "gap"}, f"{name}: invalid fields")
        status = control["status"]
        require(isinstance(status, str) and status in STATES, f"{name}: invalid status")
        require(status != "VERIFIED", f"{name}: VERIFIED requires assessment evidence beyond this internal baseline")
        for field in ("note", "gap"):
            if field in control:
                require(isinstance(control[field], str) and bool(control[field].strip()), f"{name}: {field} must be nonempty text")
        if status in {"MISSING", "PARTIAL"}:
            require(bool(control.get("gap")), f"{name}: incomplete control needs a gap")
        if status == "NOT_APPLICABLE":
            require(bool(control.get("note")), f"{name}: NOT_APPLICABLE needs a rationale")
        evidence = control["evidence"]
        require(isinstance(evidence, list), f"{name}: evidence must be a list")
        require(status not in {"IMPLEMENTED", "VERIFIED"} or bool(evidence), f"{name}: implemented controls require evidence")
        seen = set()
        for relative in evidence:
            require(isinstance(relative, str) and bool(relative.strip()), f"{name}: evidence paths must be nonempty strings")
            path = PurePosixPath(relative)
            require(not path.is_absolute() and ":" not in relative and "\\" not in relative and ".." not in path.parts and str(path) not in {".", ".git"} and ".git" not in path.parts, f"{name}: unsafe evidence path {relative}")
            require(relative not in seen, f"{name}: duplicate evidence path {relative}")
            seen.add(relative)
            resolved = (root / relative).resolve()
            require(resolved.is_relative_to(root) and resolved.exists(), f"{name}: missing or escaped evidence path {relative}")
            if tracked is not None:
                require(relative in tracked or any(p.startswith(relative.rstrip("/") + "/") for p in tracked), f"{name}: evidence is not tracked: {relative}")

    remediation = data["remediation"]
    require(isinstance(remediation, dict) and set(remediation) == {"p0", "p1", "external_assurance_gate"}, "invalid remediation fields")
    require(remediation["external_assurance_gate"] == GATE, "external assurance gate must remain blocked")
    priorities = set()
    for priority in ("p0", "p1"):
        items = remediation[priority]
        require(isinstance(items, list), f"{priority}: must be a list")
        require(all(isinstance(item, str) and item in CONTROLS for item in items), f"{priority}: unknown control")
        require(len(items) == len(set(items)) and not priorities.intersection(items), f"{priority}: duplicate remediation assignment")
        priorities.update(items)
    print(f"compliance baseline contract: PASS ({len(controls)} controls; external assurance blocked)")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    try:
        validate(args.root.resolve())
    except (OSError, ValueError, yaml.YAMLError, subprocess.CalledProcessError) as error:
        print(f"compliance baseline contract: FAIL: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
