"""Regression tests for privacy minimisation and energy-aware routing.

Fixtures are invented; no real credentials or personal data are used.
"""
import unittest

from privacy import decide_execution, redact_sensitive
from run import process_enquiry, render_dashboard
from operations import estimate_job


class TestPrivacyFirstAerie(unittest.TestCase):
    def test_email_and_link_not_persisted(self):
        raw = "Please reply to invented.person@example.test about https://sample.invalid/task?key=fake123"
        clean, flags = redact_sensitive(raw)
        self.assertNotIn("invented.person", clean)
        self.assertNotIn("sample.invalid", clean)
        self.assertIn("email", flags)
        self.assertIn("link", flags)

    def test_fake_secret_and_bearer(self):
        raw = "My password: pretendOnly123 and Authorization Bearer abcdefghijklmno12345"
        clean, flags = redact_sensitive(raw)
        self.assertNotIn("pretendOnly123", clean)
        self.assertNotIn("abcdefghijklmno12345", clean)
        self.assertIn("credential", flags)

    def test_demo_payment_card(self):
        clean, flags = redact_sensitive("Use sample test card 4111 1111 1111 1111")
        self.assertIn("[payment card removed]", clean)
        self.assertIn("payment_card", flags)

    def test_private_key_placeholder(self):
        clean, flags = redact_sensitive(
            "-----BEGIN PRIVATE KEY-----FAKE_KEY_MATERIAL-----END PRIVATE KEY-----"
        )
        self.assertNotIn("FAKE_KEY_MATERIAL", clean)
        self.assertIn("private_key", flags)

    def test_numbers_and_euro_quotes_preserved(self):
        clean, flags = redact_sensitive("The price was €250, 8 labour hours on Friday.")
        self.assertIn("€250", clean)
        self.assertIn("8 labour hours", clean)
        self.assertEqual(flags, [])

    def test_sensitive_data_absent_from_output_and_html(self):
        source = "We need a quote. Email invented.person@example.test, password: pretendOnly123"
        record = process_enquiry({"id": "SYNTH-1", "message": source})
        report = str(record)
        page = render_dashboard([record])
        self.assertNotIn("invented.person", report + page)
        self.assertNotIn("pretendOnly123", report + page)
        self.assertEqual(record["privacy_routing"]["route"], "human_review")
        self.assertEqual(record["privacy_routing"]["external_model_calls"], 0)
        self.assertTrue(record["privacy_routing"]["sensitive_input_detected"])

    def test_simple_case_stays_local(self):
        record = process_enquiry({"id": "SYNTH-2", "message": "Could you quote for landscaping?"})
        self.assertEqual(record["privacy_routing"]["route"], "local_rules")
        self.assertEqual(record["privacy_routing"]["external_data_transfers"], 0)
        self.assertTrue(record["review_required"])

    def test_support_and_privacy_ask_human(self):
        for text in ("Please unsubscribe me", "Our checkout is broken urgently"):
            with self.subTest(text=text):
                record = process_enquiry({"id": "SYNTH-3", "message": text})
                self.assertEqual(record["privacy_routing"]["route"], "human_review")
                self.assertEqual(record["privacy_routing"]["external_model_calls"], 0)

    def test_error_handling_and_redaction(self):
        with self.assertRaises(TypeError):
            redact_sensitive(None)

    def test_no_fake_carbon_numbers(self):
        policy = decide_execution("quotation", [], "invented request")
        self.assertEqual(policy["impact_measurement"], "not_measured")
        self.assertNotIn("grams_co2", policy)
        self.assertNotIn("energy_kwh", policy)

    def test_job_quote_remains_review_only(self):
        result = estimate_job(2, 30, 10, 0, 20)
        self.assertEqual(result["internal_estimate"], "84.00")
        self.assertTrue(result["approval_required"])


if __name__ == "__main__":
    unittest.main()
