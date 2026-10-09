"""Aerie enquiry pilot v0.2 — offline, deterministic, fictional-data only.

No network access, email sending, calendar booking, payment processing or AI API.
Every output is a draft requiring human review.
"""
from __future__ import annotations

import csv
import html
import json
import re
from collections import Counter
from pathlib import Path
from operations import prepare_action, OUTAGE

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "sample_data" / "enquiries.csv"
OUTPUT = ROOT / "output"

INTENTS = {
    "privacy": (r"\b(?:unsubscribe|gdpr|opt out|stop emailing|data subject request)\b",
                r"\b(?:delete|erase|remove) (?:my|our) (?:data|information|details)\b"),
    "quotation": (r"\b(?:quote|quotation|estimate|pricing|price|cost|budget)\b",),
    "appointments": (r"\b(?:appointment|booking|book|schedule|meeting|consultation|reschedule)\b",),
    "support": (r"\b(?:broken|fault|issue|problem|refund|complaint|error|cancel|cancellation)\b",
                r"\b(?:not working|stopped working|system down|payment system is down)\b",
                r"\b(?:outage|broken|down|stopped|failed|offline)\b"),
    "services": (r"\b(?:services|offer|provide|specialise|capabilities)\b",),
}
# Tie order is deliberate: a request to book a quotation is routed as a quotation.
QUESTION_BANK = {
    "privacy": ["What type of request are you making? We will review it through the appropriate secure process."],
    "quotation": [
        "What work or service would you like priced?",
        "Where would the work take place?",
        "When would you ideally need it completed?",
    ],
    "appointments": [
        "What would the appointment be about?",
        "Which dates and times suit you?",
        "Would you prefer a call or an in-person meeting?",
    ],
    "support": [
        "What exactly is affected?",
        "When did the problem begin?",
        "Can you describe any error message (without sharing passwords)?",
    ],
    "services": [
        "What kind of business do you run?",
        "Which task takes up most of your time?",
        "What would a successful solution look like?",
    ],
    "general": [
        "What would you like help with?",
        "Is there a particular timeframe to keep in mind?",
    ],
}
OPENINGS = {
    "privacy": "Thanks for contacting us about your privacy preferences.",
    "quotation": "Thanks for your quotation enquiry.",
    "appointments": "Thanks for getting in touch about an appointment.",
    "support": "Thanks for letting us know about the problem.",
    "services": "Thanks for asking about our services.",
    "general": "Thanks for contacting us.",
}
TOPICS = ("repair", "installation", "carpentry", "landscaping", "cleaning",
          "plumbing", "website", "maintenance", "invoice", "delivery")
HIGH = re.compile(r"\b(?:urgent|asap|emergency|immediately|today|critical)\b|\bright now\b", re.I)
MEDIUM = re.compile(r"\b(?:tomorrow|this week|next week|soon|deadline)\b|\bby (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b(?:next|this) (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", re.I)


def classify(message: str) -> tuple[str, list[str]]:
    lowered = message.lower()
    matches = {name: [m.group(0) for expression in rules
                      for m in re.finditer(expression, lowered)]
               for name, rules in INTENTS.items()}
    if matches["privacy"]:
        return "privacy", sorted(set(matches["privacy"]))
    if matches["support"] and OUTAGE.search(message):
        return "support", sorted(set(matches["support"]))
    category = max(INTENTS, key=lambda name: len(matches[name]))
    if not matches[category]:
        return "general", []
    return category, sorted(set(matches[category]))


def priority_for(message: str) -> str:
    if HIGH.search(message):
        return "high"
    if MEDIUM.search(message):
        return "medium"
    return "normal"


