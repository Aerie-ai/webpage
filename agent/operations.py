"""Deterministic, review-only tools for Aerie's fictional client pilot.

These helpers create proposed next steps. They NEVER send a message, book a meeting,
issue a price to a customer or access a production system.
"""
from __future__ import annotations
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import re

TOOLS = {
    "quotation": "quote_intake",
    "appointments": "appointment_intake",
    "support": "incident_triage",
    "services": "service_matcher",
    "privacy": "privacy_request_review",
    "general": "general_review",
}
DAY_PATTERN = r"\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b"
LOCATION_PATTERN = r"\b(?:in|near|at)\s+(Galway|Limerick|Cork|Dublin|Clare|Ennis|Kilkenny|Sligo|Waterford)\b"
OUTAGE = re.compile(r"\b(?:checkout|website|site|system|payment)\b.{0,55}\b(?:down|broken|stopped|failed|failing|offline|error|unavailable)\b|\b(?:down|broken|stopped|failed|failing|offline|error|unavailable)\b.{0,55}\b(?:checkout|website|site|system|payment)\b", re.I)


def estimate_job(labour_hours, hourly_rate, materials, overheads, markup_percent):
    """Compute a *fictional internal estimate*. Never a customer-approved quote."""
    fields = {
        "labour_hours": labour_hours,
        "hourly_rate": hourly_rate,
        "materials": materials,
        "overheads": overheads,
        "markup_percent": markup_percent,
    }
    amounts = {}
    for key, value in fields.items():
        try:
            amount = Decimal(str(value))
        except (InvalidOperation, ValueError) as exc:
            raise ValueError(f"Invalid numerical value for {key}") from exc
        if not amount.is_finite() or amount < 0 or amount > Decimal("1000000"):
            raise ValueError(f"Out of range {key}")
        amounts[key] = amount
    if amounts["markup_percent"] > 500:
        raise ValueError("Markup must be no more than 500% in this prototype")
    subtotal = amounts["labour_hours"] * amounts["hourly_rate"] + amounts["materials"] + amounts["overheads"]
    markup = subtotal * amounts["markup_percent"] / Decimal(100)
    money = lambda value: str(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    return {
        "currency": "EUR",
        "labour_cost": money(amounts["labour_hours"] * amounts["hourly_rate"]),
        "cost_subtotal": money(subtotal),
        "markup_amount": money(markup),
        "internal_estimate": money(subtotal + markup),
        "approval_required": True,
        "note": "Illustrative, fictional internal estimate. Not a customer quotation; VAT and other pricing details are not assessed.",
    }


def prepare_action(category: str, message: str, priority: str, quote_inputs=None) -> dict:
    if category not in TOOLS:
        category = "general"
    tool = TOOLS[category]
    msg = message.lower()
    action = {
        "tool": tool,
        "status": "suggested_only",
        "human_review_required": True,
        "automated_external_actions": 0,
        "explanation": "",
        "next_steps": [],
        "extracted": {},
    }

    if category == "quotation":
        location = re.search(LOCATION_PATTERN, message, re.I)
        action["extracted"] = {
            "location_mentioned": location.group(1) if location else None,
            "timeline_mentioned": bool(re.search(r"\b(?:next|this)\s+(?:week|month|fortnight)\b", msg)),
        }
        action["explanation"] = "Collect job requirements before preparing any quotation."
        action["next_steps"] = [
            "Confirm job scope, location and preferred timeline",
            "Ask for measurements, materials and access constraints as appropriate",
            "Prepare an internal estimate only after costs are supplied and reviewed",
        ]
        if quote_inputs is not None:
            action["estimate"] = estimate_job(**quote_inputs)
    elif category == "appointments":
        day = re.search(DAY_PATTERN, msg, re.I)
        action["extracted"] = {"requested_weekday": day.group(0) if day else None}
        action["explanation"] = "Gather scheduling preferences. No calendar availability is checked."
        action["next_steps"] = ["Confirm purpose and preferred date/time", "Check an actual calendar manually", "Only then offer a slot"]
    elif category == "support":
        outage = bool(OUTAGE.search(message))
        action["extracted"] = {"possible_outage": outage}
        action["explanation"] = "Triage the reported fault; the system cannot diagnose or fix it."
        action["next_steps"] = [
            "Record symptom, time first noticed and affected process",
            "Escalate to a human" + (" promptly due to reported outage" if outage or priority == "high" else ""),
            "Avoid requesting passwords, payment card numbers or sensitive account data",
        ]
        if re.search(r"\b(?:quote|estimate|price|cost)\b", msg):
            action["next_steps"].append("Record secondary quotation request after the incident is assessed")
    elif category == "services":
        idea = ("Enquiry Desk" if re.search(r"\b(?:enquir|lead|missed|inbox|instagram)\w*", msg)
                else "Quote Ready" if re.search(r"\b(?:quot|price|estim)\w*", msg)
                else "Aerie service discovery")
        action["extracted"] = {"suggested_concept": idea}
        action["explanation"] = "Propose a suitable pilot concept; none is represented as deployed."
        action["next_steps"] = ["Understand the business workflow", "Define a small fictional-data pilot", "Review feasibility and compliance"]
    elif category == "privacy":
        action["explanation"] = "Potential privacy or opt-out request: manual review only."
        action["next_steps"] = [
            "Flag for the data controller or owner",
            "Do not send marketing or automatically alter personal data",
            "Check legal requirements and identity using an appropriate secure process",
        ]
    else:
        action["explanation"] = "Human review is needed before providing factual information."
        action["next_steps"] = ["Clarify the request", "Consult verified business information", "Prepare a reply for review"]
    return action
