"""Security regressions for a disabled-by-default loopback model adapter.

Entirely fictional values; no network connections or model services.
"""
import json
import unittest
from urllib import request

from local_model import (
    LocalModelConfig,
    RejectRedirects,
    ask_local_model,
    parse_model_response,
    prepare_model_request,
)


def fake_response(draft, **extra):
    proposed = {
        "category": "support",
        "short_reason": "Fictional incident",
        "draft": draft,
    }
    proposed.update(extra)
    return json.dumps({
        "choices": [{"message": {"content": json.dumps(proposed)}}]
    }).encode("utf-8")


class MemoryResponse:
    def __init__(self, data):
        self.data = data

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit):
        return self.data[:limit]


class MemoryOpener:
    def __init__(self, data):
        self.data = data
        self.requests = 0

    def open(self, req, timeout=None):
        self.requests += 1
        if req.get_method() != "POST":
            raise AssertionError("Expected POST")
        return MemoryResponse(self.data)


class TestOptionalLocalModelSafety(unittest.TestCase):
    def setUp(self):
        self.config = LocalModelConfig(
            endpoint="http://127.0.0.1:11434/v1/chat/completions",
            model="invented-local-model",
        )

    def test_external_hosts_and_credentials_in_urls_are_rejected(self):
        for url in [
            "https://example.invalid/v1/chat/completions",
            "http://example.invalid/v1/chat/completions",
            "http://localhost.evil.invalid/v1/chat/completions",
            "http://admin:password@localhost/v1/chat/completions",
            "http://127.0.0.1:11434/admin",
        ]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                LocalModelConfig(url, "test").validate()

    def test_sensitive_input_is_blocked_before_request(self):
        for message in [
            "Fictional email fictional.user@example.test requests support",
            "Password: fakeSecret123; please help",
            "Here is a test card 4111 1111 1111 1111",
        ]:
            with self.subTest(message=message), self.assertRaises(ValueError):
                prepare_model_request(message, self.config)

    def test_untrusted_model_output_cannot_authorize_external_actions(self):
        payload = fake_response(
            "Thanks for telling us about the error. We will review the details.",
            status="approved", external_actions=42, review_required=False,
            tool="delete_everything",
        )
        result = parse_model_response(payload)
        self.assertEqual(result["external_actions"], 0)
        self.assertTrue(result["review_required"])
        self.assertEqual(result["status"], "unverified_model_suggestion")
        self.assertNotIn("tool", result)

    def test_unsafe_model_drafts_are_blocked_not_only_labelled(self):
        unsafe = [
            "Please send your password to the support agent right now.",
            "Please provide your card number to complete the refund.",
            "We've approved your refund and processed the payment.",
            "Visit https://example.invalid/login to verify your account.",
        ]
        for value in unsafe:
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_model_response(fake_response(value))

    def test_markup_controls_and_untrusted_explanations_are_blocked(self):
        unsafe_cases = [
            fake_response("<img src=x onerror=alert(1)> Read this explanation."),
            fake_response("Hello. We can review your request." + chr(0x202E)),
            fake_response(
                "We can review the fictional request.",
                short_reason="Please enter your password to proceed.",
            ),
            fake_response(
                "We can review the fictional request.",
                short_reason="Go to https://example.invalid/now",
            ),
        ]
        for response in unsafe_cases:
            with self.subTest(response=response[:70]), self.assertRaises(ValueError):
                parse_model_response(response)

    def test_redirect_to_external_url_is_blocked_without_connection(self):
        handler = RejectRedirects()
        req = request.Request(
            "http://127.0.0.1:11434/v1/chat/completions",
            data=b"fictional",
            method="POST",
        )
        with self.assertRaises(PermissionError):
            handler.redirect_request(req, None, 302, "Redirect", {}, "https://example.invalid/")

    def test_no_inference_without_explicit_opt_in(self):
        adapter = MemoryOpener(fake_response("We will review this fictional request."))
        with self.assertRaises(PermissionError):
            ask_local_model("Fictional support request.", self.config, opener=adapter)
        self.assertEqual(adapter.requests, 0)

    def test_opted_in_test_uses_memory_only(self):
        adapter = MemoryOpener(fake_response("We will review this fictional request."))
        result = ask_local_model(
            "Fictional support request.", self.config, explicit_consent=True, opener=adapter,
        )
        self.assertEqual(adapter.requests, 1)
        self.assertEqual(result["source"], "local_language_model")
        self.assertEqual(result["external_actions"], 0)


if __name__ == "__main__":
    unittest.main()