def process_enquiry(row: dict[str, str]) -> dict:
    enquiry_id = (row.get("id") or "").strip()
    message = " ".join((row.get("message") or "").split())[:3000]
    if not enquiry_id or not message:
        raise ValueError("Each fictional enquiry needs a non-empty id and message")
    category, matched_terms = classify(message)
    priority = priority_for(message)
    topic = next((t for t in TOPICS if re.search(r"\b" + re.escape(t) + r"\b", message, re.I)), None)

    questions = QUESTION_BANK[category][:]
    # Avoid asking for the timeframe again when it was explicitly supplied.
    if HIGH.search(message) or MEDIUM.search(message):
        questions = [q for q in questions if "when" not in q.lower()
                     and "dates and times" not in q.lower()
                     and "timeframe" not in q.lower()]
    if not questions:
        questions = QUESTION_BANK[category][0:1]

    intro = OPENINGS[category]
    if category == "quotation" and topic:
        intro = f"Thanks for enquiring about a {topic} quotation."
    questions_text = " ".join(questions[:2])
    draft = (f"{intro} To help us understand your request, could you clarify: "
             f"{questions_text} We'll review the details before confirming any next steps.")
    action = prepare_action(category, message, priority, row.get("quote_inputs"))
    return {
        "id": enquiry_id,
        "category": category,
        "priority": priority,
        "message": message,
        "summary": (message[:157] + "...") if len(message) > 160 else message,
        "matched_terms": matched_terms,
        "suggested_action": action,
        "questions_to_ask": questions[:2],
        "draft": draft,
        "review_required": True,
        "status": "draft_only",
    }


def process_rows(rows: list[dict[str, str]]) -> list[dict]:
    seen = set()
    results = []
    for row in rows:
        record = process_enquiry(row)
        if record["id"] in seen:
            raise ValueError(f"Duplicate fictional enquiry id: {record['id']}")
        seen.add(record["id"])
        results.append(record)
    rank = {"high": 0, "medium": 1, "normal": 2}
    return sorted(results, key=lambda r: (rank[r["priority"]], r["id"]))


