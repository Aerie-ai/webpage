"""Independent acceptance checks for Aerie's fictional customer pilot.

All scenarios are synthetic. This verifies deterministic behavior, NOT AI accuracy
on real-world enquiries, customer satisfaction, or completed external actions.
"""
from __future__ import annotations
import json
from pathlib import Path
from run import process_enquiry, render_dashboard

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "sample_data" / "mock_clients.json"
OUTPUT = ROOT / "output"

def evaluate(case: dict) -> dict:
    result = process_enquiry({
        "id": case["id"],
        "message": case["message"],
        "quote_inputs": case.get("quote_inputs"),
    })
    action = result["suggested_action"]
    checks = {
        "route": result["category"] == case["expected_category"],
        "priority": result["priority"] == case["expected_priority"],
        "tool_selected": action["tool"] == case["expected_tool"],
        "human_review": result["review_required"] and action["human_review_required"],
        "no_external_actions": action["automated_external_actions"] == 0 and action["status"] == "suggested_only",
        "no_unapproved_promise": not any(fragment in result["draft"].lower() for fragment in [
            "we fixed", "has been fixed", "the issue is fixed", "your appointment is booked",
            "confirmed booking", "refund approved", "guarantee", "the price is €250", "€250",
        ]),
    }
    if "expected_estimate" in case:
        checks["internal_quote_math"] = action.get("estimate", {}).get("internal_estimate") == case["expected_estimate"]
        checks["quote_remains_unapproved"] = action.get("estimate", {}).get("approval_required") is True
    if "expected_location" in case:
        checks["location_extracted"] = action["extracted"].get("location_mentioned") == case["expected_location"]
    if "expected_weekday" in case:
        checks["weekday_captured"] = action["extracted"].get("requested_weekday") == case["expected_weekday"]
    if "expected_concept" in case:
        checks["service_concept"] = action["extracted"].get("suggested_concept") == case["expected_concept"]
    if "expected_outage" in case:
        checks["outage_triage"] = action["extracted"].get("possible_outage") == case["expected_outage"]
    if "required_next_step" in case:
        checks["secondary_need_recorded"] = case["required_next_step"].lower() in " ".join(action["next_steps"]).lower()
    return {
        "id": case["id"], "fake_client": case["fake_client"],
        "pass": all(checks.values()),
        "checks": checks,
        "classification": result["category"],
        "priority": result["priority"],
        "tool": action["tool"],
        "draft": result["draft"],
        "tool_output": action,
        "source_issue": case.get("source_issue"),
    }

def main() -> None:
    cases = json.loads(INPUT.read_text(encoding="utf-8"))
    if not cases or len({case["id"] for case in cases}) != len(cases):
        raise ValueError("Expected non-empty mock cases with unique ids")
    results = [evaluate(case) for case in cases]
    total_checks = sum(len(r["checks"]) for r in results)
    passed_checks = sum(sum(r["checks"].values()) for r in results)
    passed_cases = sum(r["pass"] for r in results)
    OUTPUT.mkdir(exist_ok=True)
    payload = {
        "fixture_count": len(cases),
        "passed_cases": passed_cases,
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "all_passed": passed_cases == len(cases),
        "caveat": "Synthetic expectation checks only. No live client, AI model, delivery, booking or service execution tested.",
        "results": results,
    }
    (OUTPUT / "mock_clients_results.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    markdown = [
        "# Aerie — mock client acceptance test", "",
        f"**Scenarios:** {passed_cases}/{len(cases)} passed",
        f"**Assertions:** {passed_checks}/{total_checks} passed", "",
        "| Fake client | Classification | Tool | Result |",
        "| --- | --- | --- | --- |",
        *(
            f'| {r["fake_client"]} | {r["classification"]} ({r["priority"]}) | '
            f'{r["tool"]} | {"PASS" if r["pass"] else "FAIL"} |'
            for r in results
        ),
        "",
        "## What this does *not* prove",
        "- These are fictional fixtures, not real customer feedback.",
        "- Classification is keyword-based, not genuine language-model understanding.",
        "- No external tools were used to send messages, make bookings, fix faults or issue quotes.",
        "- Human review is still required for every response.",
        "",
        "## Failed checks",
    ]
    for r in results:
        for check_name, passed in r["checks"].items():
            if not passed:
                markdown.append(f'- **{r["id"]}** {check_name}')
    if all(r["pass"] for r in results):
        markdown.append("- None in this test set")
    (OUTPUT / "mock_clients_results.md").write_text("\n".join(markdown) + "\n", encoding="utf-8")
    enriched = [process_enquiry({
        "id": case["id"], "message": case["message"],
        "quote_inputs": case.get("quote_inputs"),
    }) for case in cases]
    (OUTPUT / "mock_clients_dashboard.html").write_text(render_dashboard(enriched), encoding="utf-8")
    print(f"Mock-client evaluation: {passed_cases}/{len(cases)} cases, "
          f"{passed_checks}/{total_checks} assertions passed")
    for r in results:
        print(f'{r["id"]}: {"PASS" if r["pass"] else "FAIL"} -> '
              f'{r["classification"]} / {r["priority"]} / {r["tool"]}')
        if not r["pass"]:
            print("  Failed:", [k for k, v in r["checks"].items() if not v])
    if passed_cases != len(cases):
        raise SystemExit("Mock-client acceptance evaluation failed. Inspect mock_clients_results.md.")

if __name__ == "__main__":
    main()
