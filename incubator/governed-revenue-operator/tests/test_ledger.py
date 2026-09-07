from dataclasses import replace
from datetime import datetime, timezone
import unittest

from governed_revenue_operator import AppendOnlyLedger, verify_entries


class LedgerTests(unittest.TestCase):
    def test_hash_chain_verifies_and_detects_mutation(self) -> None:
        ledger = AppendOnlyLedger()
        at = datetime(2026, 7, 30, 12, 0, tzinfo=timezone.utc)
        ledger.append("intent", {"id": "a-1"}, timestamp=at)
        ledger.append("decision", {"route": "ALLOW"}, timestamp=at)
        self.assertTrue(ledger.verify())

        entries = list(ledger.entries)
        entries[0] = replace(entries[0], payload={"id": "tampered"})
        self.assertFalse(verify_entries(entries))

    def test_export_is_stable_and_sequence_is_monotonic(self) -> None:
        ledger = AppendOnlyLedger()
        ledger.append("one", {"value": 1})
        ledger.append("two", {"value": 2})
        exported = ledger.export()
        self.assertEqual([1, 2], [item["sequence"] for item in exported])
        self.assertEqual(
            exported[0]["entry_hash"],
            exported[1]["previous_hash"],
        )


if __name__ == "__main__":
    unittest.main()

