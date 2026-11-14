"""Exercise the real compliance gate against isolated repository fixtures."""
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import yaml

REPO = Path(__file__).resolve().parents[2]
VALIDATOR = REPO / "scripts" / "validate-compliance-baseline.py"


class ComplianceGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.manifest = yaml.safe_load((REPO / "COMPLIANCE.yaml").read_text(encoding="utf-8"))
        self.manifest["controls"]["SEC-001"]["evidence"] = ["SECURITY.md", "test"]
        self.manifest["canonical_registry"] = "UNRESOLVED"
        self.manifest["canonical_registry_version"] = "UNRESOLVED"
        for control in self.manifest["controls"].values():
            for relative in control["evidence"]:
                path = self.root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                if (REPO / relative).is_dir():
                    path.mkdir(exist_ok=True)
                else:
                    path.write_text("fixture evidence\n", encoding="utf-8")
        (self.root / "docs").mkdir(exist_ok=True)
        (self.root / "docs/COMPLIANCE-READINESS.md").write_text("# Baseline\n", encoding="utf-8")

    def run_gate(self, manifest=None, raw=None):
        text = raw if raw is not None else yaml.safe_dump(manifest or self.manifest, sort_keys=False)
        (self.root / "COMPLIANCE.yaml").write_text(text, encoding="utf-8")
        command = [sys.executable, str(VALIDATOR), "--root", str(self.root)]
        return subprocess.run(command, cwd=self.root, capture_output=True, text=True, timeout=10)

    def assert_rejected(self, result):
        self.assertNotEqual(result.returncode, 0, result.stdout)

    def test_valid_baseline_passes(self):
        result = self.run_gate()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_malformed_yaml_with_required_substrings_is_rejected(self):
        raw = yaml.safe_dump(self.manifest, sort_keys=False) + "broken: [\n"
        self.assert_rejected(self.run_gate(raw=raw))

    def test_fields_in_comments_do_not_satisfy_contract(self):
        raw = "\n".join("# " + line for line in yaml.safe_dump(self.manifest, sort_keys=False).splitlines())
        self.assert_rejected(self.run_gate(raw=raw))

    def test_nested_contract_is_rejected(self):
        self.assert_rejected(self.run_gate({"wrapper": self.manifest}))

    def test_duplicate_keys_are_rejected(self):
        raw = yaml.safe_dump(self.manifest, sort_keys=False) + "system: AnotherSystem\n"
        self.assert_rejected(self.run_gate(raw=raw))

    def test_invalid_control_status_is_rejected(self):
        self.manifest["controls"]["SEC-001"]["status"] = "PASSED"
        self.assert_rejected(self.run_gate())

    def test_missing_control_is_rejected_even_if_named_in_a_comment(self):
        del self.manifest["controls"]["SEC-001"]
        raw = yaml.safe_dump(self.manifest, sort_keys=False) + "# SEC-001\n"
        self.assert_rejected(self.run_gate(raw=raw))

    def test_missing_evidence_path_is_rejected(self):
        self.manifest["controls"]["SEC-001"]["evidence"] = ["tests"]
        self.assert_rejected(self.run_gate())

    def test_evidence_must_be_a_list(self):
        self.manifest["controls"]["SEC-001"]["evidence"] = "SECURITY.md"
        self.assert_rejected(self.run_gate())

    def test_empty_evidence_for_implemented_control_is_rejected(self):
        self.manifest["controls"]["GOV-001"]["evidence"] = []
        self.assert_rejected(self.run_gate())

    def test_evidence_cannot_escape_repository(self):
        self.manifest["controls"]["SEC-001"]["evidence"] = ["../outside"]
        self.assert_rejected(self.run_gate())

    def test_absolute_evidence_is_rejected(self):
        self.manifest["controls"]["SEC-001"]["evidence"] = [str(self.root / "SECURITY.md")]
        self.assert_rejected(self.run_gate())

    def test_symlink_escape_is_rejected(self):
        with tempfile.TemporaryDirectory() as outside:
            try:
                (self.root / "outside-link").symlink_to(outside, target_is_directory=True)
            except OSError:
                self.skipTest("symlinks unavailable on this host")
            self.manifest["controls"]["SEC-001"]["evidence"] = ["outside-link"]
            self.assert_rejected(self.run_gate())

    def test_remediation_cannot_reference_unknown_controls(self):
        self.manifest["remediation"]["p0"].append("FAKE-001")
        self.assert_rejected(self.run_gate())

    def test_unresolved_registry_cannot_claim_verified_controls(self):
        self.manifest["controls"]["GOV-001"]["status"] = "VERIFIED"
        self.assert_rejected(self.run_gate())

    def test_unsupported_claim_boundary_is_rejected(self):
        self.manifest["claim_boundary"] = "certified"
        self.assert_rejected(self.run_gate())

    def test_missing_readiness_document_is_rejected(self):
        (self.root / "docs/COMPLIANCE-READINESS.md").unlink()
        self.assert_rejected(self.run_gate())


if __name__ == "__main__":
    unittest.main()
