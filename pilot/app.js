/* Aerie Lab UI: fictional data, in-memory decisions, no network or storage. */
(function () {
  "use strict";
  const $ = function (id) { return document.getElementById(id); };
  const examples = [
    "Our online checkout stopped working today, this is urgent. We also need a quote for a website update next month. Can you confirm the fix and a €250 price?",
    "Could you give a quote for a timber deck repair in Galway next month? It needs three replacement boards.",
    "Can I book an appointment next Thursday afternoon to discuss our intake workflow?",
    "We're losing enquiries on social media. What services do you offer to help?",
    "Please unsubscribe me and delete my data. I don't want any further messages.",
    "What are your opening hours and how do I find out more about your business?"
  ];
  let originalDraft = "";
  let lastQuote = null;
  function setReview(text) { $("reviewStatus").textContent = text; }
  function euro(number) { return new Intl.NumberFormat("en-IE", {style:"currency",currency:"EUR"}).format(number); }
  function resetReview() {
    originalDraft = "";
    $("draft").disabled = true;
    $("draft").value = "";
    $("approve").disabled = true;
    $("reject").disabled = true;
    $("revise").disabled = true;
    setReview("Waiting for a fictional enquiry");
    $("analysis").classList.add("hidden");
  }
  $("case").addEventListener("change", function () {
    const i = $("case").value;
    $("message").value = i === "" ? "" : examples[Number(i)];
    resetReview();
  });
  $("message").addEventListener("input", resetReview);
  $("clear").addEventListener("click", function () {
    $("case").value = "";
    $("message").value = "";
    resetReview();
    $("message").focus();
  });
  $("analyse").addEventListener("click", function () {
    try {
      const info = AeriePilot.evaluate($("message").value);
      $("analysis").classList.remove("hidden");
      $("category").textContent = info.category;
      $("priority").textContent = info.priority + " priority";
      $("priority").className = "status " + info.priority;
      $("tool").textContent = info.tool;
      $("route").textContent = info.route;
      $("redactions").textContent = info.redactionFlags.length ? info.redactionFlags.join(", ") : "None detected (not a guarantee)";
      $("aiCalls").textContent = String(info.externalModelCalls);
      if (info.category === "quotation" || info.steps.some(function (step) { return step.includes("secondary quotation"); })) {
        const intake = AeriePilot.quoteIntake(info.message);
        if (intake.scopeHint && !$("jobScope").value.trim()) $("jobScope").value = intake.scopeHint;
        if (intake.locationHint && !$("jobLocation").value.trim()) $("jobLocation").value = intake.locationHint;
        quoteChanged();
      }
      const steps = $("steps");
      steps.replaceChildren();
      info.steps.forEach(function (step) {
        const li = document.createElement("li");
        li.textContent = step; // No untrusted innerHTML.
        steps.appendChild(li);
      });
      originalDraft = info.draft;
      $("draft").value = originalDraft;
      $("draft").disabled = false;
      $("approve").disabled = false;
      $("reject").disabled = false;
      $("revise").disabled = false;
      setReview("Awaiting human decision — no message sent");
    } catch (error) {
      resetReview();
      setReview(error.message || "Could not classify the fictional message.");
    }
  });
  $("draft").addEventListener("input", function () {
    if (!this.disabled) setReview("Edited — requires a new approval");
  });
  $("approve").addEventListener("click", function () {
    if ($("draft").disabled || !$("draft").value.trim()) return;
    setReview("Approved in this browser session only — NOT SENT");
  });
  $("reject").addEventListener("click", function () {
    if ($("draft").disabled) return;
    setReview("Draft rejected — NOT SENT");
  });
  $("revise").addEventListener("click", function () {
    if ($("draft").disabled) return;
    $("draft").value = originalDraft;
    setReview("Draft restored — requires human approval");
  });
  function getQuoteFields() {
    const result = {};
    [["hours","hours"],["rate","rate"],["materials","materials"],["overheads","overheads"],["markup","markup"]].forEach(function (entry) {
      result[entry[0]] = $(entry[1]).value;
    });
    return result;
  }
  function quoteChanged() {
    lastQuote = null;
    $("export").disabled = true;
    $("quoteStatus").textContent = "Inputs changed. Calculate again before exporting.";
  }
  ["jobScope","jobLocation","hours","rate","materials","overheads","markup"].forEach(function (id) {
    $(id).addEventListener("input", quoteChanged);
  });
  $("calculate").addEventListener("click", function () {
    try {
      lastQuote = AeriePilot.quoteEstimate(getQuoteFields());
      $("labor").textContent = euro(lastQuote.labor);
      $("subtotal").textContent = euro(lastQuote.subtotal);
      $("markupAmount").textContent = euro(lastQuote.markup);
      $("total").textContent = euro(lastQuote.total);
      $("quoteStatus").textContent = "Fictional internal estimate; VAT and contractual terms are NOT included. Never sent.";
      $("export").disabled = false;
    } catch (error) {
      lastQuote = null;
      $("export").disabled = true;
      $("total").textContent = "€—";
      $("quoteStatus").textContent = error.message || "Invalid example values";
    }
  });
  $("export").addEventListener("click", function () {
    if (!lastQuote) return;
    const quote = getQuoteFields();
    // Neutralize formula execution on opening CSV with spreadsheet software.
    function cell(value) {
      const raw = String(value == null ? "" : value).replace(/[\r\n\t]/g, " ").slice(0, 250);
      const safe = /^[\s]*[=+\-@]/.test(raw) ? "'" + raw : raw;
      return '"' + safe.replace(/"/g, '""') + '"';
    }
    const entries = [
      ["Field","Value"],
      ["Kind","FICTIONAL INTERNAL ESTIMATE - NOT APPROVED"],
      ["Scope", $("jobScope").value],
      ["Location", $("jobLocation").value],
      ["Labour hours", quote.hours],
      ["Hourly rate EUR", quote.rate],
      ["Labour cost EUR", lastQuote.labor],
      ["Materials EUR", quote.materials],
      ["Overheads EUR", quote.overheads],
      ["Cost subtotal EUR", lastQuote.subtotal],
      ["Markup percent", quote.markup],
      ["Markup amount EUR", lastQuote.markup],
      ["Internal estimated total EUR", lastQuote.total],
      ["Disclaimer", lastQuote.note]
    ];
    const csv = entries.map(function (row) { return row.map(cell).join(","); }).join("\r\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "aerie-fictional-quote.csv";
    a.click();
    URL.revokeObjectURL(downloadUrl);
    $("quoteStatus").textContent = "Fictional spreadsheet CSV generated locally. No upload or sending occurred.";
  });
  resetReview();
})();
