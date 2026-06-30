import unittest
from diffwall.models import Action, Verdict
from diffwall import rules


def A(**kw):
    return Action.from_dict(kw)


class TestRules(unittest.TestCase):

    def test_r1_fires_on_type_and_pattern(self):
        self.assertTrue(rules.r1_irreversible_destruction(A(type="delete_database")).matched)
        self.assertTrue(rules.r1_irreversible_destruction(
            A(type="run", payload="rm -rf /var/data")).matched)

    def test_r1_quiet_on_safe(self):
        self.assertFalse(rules.r1_irreversible_destruction(A(type="read_file")).matched)

    def test_r2_fires(self):
        self.assertTrue(rules.r2_financial_transfer(A(type="transfer_funds")).matched)
        self.assertTrue(rules.r2_financial_transfer(
            A(type="run", payload="wire transfer amount 500 usd")).matched)

    def test_r2_quiet(self):
        self.assertFalse(rules.r2_financial_transfer(A(type="read_file")).matched)

    def test_r3_detects_secrets(self):
        self.assertTrue(rules.r3_exposed_secret(
            A(type="file_write", payload="password=[REDACTED]")).matched)
        self.assertTrue(rules.r3_exposed_secret(
            A(type="file_write", payload="api_key=[REDACTED]")).matched)

    def test_r3_quiet(self):
        self.assertFalse(rules.r3_exposed_secret(
            A(type="file_write", payload="just some normal text")).matched)

    def test_r4_review(self):
        r = rules.r4_public_broadcast(A(type="send_email"))
        self.assertTrue(r.matched)
        self.assertEqual(r.verdict, Verdict.REVIEW)

    def test_r5_review(self):
        self.assertTrue(rules.r5_data_mutation(A(type="file_write")).matched)

    def test_r6_allow(self):
        r = rules.r6_read_only(A(type="query"))
        self.assertTrue(r.matched)
        self.assertEqual(r.verdict, Verdict.ALLOW)


if __name__ == "__main__":
    unittest.main()
