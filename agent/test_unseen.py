"""Independent held-out-style fictional cases with explicit expected outcomes.

Synthetic inputs only. These are regression fixtures, not evidence of real-world AI accuracy.
"""
import json
import unittest
from pathlib import Path

from run import process_enquiry


FIXTURES = Path(__file__).resolve().parents[1] / "sample_data" / "unseen_enquiries.json"


class TestUnseenFictionalCases(unittest.TestCase):
    def test_expected_routing_and_safeguards(self):
        cases = json.loads(FIXTURES.read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(cases), 15)
        for case in cases:
            with self.subTest(case=case["id"]):
                record = process_enquiry(case)
                self.assertEqual(record["category"], case["category"])
                self.assertEqual(record["priority"], case["priority"])
                if "possible_outage" in case:
                    self.assertEqual(record["suggested_action"]["extracted"].get("possible_outage"), case["possible_outage"])
                self.assertTrue(record["review_required"])
                self.assertEqual(record["status"], "draft_only")
                self.assertEqual(record["suggested_action"]["automated_external_actions"], 0)
                self.assertEqual(record["privacy_routing"]["external_model_calls"], 0)
                self.assertNotIn("your appointment is booked", record["draft"].lower())
                self.assertNotIn("refund approved", record["draft"].lower())


if __name__ == "__main__":
    unittest.main()
