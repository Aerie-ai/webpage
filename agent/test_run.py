"""Unit tests for the entirely offline fictional-enquiry demonstration."""
import csv
import tempfile
import unittest
from pathlib import Path
from run import classify, priority_for, process_enquiry, process_rows, render_dashboard
from operations import estimate_job, prepare_action

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
        with Path(__file__).resolve().parents[1].joinpath("sample_data/enquiries.csv").open(encoding="utf-8", newline="") as sample:
            rows = list(csv.DictReader(sample))
        results = process_rows(rows)
        self.assertGreaterEqual(len(results), 5)
        self.assertTrue(all(x["review_required"] and x["status"] == "draft_only" for x in results))

    def test_mixed_outage_and_quote_is_incident_first(self):
        r = process_enquiry({"id": "T", "message": "Checkout stopped working urgently. Can I get a quote too?"})
        self.assertEqual(r["category"], "support")
        self.assertEqual(r["suggested_action"]["tool"], "incident_triage")
        self.assertIn("secondary quotation", " ".join(r["suggested_action"]["next_steps"]))
        self.assertNotIn("fixed", r["draft"].lower())

    def test_privacy_opt_out(self):
        r = process_enquiry({"id":"PRIV", "message":"Please unsubscribe me and delete my data"})
        self.assertEqual(r["category"], "privacy")
        self.assertEqual(r["suggested_action"]["tool"], "privacy_request_review")
        self.assertTrue(r["review_required"])

    def test_next_weekday_priority(self):
        self.assertEqual(priority_for("Let's meet next Thursday"), "medium")
        self.assertEqual(priority_for("Let's meet on Thursday"), "normal")

    def test_fictional_quotation_arithmetic(self):
        estimate = estimate_job(8, 35, 120, 40, 20)
        self.assertEqual(estimate["labour_cost"], "280.00")
        self.assertEqual(estimate["cost_subtotal"], "440.00")
        self.assertEqual(estimate["markup_amount"], "88.00")
        self.assertEqual(estimate["internal_estimate"], "528.00")
        self.assertTrue(estimate["approval_required"])

    def test_invalid_quotation_inputs_rejected(self):
        for value in [-1, "NaN", "Infinity", "invalid"]:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    estimate_job(value, 35, 120, 40, 20)
        with self.assertRaises(ValueError):
            estimate_job(1, 35, 120, 40, 600)

    def test_no_external_action_allowed(self):
        for category in ("quotation", "appointments", "support", "services", "privacy", "general"):
            with self.subTest(category=category):
                action = prepare_action(category, "fictional only", "normal")
                self.assertEqual(action["automated_external_actions"], 0)
                self.assertEqual(action["status"], "suggested_only")
                self.assertTrue(action["human_review_required"])

if __name__ == "__main__":
    unittest.main()
