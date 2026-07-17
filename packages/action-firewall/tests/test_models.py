import unittest

from diffwall.models import Action, Verdict, most_restrictive


class TestModels(unittest.TestCase):
    def test_from_dict_normalizes_type(self):
        a = Action.from_dict({"type": "  Delete_Database  "})
        self.assertEqual(a.type, "delete_database")

    def test_from_dict_coerces_non_dict_params(self):
        self.assertEqual(Action.from_dict({"type": "x", "params": "oops"}).params, {})
        self.assertEqual(Action.from_dict({"type": "x", "params": None}).params, {})
        self.assertEqual(Action.from_dict({"type": "x", "params": [1, 2]}).params, {})
        self.assertEqual(Action.from_dict({"type": "x", "params": {"k": 1}}).params, {"k": 1})

    def test_searchable_text_is_lowercased(self):
        a = Action.from_dict({"type": "Run", "payload": "RM -RF /"})
        self.assertIn("rm -rf /", a.searchable_text())

    def test_raw_text_preserves_case(self):
        a = Action.from_dict({"type": "file_write", "payload": "AKIAIOSFODNN7EXAMPLE"})
        self.assertIn("AKIAIOSFODNN7EXAMPLE", a.raw_text())

    def test_most_restrictive_wins(self):
        self.assertEqual(most_restrictive([Verdict.ALLOW, Verdict.HALT, Verdict.REVIEW]), Verdict.HALT)
        self.assertEqual(most_restrictive([Verdict.ALLOW, Verdict.REVIEW]), Verdict.REVIEW)

    def test_most_restrictive_empty_fails_safe_to_review(self):
        self.assertEqual(most_restrictive([]), Verdict.REVIEW)


if __name__ == "__main__":
    unittest.main()
