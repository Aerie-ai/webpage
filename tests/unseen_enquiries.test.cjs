/* Independent fictional routing checks shared with Python; no third-party packages. */
"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const pilot = require("../pilot/engine.js");

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, "../sample_data/unseen_enquiries.json"), "utf8"));

test("fictional unseen-style routing and human-approval constraints", () => {
  assert.ok(cases.length >= 15);
  for (const c of cases) {
    const actual = pilot.evaluate(c.message);
    assert.equal(actual.category, c.category, c.id + ": category");
    assert.equal(actual.priority, c.priority, c.id + ": priority");
    if (Object.hasOwn(c, "possible_outage")) {
      assert.equal(actual.category === "support" && pilot.classify(c.message) === "support", true, c.id + ": incident recognised");
    }
    assert.equal(actual.approvalRequired, true, c.id + ": review");
    assert.equal(actual.externalActions, 0, c.id + ": no actions");
    assert.equal(actual.externalModelCalls, 0, c.id + ": no model");
    assert.doesNotMatch(actual.draft, /your appointment is booked|refund approved|we fixed your/i, c.id);
  }
});

test("checkout failure phrase is triaged ahead of price enquiry", () => {
  const r = pilot.evaluate("Our payment system isn't working and we also need an estimate.");
  assert.equal(r.category, "support");
  assert.ok(r.steps.some(s => /secondary quotation/.test(s)));
});
