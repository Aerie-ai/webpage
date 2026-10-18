/* Aerie Studio business products: fictional, local-only decision support.
 * No actions, storage, external AI, access to real customer systems or compliance certification.
 */
(function (root) {
  "use strict";
  const round = x => Math.round((x + Number.EPSILON) * 100) / 100;
  function count(name, raw, lower, upper) {
    if (raw === "" || raw == null || typeof raw === "boolean") throw new RangeError(name + " is required");
    const n = Number(raw);
    if (!Number.isFinite(n) || n < lower || n > upper) throw new RangeError(name + " must be between " + lower + " and " + upper);
    return n;
  }
  function cappedText(text, limit) {
    return String(text == null ? "" : text).trim().slice(0, limit);
  }
  function quoteReview(raw, calculator) {
    if (typeof calculator !== "function") throw new TypeError("Local quotation calculator required");
    const result = calculator({
      hours: raw.hours, rate: raw.rate, materials: raw.materials,
      overheads: raw.overheads, markup: raw.markup
    });
    const needs = [];
    if (cappedText(raw.scope, 120).length < 12) needs.push("Confirm exact work scope and deliverables.");
    if (!Boolean(raw.measurements)) needs.push("Confirm measurements, quantities or dimensions.");
    if (!Boolean(raw.access)) needs.push("Confirm site access, constraints and safety considerations.");
    if (!Boolean(raw.timeline)) needs.push("Confirm preferred dates and completion expectations.");
    if (!Boolean(raw.materialsChecked)) needs.push("Check material prices, lead times and availability.");
    const mark = count("Markup", raw.markup, 0, 500);
    return {
      ...result,
      missing: needs,
      readiness: needs.length === 0 ? "Ready for human pricing review" : "Incomplete intake",
      marginPercentBeforeOtherCosts: round(100 * mark / (100 + mark)),
      reviewRequired: true,
      message: "Internal fictional example only. Markup is not the same as profit margin; tax, VAT, unexpected work and contract terms need human review.",
      externalActions: 0,
      modelCalls: 0
    };
  }
  const FOLLOW_STAGES = Object.freeze({
    new: {days: 1, action: "Review the new enquiry and clarify missing requirements."},
    quoted: {days: 4, action: "Check whether the fictional quotation needs questions answered."},
    waiting: {days: 7, action: "Review the outstanding request and decide if any follow-up is appropriate."},
    completed: {days: 0, action: "No follow-up is needed unless a separate legitimate request exists."}
  });
  function followUp(raw) {
    const stage = String(raw.stage || "");
    const policy = FOLLOW_STAGES[stage];
    if (!policy) throw new RangeError("Unknown follow-up stage");
    const elapsed = count("Days elapsed", raw.daysElapsed, 0, 3650);
    const optOut = raw.optOut === true;
    const allowed = raw.contactPermission === true;
    let status = "Draft for human review";
    let suggestion = policy.action;
    if (optOut) {
      status = "Stop — privacy review";
      suggestion = "Respect the recorded opt-out. Check the request and applicable contact rules; do not automatically message.";
    } else if (!allowed) {
      status = "Hold — permission unclear";
      suggestion = "Verify the reason and lawful basis for contact manually. Do not send an unsolicited message.";
    } else if (stage === "completed") {
      status = "No follow-up suggested";
    } else if (elapsed < policy.days) {
      status = "Not due for review";
    }
    const due = stage !== "completed" && elapsed >= policy.days;
    return {
      stage, daysElapsed: elapsed, reviewThresholdDays: policy.days,
      needsReview: due && !optOut && allowed, status, suggestion,
      reviewOnlyDraft: optOut || !allowed || stage === "completed"
        ? "" : "Hello, following up on our earlier conversation. Please let us know if you need any clarification. We will confirm details before proceeding.",
      externalActions: 0, modelCalls: 0, reviewRequired: true,
      note: "Fictional internal queue. Contact permission is an unverified user-entered flag, not evidence of GDPR or ePrivacy compliance. No messages, bookings or reminders are sent."
    };
  }
  const PACKS = Object.freeze({
    field: {name: "Ecology and field survey", rows: [
      "Confirm permissions, land access and site safety",
      "Review relevant survey method and seasonal limitations",
      "Prepare sampling and calibration equipment",
      "Record original survey times and weather observations",
      "Separate confirmed observations from assumptions",
      "Check specimen/sample identifiers and chain of custody",
      "Review data quality, limitations and follow-up needs"
    ]},
    building: {name: "Contractor site visit", rows: [
      "Confirm work scope, location and site access",
      "Review hazards, PPE and permit requirements",
      "Check measurements, photos and material quantities",
      "Record customer choices needing confirmation",
      "Check plant, tools, transport and waste management",
      "Identify dependencies and quote exclusions",
      "Have the owner review the job notes before quoting"
    ]},
    retail: {name: "Shop operations visit", rows: [
      "Confirm operating hours and staffing handover",
      "Check stock-count and damaged-item process",
      "Review energy-consuming equipment schedules safely",
      "Confirm returns and consumer-rights escalation process",
      "Identify unanswered enquiries and manual follow-ups",
      "Review cash handling and access permissions",
      "List operational improvements for owner review"
    ]},
    maintenance: {name: "Equipment maintenance visit", rows: [
      "Confirm asset identifier and authorised access",
      "Review isolation, manufacturer guidance and safety",
      "Document symptoms without entering passwords",
      "Record inspection findings and tests completed",
      "Check parts, warranty and repair approval requirements",
      "Identify energy or downtime impacts without inventing them",
      "Obtain owner sign-off before external actions"
    ]}
  });
  function fieldPack(type) {
    if (!Object.prototype.hasOwnProperty.call(PACKS, type)) throw new RangeError("Unknown field pack");
    const p = PACKS[type];
    return {
      title: p.name, items: p.rows.map((text, index) => ({
        step: index + 1, text, checked: false
      })),
      reviewRequired: true, externalActions: 0, modelCalls: 0,
      note: "Generic fictional checklist, not site-specific professional advice, a regulatory survey, or an approved RAMS."
    };
  }
  const CHECKS = Object.freeze([
    {id:"mfa", label:"Owners and staff use MFA or passkeys", action:"Enable strong sign-in and recovery procedures.", weight:3},
    {id:"separate", label:"Every worker has an individual account", action:"Remove shared logins and restrict access by role.", weight:3},
    {id:"restore", label:"A backup was successfully restored in a test", action:"Test encrypted backup recovery and key access.", weight:3},
    {id:"updates", label:"Devices and software receive timely updates", action:"Adopt a patching and update routine.", weight:2},
    {id:"export", label:"Customer records and exports are access-controlled", action:"Review sharing links, device access and record exports.", weight:3},
    {id:"privacy", label:"Customer data has a defined retention and deletion policy", action:"Document why data is kept and when it is deleted.", weight:2},
    {id:"ai", label:"AI tools never receive confidential inputs without approval", action:"Review AI provider terms, prompts and approval workflow.", weight:3},
    {id:"incident", label:"Staff know how to report an incident or lost device", action:"Prepare a short incident response and device revocation plan.", weight:2}
  ]);
  function guardian(raw) {
    const values = raw || {};
    let riskWeight = 0, maxWeight = 0;
    const findings = CHECKS.map(check => {
      const response = String(values[check.id] || "unknown");
      if (!["yes", "no", "unknown"].includes(response)) throw new RangeError("Invalid security response");
      maxWeight += check.weight;
      if (response !== "yes") riskWeight += check.weight;
      return {
        id: check.id, label: check.label, response,
        status: response === "yes" ? "Self-reported" : response === "no" ? "Needs attention" : "Unverified",
        action: check.action, weight: check.weight
      };
    });
    return {
      findings, notConfirmedWeightPercent: round(100 * riskWeight / maxWeight),
      priorityActions: findings.filter(x => x.response !== "yes").sort((a, b) => b.weight - a.weight).slice(0, 4),
      verifiedSecurity: false, reviewRequired: true, externalActions: 0, modelCalls: 0,
      note: "Self-assessment only. Answers and the weighted attention score are not independent verification, vulnerability scanning, a security certificate or a prediction of breach risk."
    };
  }
  const api = Object.freeze({quoteReview, followUp, fieldPack, guardian, guardianChecks: CHECKS.map(x => ({...x}))});
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.AerieProducts = api;
})(typeof window !== "undefined" ? window : globalThis);
