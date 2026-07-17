import json
import tempfile
import unittest
from pathlib import Path

from diffwall.cli import main


class TestCli(unittest.TestCase):
    def _write(self, name, content):
        d = Path(tempfile.mkdtemp())
        f = d / name
        f.write_text(content)
        return f

    def test_allow_action_exits_zero(self):
        f = self._write("a.json", json.dumps({"type": "read_file", "target": "README.md"}))
        self.assertEqual(main(["validate", str(f)]), 0)

    def test_halt_action_exits_two(self):
        f = self._write("h.json", json.dumps({"type": "delete_database", "target": "prod"}))
        self.assertEqual(main(["validate", str(f)]), 2)

    def test_review_action_exits_one(self):
        f = self._write("r.json", json.dumps({"type": "send_email", "target": "x@example.com"}))
        self.assertEqual(main(["validate", str(f)]), 1)

    def test_malformed_json_fails_closed(self):
        f = self._write("bad.json", "{ not valid json ")
        self.assertEqual(main(["validate", str(f)]), 2)

    def test_non_object_json_fails_closed(self):
        f = self._write("scalar.json", "42")
        self.assertEqual(main(["validate", str(f)]), 2)

    def test_empty_directory_fails_closed(self):
        d = Path(tempfile.mkdtemp())
        self.assertEqual(main(["validate", str(d)]), 2)

    def test_missing_path_fails_closed(self):
        self.assertEqual(main(["validate", "/nonexistent/path.json"]), 2)

    def test_batch_returns_max_severity(self):
        d = Path(tempfile.mkdtemp())
        (d / "a.json").write_text(json.dumps({"type": "read_file"}))
        (d / "b.json").write_text(json.dumps({"type": "transfer_funds"}))
        self.assertEqual(main(["validate", str(d)]), 2)

    def test_non_dict_params_do_not_crash(self):
        f = self._write("p.json", json.dumps({"type": "read_file", "params": "oops"}))
        self.assertEqual(main(["validate", str(f)]), 0)

    def test_usage_error_without_validate(self):
        self.assertEqual(main([]), 2)


if __name__ == "__main__":
    unittest.main()
