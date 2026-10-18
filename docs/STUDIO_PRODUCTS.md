# Aerie Studio — six working fictional-data product prototypes

**Stage:** Demonstration only. No client integrations, customer accounts, live AI service, measurements from electricity meters, security scanning or persistent customer records.

**Browser entry:** `studio/index.html` or, once the reviewed change is published, `https://aerie-ai.github.io/webpage/studio/`.

## What each product actually does

| Working tool | Example output | Why a small business might use it | What it cannot yet do |
| --- | --- | --- | --- |
| **Aerie Flow** | Estimate annual hours currently spent on repetitive tasks, a *hypothetical* percentage improvement, value of owner-entered time, and 3 sector-specific workflow ideas | Identify bottlenecks and prioritise administration improvements | Measure real productivity, automate an integration or guarantee time savings |
| **Aerie Energy** | Compute annual kWh and electricity cost from device count, power, hours, working weeks and tariff; compare possible avoided run-hours | Understand operating-cost scenarios and whether a change is worth investigating | Read meters, verify power draw, optimise unsafe refrigeration/heating schedules or report measured CO2 |
| **Energy compute comparison** | Compare hypothetical all-AI vs local-rules-plus-AI scenarios from **user-entered joules/task** | Help Aerie or clients reason about compute intensity and selective AI | Provide energy factors or infer real GPU/server consumption; no energy or carbon is measured by Aerie |
| **Aerie Quote** | Reuse existing local calculation, distinguish markup from implied gross margin, list missing job details, export a fictional CSV | Reduce avoidable back-and-forth before human-approved quoting | Issue binding quotations, calculate VAT, approve contracts, invent prices or sync accounts |
| **Aerie Follow-Up** | Stage- and age-based review suggestion; stop on opt-out and hold when appropriate contact permission is not confirmed | Avoid forgotten enquiries without automatically contacting anyone | Send emails, schedule real reminders, determine lawful marketing basis or contact customers |
| **Aerie Field** | Editable temporary checklist with four templates (ecology survey, contractor site visit, shop visit, equipment maintenance) and CSV export | Avoid repeat trips and forgotten observations | Capture real site records, geolocation, photos or create a compliant survey/RAMS |
| **Aerie Guardian** | Explain security/control gaps from eight self-reported answers, show highest-priority actions | Help time-poor teams decide what security questions to address | Scan devices, authenticate staff, detect malware, certify security or GDPR compliance |

**Industry selection in Flow:** 5 sector sets—trades, hospitality, retail, services, and fieldwork—with 3 actionable ideas each, presented with a safety limitation.

## Energy maths and honest claims

Equipment annual kWh = watts * devices * hours/day * active days/week * weeks/year / 1000.
Possible avoided kWh = watts * devices * reduced hours/day * days/week * weeks/year / 1000.
Electricity cost = estimated kWh * **entered** EUR/kWh (excludes VAT, standing charge, dynamic tariffs, power-factor demand charges and changing device loads).

Compute comparison: annual tasks = tasks/day * days/year. For the hypothetical AI share, energy is the weighted sum of entered local and AI joules/task divided by 3,600,000 joules/kWh. `difference_kWh` is **all-AI scenario minus hybrid scenario**; can be negative. It is not an achieved saving.

Flow: annual hours = tasks/week * minutes/task * working weeks/year / 60. Potential hours is that times owner-entered assumed reduction. Value of those hours is *not* necessarily cash saved or revenue gained and can be double-counted between proposals.

All numbers are scenario calculations from **fictional or owner-entered assumptions**. No Aerie equipment metering or AI inference energy measurement occurs; carbon remains unmeasured. Honest reporting matters more than a green-looking score.

## Privacy, control and security defaults

- All features operate in browser memory with locally bundled JavaScript; network connections and form submissions blocked by CSP, no runtime library, analytics or storage. Browser hosting and users' own devices still present risk.
- No names, customer identities, credentials, sensitive locations or real customer records are required or appropriate in the demo.
- Nothing is sent, booked, invoiced, deleted or charged. Approvals and opt-outs are only fictional flags in this demo.
- CSV exports use the existing Aerie CSV encoder with mitigation for common formula prefixes. It is not a guarantee across all spreadsheet applications.
- Guardian checks *answers*, not security; no 100% secure status and no automated remediation.
- Initial product code intentionally provides non-AI transparent logic; future optional AI must be assessed for net benefit, energy, consent, purpose, revocable access and human oversight.

## Validation and performance

Node `--test tests/*.test.cjs` runs scenario, integration and local-first policy tests. GitHub Actions also writes `output/efficiency_baseline.json` with static source bytes, observed Node execution time and synthetic examples; **not energy or carbon**. The original Lab has its own 32 KiB JavaScript / 140 KiB public source budgets, and the combined Studio & Lab public pages have an explicit 180 KiB source / 64 KiB JS budget. These are source-size budgets, not network bytes after compression.

## What to build toward before charging customers

1. Ask local businesses to rank their highest-friction tasks, and test **time-to-correct-answer, adoption, support load and actual repeat work prevented**, not chatbot novelty.
2. Add independently reviewed, customer-controlled encrypted local storage, safe key recovery and portable data formats. Keep the fiction-only demo separate.
3. For real follow-ups, integrate authorised mail/calendar providers with tightly scoped permissions, explicit approval, consent checks and revocation.
4. For Field, let a customer choose a portable, offline-first job-record format and verify completeness while preventing fabricated survey findings.
5. For Guardian, consider an optional read-only configuration review *only after* authentication, permissions, explicit scopes, and external security review.
6. For Energy, use physical power meter data or a credible metering integration and compare a repeatable baseline before showing achieved kWh or CO2 effects.

## Additional commercial opportunities (not built)

- **Aerie Margin:** monitor margin erosion when materials, travel and overheads change after a quote.
- **Aerie Stock & Waste:** owner-controlled reorder and perishable-waste worksheets for hospitality/retail.
- **Aerie Evidence:** portable inspection/incident evidence packs with audit history and offline sync.
- **Aerie Cashflow:** a conservative forecast from owner-entered invoicing and due-date assumptions.
- **Aerie Accessibility:** plain-language and accessible-message review before sending customer communication.

These are ideas for discovery interviews, not paid services or claimed working features. Prefer improving the six tested workflows after customer feedback before adding more code.
