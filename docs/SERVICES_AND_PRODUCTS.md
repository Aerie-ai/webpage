# Aerie — service and product development roadmap

> Experimental roadmap, not a representation that the services below are live. All pilot testing uses fictional data only.

## Business promise

**Fewer missed enquiries. Less administration. More time for customers.**

Aerie combines enquiry-handling automations and simple digital tools for small independent businesses. Products and services should be measurable, useful and easy to understand.

## What Aerie offers — separate the business from the demo

Aerie's proposed business has **two complementary ways to help independent businesses**:

1. **Digital products:** ready-to-use calculators, checklists, enquiry organisers and similar lightweight tools that businesses can use themselves. The quotation workbook and interactive Lab are currently **free demonstrations only**. No paid product has launched.
2. **Tailored automation setup:** a proposed service helping a business map its repetitive tasks, select appropriate tools and configure human-reviewed workflows for enquiries, quoting and follow-ups. **This is not currently being sold or deployed to clients.**

**Aerie Lab** is a fictional-data testing space that demonstrates product concepts. It is **not itself a paid product or a deployed customer service**.

The first product concepts are Enquiry Desk and Quote Ready; Follow-Up Assistant is planned. Future commercial packaging, pricing and support commitments remain undecided.

The sustainability and privacy principles apply to both offerings: collect the minimum data, favour simpler processing where sufficient, require human oversight for consequential actions, and measure before making environmental claims.

## Three initial workflow concepts to validate

### 1. Enquiry Desk
**Problem:** Requests arrive through multiple channels and get overlooked.
- Intake and classify enquiries.
- Flag urgency and missing information.
- Draft relevant follow-up questions and a reply for review.
- Review before sending; no customer communication in the current pilot.
- Pilot measure: percentage correctly routed and time to prepare an accurate draft.

### 2. Quote Ready
**Problem:** Owners spend too long turning requests into quotations.
- Collect job scope, location, timeline and constraints.
- Identify details missing from a potential quote.
- Export structured notes to the job quotation calculator.
- Never invent pricing or promise availability.
- Pilot measure: completeness of gathered requirements and time to prepare a quote.

### 3. Follow-Up Assistant
**Problem:** Prospective work goes cold without consistent follow-ups.
- Suggest human-approved reminder dates and follow-up drafts.
- Identify unanswered questions or leads needing attention.
- Respect opt-outs and any applicable consent/marketing rules.
- Pilot measure: response timeliness, avoiding unsolicited communications.

## Digital product pipeline

| Product concept | What it solves | Development stage |
| --- | --- | --- |
| Job Quote & Profit Calculator | Estimate costs and margins | Existing demonstration |
| Enquiry Tracker | Record leads, stage and next action | Planned |
| Site Visit & Job Checklist | Reduce missing measurements and details | Planned |
| Small Business Cashflow Planner | Compare cash inflow and commitments | Planned |
| Follow-Up Template Pack | Consistent polite responses | Planned |

## Operating guardrails

- Customer data: none at this stage; fictional examples only.
- No email sending, payments, bookings, third-party integrations or AI API requests in the pilot.
- All drafts require human review. Urgency is a keyword signal, not a reliable risk assessment.
- No sensitive information in GitHub commits, Actions logs or publicly accessible artifacts.
- GitHub Actions is a development/test environment, **not** the production backend of an operating service.
- Before handling real customer data: hosting, security, privacy, retention, processor contracts and appropriate consent/notice require review.
- Keep the approved website's appearance untouched until changes are deliberately reviewed.

## v0.2 acceptance criteria

- Distinguish quotes, appointments, support, services and general enquiries.
- Tag apparent urgency; leave humans to assess what is genuinely urgent.
- Generate topic-aware drafts and follow-up questions without inventing prices or availability.
- Produce an offline HTML dashboard, JSON data and a short summary as CI artifacts.
- Validate all synthetic examples and ensure output text is safely HTML-escaped.
- No automatic communication or live business data.
