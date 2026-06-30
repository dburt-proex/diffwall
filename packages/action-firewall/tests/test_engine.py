import unittest
from diffwall.models import Action, Verdict
from diffwall.engine import validate, validate_many


def A(**kw):
    return Action.from_dict(kw)


class TestEngine(unittest.TestCase):

    def test_read_only_allows(self):
        self.assertEqual(validate(A(type="read_file")).verdict, Verdict.ALLOW)

    def test_most_restrictive_wins(self):
        # file_write (REVIEW) + embedded credential marker (HALT) -> HALT
        rep = validate(A(type="file_write", payload="password=[REDACTED]"))
        self.assertEqual(rep.verdict, Verdict.HALT)
        self.assertIn("R3_EXPOSED_SECRET", rep.triggered_by)

    def test_halt_destruction(self):
        self.assertEqual(validate(A(type="delete_database")).verdict, Verdict.HALT)

    def test_halt_financial(self):
        self.assertEqual(validate(A(type="transfer_funds")).verdict, Verdict.HALT)

    def test_unknown_fails_safe_to_review(self):
        rep = validate(A(type="some_unmapped_action"))
        self.assertEqual(rep.verdict, Verdict.REVIEW)
        self.assertEqual(rep.triggered_by, ["DEFAULT_FAIL_SAFE"])

    def test_batch(self):
        reps = validate_many([A(type="read_file"), A(type="delete_all")])
        self.assertEqual([r.verdict for r in reps], [Verdict.ALLOW, Verdict.HALT])


if __name__ == "__main__":
    unittest.main()
