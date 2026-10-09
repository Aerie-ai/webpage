/* Node built-in tests: no install, no dependencies, no model traffic. */
"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const pilot = require("../pilot/engine.js");

test("local enquiry classification and secondary incident priority", () => {
  const result = pilot.evaluate("Our checkout stopped working today. It is urgent, and we also need a quote.");
  assert.equal(result.category, "support");
  assert.equal(result.priority, "high");
  assert.equal(result.tool, "Incident triage");
  assert.ok(result.steps.some(x => x.includes("secondary quotation")));
  assert.doesNotMatch(result.draft, /we have fixed|fixed your|€250 confirmed/i);
  assert.equal(result.externalActions, 0);
  assert.equal(result.externalModelCalls, 0);
  assert.equal(result.approvalRequired, true);
});

test("quote, appointment, privacy and service cases route correctly", () => {
  for (const [message, category] of [
    ["Could I get a quote for a deck?", "quotation"],
    ["I'd like to book a meeting next Thursday.", "appointments"],
    ["Please unsubscribe me", "privacy"],
    ["What services do you offer?", "services"],
    ["Hello there", "general"]
  ]) assert.equal(pilot.evaluate(message).category, category);
});

test("sensitive synthetic fields redacted and routed for review", () => {
  const m = "Please send quote to nobody@example.test, password: fakeSecret789";
  const r = pilot.evaluate(m);
  assert.equal(r.route, "Human review");
  assert.ok(r.redactionFlags.includes("email"));
  assert.ok(r.redactionFlags.includes("credential"));
  assert.doesNotMatch(r.message, /nobody@example\.test|fakeSecret789/);
  assert.equal(r.externalActions, 0);
});

test("fictional card Luhn checks and normal amounts", () => {
  assert.match(pilot.redact("Sample test card 4111 1111 1111 1111").text, /payment card removed/);
  assert.match(pilot.redact("Internal budget €250").text, /€250/);
});

test("estimates match known spreadsheet logic", () => {
  const q = pilot.quoteEstimate({hours:8, rate:35, materials:120, overheads:40, markup:20});
  assert.equal(q.labor, 280);
  assert.equal(q.subtotal, 440);
  assert.equal(q.markup, 88);
  assert.equal(q.total, 528);
  assert.equal(q.approved, false);
});

test("invalid quote inputs rejected rather than silently accepted", () => {
  const good = {hours:8, rate:35, materials:120, overheads:40, markup:20};
  for (const [field,value] of [["hours",""],["rate",-1],["materials","NaN"],["markup",501]]) {
    assert.throws(() => pilot.quoteEstimate({...good,[field]:value}));
  }
});

test("HTML input remains a plain text field and is not trusted", () => {
  const r = pilot.evaluate('<img src=x onerror=alert(1)> Can I get a quote?');
  assert.equal(r.category,"quotation");
  assert.match(r.message, /<img /);
  assert.equal(r.externalActions,0);
});

test("UI only performs textContent writes and never sends network requests", () => {
  const s = fs.readFileSync(path.join(__dirname,"..","pilot","app.js"),"utf8");
  assert.doesNotMatch(s, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
  assert.doesNotMatch(s, /\.innerHTML\s*=/);
  assert.doesNotMatch(s, /\blocalStorage\b|\bsessionStorage\b/);
  assert.match(s, /NOT SENT/);
  assert.match(s, /application\/|text\/csv/);
});

test("public pilot has a restrictive content security policy", () => {
  const html = fs.readFileSync(path.join(__dirname,"..","pilot","index.html"),"utf8");
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.match(html, /noindex,nofollow/);
});

test("unseen synthetic examples retain manual approval and no model calls", () => {
  const unseen = [
    "Our shop tills aren't working and we need immediate help!",
    "A call at the end of this month would be useful.",
    "We're pricing a new roof repair project.",
    "Is there an automation service for our dog walking business?",
    "Please stop emailing me.",
    "Can your team tell us how you operate?",
    "A refund has not arrived and this has become an issue.",
    "I'd like to schedule a consultation.",
    "Price for a small repair in Clare?",
    "Customers can't use the payment system. It is down today."
  ];
  for (const message of unseen) {
    const r = pilot.evaluate(message);
    assert.equal(r.approvalRequired, true);
    assert.equal(r.externalModelCalls, 0);
    assert.equal(r.externalActions, 0);
    assert.ok(r.draft.length > 30);
  }
});
