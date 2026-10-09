"""Unit tests for the entirely offline fictional-enquiry demonstration."""
import csv
import tempfile
import unittest
from pathlib import Path
from run import classify, priority_for, process_enquiry, process_rows, render_dashboard

class TestAeriePilot(unittest.TestCase):
    def test_classifications(self):
        self.assertEqual(classify("I'd like a quote for plumbing")[0], "quotation")
        self.assertEqual(classify("Can we book an appointment?")[0], "appointments")
        self.assertEqual(classify("Our account has a problem")[0], "support")
        self.assertEqual(classify("What services do you offer?")[0], "services")
        self.assertEqual(classify("Hello, I have a question")[0], "general")

    def test_priority(self):
        self.assertEqual(priority_for("Need help urgently today"), "high")
        self.assertEqual(priority_for("Next week would suit"), "medium")
        self.assertEqual(priority_for("Just enquiring"), "normal")

    def test_quotations_are_drafts(self):
        r = process_enquiry({"id": "TEST", "message": "Need a repair quote ASAP"})
        self.assertEqual(r["category"], "quotation")
        self.assertEqual(r["priority"], "high")
        self.assertTrue(r["review_required"])
        self.assertEqual(r["status"], "draft_only")
        self.assertIn("repair", r["draft"])

    def test_no_html_injection(self):
        r = process_enquiry({"id": "X", "message": '<script>alert("test")</script>'})
        page = render_dashboard([r])
        self.assertIn("&lt;script&gt;", page)
        self.assertNotIn('<script>alert("test")</script>', page)

    def test_duplicate_ids_rejected(self):
        with self.assertRaises(ValueError):
            process_rows([{"id":"A","message":"Hello"},{"id":"A","message":"Hi"}])

    def test_review_required_for_every_result(self):
        rows = list(csv.DictReader(Path(__file__).resolve().parents[1].joinpath("sample_data/enquiries.csv").open(encoding="utf-8")))
        results = process_rows(rows)
        self.assertGreaterEqual(len(results), 5)
        self.assertTrue(all(x["review_required"] and x["status"] == "draft_only" for x in results))

if __name__ == "__main__":
    unittest.main()
