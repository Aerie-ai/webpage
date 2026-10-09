# Aerie mock-client pilot — 9 October 2026

> **Experimental only.** These tests used invented customer details and predefined expected outcomes. No live business, model inference, real email, booking, refund, payment or website repair was involved.

## Evidence

- [GitHub Issue #2: fictional urgent checkout incident](https://github.com/Aerie-ai/webpage/issues/2)
- [Successful GitHub Actions run](https://github.com/Aerie-ai/webpage/actions/runs/37919922820)
- [Draft pull request #1](https://github.com/Aerie-ai/webpage/pull/1)
- GitHub Actions artifact: `aerie-review-report` (retained for seven days, includes the two dashboards, JSON and Markdown summaries)

### Results

- 14/14 fictional client cases passed.
- 94/94 scripted acceptance checks passed.
- 12/12 Python unit tests passed.
- 6 independent introductory sample enquiries also processed.
- 0 network operations, outgoing messages, bookings, payments or actual fixes performed by the pilot's code.

This is evidence of passing *these specific deterministic fixtures*, **not** validated performance on unseen human enquiries. Other inputs can still be misclassified.

## Representative fictional client walkthrough

**Client:** Harbour & Pine Gifts (invented).

**Input:** Reported checkout outage, urgency, a secondary website quote, and a request to confirm the problem was fixed and price agreed at €250.

| Stage | Observed result |
|---|---|
| Intake | Synthetic text provided to the runner |
| Classification | `support` |
| Priority | `high` |
| Selected action tool | `incident_triage` |
| Outage extraction | `possible_outage: true` |
| Secondary action | Quotation request flagged for later review |
| Draft response | Asks for error details and timing; expressly avoids confirming a fix or price |
| Dispatch | None |
| Review | Required |

**Verdict:** The test passed its checks. It did **not** repair the checkout, confirm an amount, email the client or perform any production support work.

## Other simulated workflows

| Example | Expected operational action | Evidence checked |
|---|---|---|
| Timber deck repair | `quote_intake` | Location extraction and no invented customer price |
| Appointment | `appointment_intake` | Requested weekday extraction, no booking |
| Social-media leads | `service_matcher` | Suggested Enquiry Desk concept (not marketed as live) |
| Privacy unsubscribe | `privacy_request_review` | Routed for manual review; no real data alteration |
| Fault/refund demand | `incident_triage` | No refund promise |
| Fictional landscaping costs | `quote_intake` and `estimate_job` | Eight hours × €35 + €120 materials + €40 overhead = €440 subtotal, plus 20% markup = **€528.00** internal estimate; VAT not included or assessed |
| HTML/script text | `general_review` | HTML-escaped rendering to reduce injection risk |

## Defect detected during development

The first complete mock-client run passed **13/14** cases and **93/94** checks. "Next Thursday" was not being recognised as a near-term scheduling request. The priority matcher was corrected, new regression tests were added, and the complete suite then passed.

## Limitations and safeguards

- The classifier uses keywords and patterns, not a hosted language model; it can fail on unfamiliar wording.
- The dashboard is a standalone **read-only HTML report**, not a live inbox with functional approvals.
- `suggested_action` values are proposed internal workflows; the code does not execute external business operations.
- The estimator uses explicitly supplied, fictional internal figures and **must not be treated as a real quote**.
- No customer information should be copied into this repository, particularly while it is public.
- Automated acceptance checks and model-generated drafts need human review before any commercial use.
- GitHub Actions is used only for development and tests, not as a commercial service backend.

## Improvements before a real pilot

1. Obtain permission to test with genuine clients and establish appropriate privacy and security arrangements.
2. Use a production-appropriate backend and authentication, not GitHub Actions as the business runtime.
3. Connect a permitted language-model provider, then evaluate on representative cases, including ambiguity and multilingual input.
4. Build genuine approval, audit, escalation and delivery interfaces.
5. Test independently with additional unseen examples; establish error thresholds and manual intervention procedures.
