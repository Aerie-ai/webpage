/* Defensive regression tests, with invented inputs only. */
"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const csv = require("../pilot/csv.js");

test("formula prefixes cannot become initial spreadsheet cell content", () => {
  const examples = [
    "=1+1", "+2+2", "-2+2", "@SUM(1)", "   =HYPERLINK(\"https://example.invalid\")",
    "\t=1+1", "\r\n+CMD", "\uFEFF=1+1", "\u200B@SUM(1)",
    "\u202E=1+1", "＝1+1", "＋2+2", "－2+2", "＠SUM(1)"
  ];
  for (const value of examples) {
    const cell = csv.cell(value);
    assert.ok(cell.startsWith('"'), "Must quote every cell");
    assert.match(cell, /^"\t\s*[=+\-@]/u, value);
    assert.doesNotMatch(cell, /[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/u.test(cell.slice(2)) ? /[\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/u : /(?!)/u);
  }
});

test("delimiters cannot create extra rows or columns", () => {
  const out = csv.rows([["Scope", '=1+1",\r\n=2+2'], ["Location", "Galway, Ireland"]]);
  assert.equal(out.split("\r\n").length, 2);
  assert.match(out, /""/);
  assert.match(out, /"Galway, Ireland"/);
});

test("ordinary quotes, amounts and harmless text remain legible", () => {
  assert.equal(csv.cell('Repair "small" deck'), '"Repair ""small"" deck"');
  assert.equal(csv.cell("€528.00"), '"€528.00"');
  assert.equal(csv.cell(""), '""');
  assert.equal(csv.rows([["A", "B"]]), '"A","B"');
  assert.throws(() => csv.rows([[1]]), TypeError);
});
