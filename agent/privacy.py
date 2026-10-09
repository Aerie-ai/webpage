"""Privacy-first safeguards and low-compute routing for Aerie's offline pilot.

This module is NOT a replacement for authenticated storage, legal compliance or
a vetted DLP system. Never process genuine client information in public CI.
It contains no networking and deliberately cannot call an external model.
"""
from __future__ import annotations

import re
from collections import Counter

# Conservative best-effort redaction: patterns will have false positives and
# false negatives. No claim that arbitrary PII is comprehensively removed.
PRIVATE_KEY = re.compile(
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----.*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    re.I | re.S,
)
BEARER = re.compile(r"\bBearer\s+[A-Za-z0-9._~+/-]{10,}=*", re.I)
SECRET_ASSIGNMENT = re.compile(
    r"\b(password|passwd|api[_ -]?key|access[_ -]?token|secret|one[- ]time code|otp)\s*(?::|=|\bis\b)\s*[\"']?[^\s,;\"']{4,}",
    re.I,
)
EMAIL = re.compile(r"\b[A-Za-z0-9.!#$%&'*+/=?^_{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+\b")
URL = re.compile(r"\bhttps?://[^\s<>'\"]+", re.I)
PHONE = re.compile(r"(?<![\w])(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}(?!\w)")
CARD_CANDIDATE = re.compile(r"(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)")
IDENTITY = re.compile(r"\b(?:PPSN|passport number|national insurance number|IBAN)\s*[:=]\s*[^\s,;]{4,}", re.I)


def _luhn(value: str) -> bool:
    digits = [int(x) for x in re.sub(r"\D", "", value)]
    if len(digits) < 13 or len(digits) > 19:
        return False
    total = 0
    for i, digit in enumerate(reversed(digits)):
        if i % 2:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0


def redact_sensitive(text: str) -> tuple[str, list[str]]:
    """Return minimal text and coarse flag types; never echo extracted secrets.

    The output and metadata are best-effort. Sensitive content can still evade
    detection, so public GitHub remains unsuitable for genuine client inputs.
    """
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    detected: Counter[str] = Counter()

    def substitute(pattern, value, label, only_if=None):
        nonlocal text
        def repl(match):
            if only_if is not None and not only_if(match.group(0)):
                return match.group(0)
            detected[label] += 1
            return value
        text = pattern.sub(repl, text)

    substitute(PRIVATE_KEY, "[private key removed]", "private_key")
    substitute(BEARER, "[credential removed]", "credential")
    substitute(SECRET_ASSIGNMENT, "[credential removed]", "credential")
    substitute(IDENTITY, "[identity reference removed]", "identity_reference")
    substitute(EMAIL, "[email removed]", "email")
    substitute(URL, "[link removed]", "link")
    substitute(CARD_CANDIDATE, "[payment card removed]", "payment_card", _luhn)
    # Avoid false positives on short numbers, amounts and calendar dates.
    substitute(PHONE, "[phone removed]", "possible_phone", lambda x: len(re.sub(r"\D", "", x)) >= 9)
    return text, sorted(detected)


def decide_execution(category: str, detected: list[str], message: str) -> dict:
    """No optional model is enabled: perform local workflow or request review.

    Count decisions, not unmeasured CO2, energy, or tokens. Never promise that
    local compute has zero environmental impact.
    """
    sensitive = bool(detected)
    manual = sensitive or category in {"privacy", "support"}
    route = "human_review" if manual else "local_rules"
    return {
        "route": route,
        "external_model_enabled": False,
        "external_model_calls": 0,
        "external_data_transfers": 0,
        "local_rules_used": True,
        "sensitive_input_detected": sensitive,
        "redaction_flags": detected,
        "human_approval_required": True,
        "impact_measurement": "not_measured",
        "reason": ("Potentially sensitive details or higher-risk request: review locally."
                   if manual else "Simple request: handle with low-compute local rules."),
        "note": ("This is an experimental route policy, not a proof of security "
                 "or a measured environmental benefit."),
    }