def render_dashboard(records: list[dict]) -> str:
    e = lambda value: html.escape(str(value), quote=True)
    counts = Counter(r["category"] for r in records)
    urgent = sum(r["priority"] == "high" for r in records)
    cards = []
    for r in records:
        questions = "".join(f"<li>{e(q)}</li>" for q in r["questions_to_ask"])
        action = r["suggested_action"]
        steps = "".join(f"<li>{e(step)}</li>" for step in action["next_steps"])
        estimate = action.get("estimate")
        estimate_html = (f'<div class="draft">Illustrative internal estimate: €{e(estimate["internal_estimate"])} (NOT a customer quote; human approval required).</div>' if estimate else "")
        cards.append(
            f'<article class="enquiry" data-category="{e(r["category"])}" data-priority="{e(r["priority"])}">'
            f'<div class="line"><strong>{e(r["id"])}</strong><div class="tags">'
            f'<span class="tag">{e(r["category"])}</span>'
            f'<span class="tag {e(r["priority"])}">{e(r["priority"])} priority</span></div></div>'
            f'<p class="caption">Fictional enquiry · Human approval required</p>'
            f'<h3>Customer message</h3><p>{e(r["message"])}</p>'
            f'<h3>Suggested follow-up questions</h3><ul>{questions}</ul>'
            f'<h3>Proposed tool: {e(action["tool"])}</h3><ul>{steps}</ul>'
            f'{estimate_html}<h3>Prepared reply — not sent</h3><div class="draft">{e(r["draft"])}</div></article>'
        )
    breakdown = " · ".join(f"{e(k)}: {v}" for k, v in sorted(counts.items()))
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aerie · Enquiry review dashboard</title>
<style>
:root{{--navy:#102d47;--wine:#7c2539;--coral:#d87050;--paper:#fcf9f4;--muted:#596b77}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:#183349;font:16px/1.55 system-ui,Arial,sans-serif}}
header{{background:linear-gradient(110deg,#102d47,#6a293a);color:white;padding:38px 24px}}
.wrap{{max-width:1120px;margin:auto}}h1{{font-size:clamp(28px,5vw,46px);line-height:1.15;margin:14px 0}}
.brand{{font-size:28px;font-weight:800;letter-spacing:-1px}}.brand span{{color:#f0a17b}}
header p{{color:#e8dade}}main{{padding:30px 24px 65px}}.stats{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:25px}}
.stat,.enquiry{{background:white;border:1px solid #e2e5e6;border-radius:12px;padding:23px}}
.stat strong{{display:block;font-size:32px;color:var(--wine)}}.stat span,.caption,.helper{{font-size:13px;color:var(--muted)}}
.controls{{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}}
input,select{{border:1px solid #b9c5ce;border-radius:7px;background:white;padding:11px 12px;font:inherit}}
input{{flex:2;min-width:180px}}select{{flex:1;min-width:150px}}
.list{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr));gap:18px}}
.line{{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}}.tags{{display:flex;gap:6px;flex-wrap:wrap}}
.tag{{font-size:12px;background:#e9eef3;padding:4px 9px;border-radius:30px;text-transform:capitalize}}
.tag.high{{background:#fbe4de;color:#8b241e}}.tag.medium{{background:#fff0d7;color:#754e00}}
h3{{font-size:14px;margin:20px 0 6px;color:#5a2d48;text-transform:uppercase;letter-spacing:.04em}}
.enquiry p{{margin:8px 0}}ul{{padding-left:20px;margin:8px 0}}
.draft{{background:#f4f6f8;border-left:4px solid var(--coral);padding:14px;border-radius:6px;white-space:pre-wrap}}
footer{{font-size:13px;color:var(--muted);padding-top:24px}}#empty{{display:none}}
@media(max-width:650px){{.stats{{grid-template-columns:1fr 1fr}}}}
</style></head><body>
<header><div class="wrap"><div class="brand">aerie<span>.</span></div>
<h1>Enquiries, under control.</h1><p>Offline pilot dashboard · Fictional examples only · No messages are sent</p></div></header>
<main class="wrap">
<div class="stats"><div class="stat"><strong>{len(records)}</strong><span>Sample enquiries</span></div>
<div class="stat"><strong>{urgent}</strong><span>Flagged high priority</span></div>
<div class="stat"><strong>{len(records)}</strong><span>Drafts to review</span></div></div>
<p class="helper">Routing breakdown: {breakdown}</p>
<div class="controls"><input id="search" type="search" placeholder="Search enquiries..." aria-label="Search enquiries">
<select id="category" aria-label="Filter category"><option value="">All categories</option>
<option value="quotation">Quotation</option><option value="appointments">Appointments</option>
<option value="support">Support</option><option value="services">Services</option><option value="general">General</option><option value="privacy">Privacy</option></select>
<select id="priority" aria-label="Filter priority"><option value="">All priorities</option>
<option value="high">High</option><option value="medium">Medium</option><option value="normal">Normal</option></select></div>
<p id="empty">No enquiries match these filters.</p>
<section class="list" id="enquiries">{''.join(cards)}</section>
<footer>This report is generated from sample_data/enquiries.csv by the Aerie pilot. All classifications and drafts are suggestions and require review. No network connection or personal data is required.</footer>
</main>
<script>
const controls=['search','category','priority'].map(id=>document.getElementById(id));
const cards=[...document.querySelectorAll('.enquiry')];
function filterCards(){{
const [query,cat,priority]=controls.map(x=>x.value.toLowerCase().trim());
let count=0;
for(const card of cards){{
const visible=(!query||card.textContent.toLowerCase().includes(query))
&&(!cat||card.dataset.category===cat)&&(!priority||card.dataset.priority===priority);
card.hidden=!visible;if(visible)count++;
}}
document.getElementById('empty').style.display=count?'none':'block';
}}
controls.forEach(c=>c.addEventListener('input',filterCards));
</script></body></html>"""


def main() -> None:
    with INPUT.open(encoding="utf-8", newline="") as source:
        records = process_rows(list(csv.DictReader(source)))
    OUTPUT.mkdir(exist_ok=True)
    (OUTPUT / "report.json").write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    (OUTPUT / "dashboard.html").write_text(render_dashboard(records), encoding="utf-8")
    counts = Counter(r["category"] for r in records)
    summary = [
        "# Aerie pilot — enquiry review",
        "",
        f"- Sample enquiries processed: {len(records)}",
        f"- High-priority cases flagged: {sum(r['priority'] == 'high' for r in records)}",
        f"- Drafts requiring review: {len(records)}",
        "",
        "## By category",
        *(f"- {name}: {count}" for name, count in sorted(counts.items())),
        "",
        "No external messages were sent. Sample data only.",
    ]
    (OUTPUT / "summary.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print(f"Aerie pilot: {len(records)} samples, {len(records)} drafts, "
          f"{sum(r['priority'] == 'high' for r in records)} high priority; no messages sent.")


if __name__ == "__main__":
    main()
