/* Aerie local-first browser pilot. Offline rules; no APIs, storage or outbound actions. */
(function (root) {
  "use strict";
  const patterns = {
    privacy: /\b(?:unsubscribe|gdpr|opt out|stop emailing|data subject request)\b|\b(?:delete|erase|remove) (?:my|our) (?:(?:account|personal) )?(?:data|information|details)\b|\bstop (?:sending me|contacting me with) (?:marketing |promotional )?(?:messages|emails)\b|\bremove my (?:details|email|address) from (?:your |the )?(?:mailing|marketing|contact) list\b|\b(?:i )?no longer (?:wish|want) to receive (?:promotional|marketing) (?:messages|emails)\b/i,
    quotation: /\b(?:quote|quotation|estimate|pricing|price|cost|budget)\b/i,
    appointments: /\b(?:appointment|booking|book|schedule|meeting|consultation|reschedule)\b|\b(?:have|arrange|book|schedule)\s+(?:a\s+)?(?:video\s+)?call\b/i,
    support: /\b(?:broken|fault|issue|problem|refund|complaint|error|cancel|cancellation|outage|offline|failed|stopped|down|declined)\b|\b(?:not working|aren['’]?t working|isn['’]?t working|can['’]?t pay|cannot pay|won['’]?t accept|can['’]?t process)\b/i,
    services: /\b(?:services|offer|provide|specialise|capabilities|leads|enquiries)\b/i
  };
  const systemTerm = "(?:checkout|website|site|system|payments?|tills?|cash registers?|registers?|card terminals?|pos)";
  const failureTerm = "(?:down|broken|stopped|failed|failing|offline|error|unavailable|not working|aren['’]?t working|isn['’]?t working|can['’]?t pay|cannot pay|won['’]?t accept|can['’]?t process|declined)";
  const outage = new RegExp("\\b" + systemTerm + "\\b.{0,65}\\b" + failureTerm + "\\b|\\b" + failureTerm + "\\b.{0,65}\\b" + systemTerm + "\\b", "i");
  const highPriority = /\b(?:urgent(?:ly)?|asap|emergency|immediate(?:ly)?|today|critical)\b|\bright now\b/i;
  const mediumPriority = /\b(?:tomorrow|this week|next week|soon|deadline)\b|\b(?:by|next|this) (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const email = /\b[A-Za-z0-9.!#$%&'*+/=?^_{}|~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+\b/g;
  const url = /\bhttps?:\/\/[^\s<>"']+/gi;
  const secret = /\b(?:password|passwd|api[_ -]?key|access[_ -]?token|secret|otp)\s*(?::|=|\bis\b)\s*["']?[^\s,;"']{4,}/gi;
  const bearer = /\bBearer\s+[A-Za-z0-9._~+/-]{10,}=*/gi;
  const identity = /\b(?:PPSN|passport number|IBAN)\s*[:=]\s*[^\s,;]{4,}/gi;
  const privateKey = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi;
  const paymentCandidate = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g;

  function luhn(s) {
    const digits = s.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    for (let i = digits.length - 1, index = 0; i >= 0; i--, index++) {
      let n = Number(digits[i]);
      if (index % 2) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }
  function redact(input) {
    if (typeof input !== "string") throw new TypeError("Enquiry must be text");
    const flags = new Set();
    let text = input.slice(0, 3000);
    function replace(pattern, label, replacement, allowed) {
      text = text.replace(pattern, function (match) {
        if (allowed && !allowed(match)) return match;
        flags.add(label);
        return replacement;
      });
    }
    replace(privateKey, "private_key", "[private key removed]");
    replace(bearer, "credential", "[credential removed]");
    replace(secret, "credential", "[credential removed]");
    replace(identity, "identity_reference", "[identity reference removed]");
    replace(email, "email", "[email removed]");
    replace(url, "link", "[link removed]");
    replace(paymentCandidate, "payment_card", "[payment card removed]", luhn);
    return { text: text.trim(), flags: Array.from(flags).sort() };
  }
  function classify(text) {
    if (patterns.privacy.test(text)) return "privacy";
    if (patterns.support.test(text) && outage.test(text)) return "support";
    for (const category of ["quotation", "appointments", "support", "services"]) {
      if (patterns[category].test(text)) return category;
    }
    return "general";
  }
  function priority(text) {
    if (highPriority.test(text)) return "high";
    if (mediumPriority.test(text)) return "medium";
    return "normal";
  }
  const toolNames = {
    quotation: "Quote intake", appointments: "Appointment intake", support: "Incident triage",
    privacy: "Privacy review", services: "Service matching", general: "General review"
  };
  const nextSteps = {
    quotation: ["Verify scope, measurements, location and timing", "Prepare an internal cost estimate for review"],
    appointments: ["Confirm purpose and preferred timing", "Check actual availability manually before proposing a slot"],
    support: ["Record symptoms and time of incident", "Escalate to a human; do not claim the issue is resolved"],
    privacy: ["Flag for the data controller", "Review the request securely; never auto-delete records"],
    services: ["Understand the business workflow", "Suggest a small, fictional-data pilot before a real rollout"],
    general: ["Confirm the request", "Check verified business information before replying"]
  };
  function draft(category, text) {
    if (category === "privacy") return "Thank you for contacting us about your privacy preferences. Your request requires secure human review. Please do not send passwords or identity documents through this form.";
    if (category === "support") return "Thank you for reporting this issue. Can you describe the error you see and when it began, without sharing passwords or payment details? A team member needs to assess the issue; no fix or pricing is confirmed.";
    if (category === "quotation") return "Thank you for your quotation enquiry. Could you confirm the scope, location, measurements and ideal timing? We can review the details before preparing an estimate. No price or booking is confirmed.";
    if (category === "appointments") return "Thank you for your appointment enquiry. Please let us know the meeting purpose and suitable dates or times. Availability will be confirmed by a team member.";
    if (category === "services") return "Thanks for asking about our services. What kind of business do you run, and which repetitive task would help you most to automate? We can explore a suitable pilot.";
    return "Thanks for getting in touch. Could you share a little more about what you need and your preferred timeline? A team member will review your request.";
  }
  function evaluate(input) {
    const cleaned = redact(input);
    if (!cleaned.text) throw new Error("Please provide a fictional enquiry.");
    const category = classify(cleaned.text);
    const level = priority(cleaned.text);
    const manual = cleaned.flags.length > 0 || category === "support" || category === "privacy";
    const secondary = category === "support" && patterns.quotation.test(cleaned.text)
      ? ["Record secondary quotation request after the reported fault has been assessed"] : [];
    return {
      category: category,
      priority: level,
      message: cleaned.text,
      redactionFlags: cleaned.flags,
      tool: toolNames[category],
      steps: nextSteps[category].concat(secondary),
      draft: draft(category, cleaned.text),
      route: manual ? "Human review" : "Local rules",
      approvalRequired: true,
      externalModelCalls: 0,
      externalActions: 0,
      measuredEnergy: null
    };
  }
  function quoteEstimate(values) {
    const names = ["hours", "rate", "materials", "overheads", "markup"];
    const nums = {};
    for (const key of names) {
      const value = values[key];
      if (value === "" || value == null) throw new Error("Missing field: " + key);
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0 || num > 1000000) throw new Error("Invalid " + key);
      nums[key] = num;
    }
    if (nums.markup > 500) throw new Error("Markup must be 500% or less.");
    const money = function (n) { return Math.round((n + Number.EPSILON) * 100) / 100; };
    const labor = money(nums.hours * nums.rate);
    const subtotal = money(labor + nums.materials + nums.overheads);
    const markup = money(subtotal * nums.markup / 100);
    return {
      currency: "EUR", labor: labor, subtotal: subtotal, markup: markup,
      total: money(subtotal + markup), approved: false,
      note: "Fictional internal estimate only. VAT and any additional costs are excluded and must be reviewed."
    };
  }
  // Scope prefill is advisory; it cannot invent hours, rates or confirmed prices.
  function quoteIntake(message) {
    const safe = redact(message).text;
    const place = safe.match(/\b(?:in|near|at)\s+(Galway|Limerick|Cork|Dublin|Clare|Ennis|Kilkenny|Sligo|Waterford)\b/i);
    const categories = /\b(?:repair|deck|website|landscaping|installation|carpentry|cleaning|plumbing|maintenance)\b/gi;
    const terms = Array.from(new Set((safe.match(categories) || []).map(x => x.toLowerCase())));
    return { scopeHint: terms.length ? terms.join(" / ") : "", locationHint: place ? place[1] : "",
             currency: "EUR", costsInferred: false, priceAgreed: false, approvalRequired: true };
  }
  const api = { evaluate: evaluate, redact: redact, classify: classify, quoteEstimate: quoteEstimate, quoteIntake: quoteIntake };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.AeriePilot = api;
})(typeof window !== "undefined" ? window : globalThis);
