/* Aerie local-first security/efficiency guardrails.
 * Source checks and byte budgets are not a penetration test or energy measurement.
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const fromRoot = p => fs.readFileSync(path.join(root, p), "utf8");
const size = p => fs.statSync(path.join(root, p)).size;
const scripts = ["pilot/engine.js", "pilot/csv.js", "pilot/app.js"];
const publicAssets = ["index.html", "privacy.html", "pilot/index.html", ...scripts];

test("public demo stays within lightweight uncompressed source budgets", () => {
  const jsBytes = scripts.reduce((total, p) => total + size(p), 0);
  const totalBytes = publicAssets.reduce((total, p) => total + size(p), 0);
  assert.ok(jsBytes <= 32 * 1024, "Browser JavaScript over 32 KiB: " + jsBytes);
  assert.ok(totalBytes <= 140 * 1024, "Public source over 140 KiB: " + totalBytes);
});

test("no unnecessary central services, third-party runtime scripts or local persistence", () => {
  const lab = fromRoot("pilot/index.html");
  const homepage = fromRoot("index.html");
  const privacy = fromRoot("privacy.html");
  for (const [name, page] of [["Lab", lab], ["Homepage", homepage], ["Privacy", privacy]]) {
    assert.match(page, /connect-src 'none'/, name + ": network policy changed");
    assert.match(page, /form-action 'none'/, name + ": form policy changed");
    assert.doesNotMatch(page, /<iframe\b/i, name + ": embedded remote content forbidden");
    assert.doesNotMatch(page, /@import\s+/i, name + ": imported style forbidden");
    assert.doesNotMatch(page, /\b(?:src|href)\s*=\s*["'](?:https?:)?\/\//i, name + ": remote assets forbidden");
  }
  assert.match(homepage, /script-src 'none'/);
  assert.match(privacy, /script-src 'none'/);
  assert.match(lab, /script-src 'self'/);
  const declared = Array.from(lab.matchAll(/<script[^>]*\bsrc="([^"]+)"/g), x => x[1]);
  assert.deepEqual(declared, ["engine.js", "csv.js", "app.js"]);
  for (const p of scripts) {
    const contents = fromRoot(p);
    assert.doesNotMatch(contents, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b\s*(?:\(|\.)/i, p + ": network code added");
    assert.doesNotMatch(contents, /\b(?:localStorage|sessionStorage|indexedDB|caches)\b/i, p + ": storage requires a privacy design");
    assert.doesNotMatch(contents, /\b(?:eval|importScripts)\s*\(/i, p + ": executable loader");
  }
});

test("fictional local decisions require approval and never request AI/network actions", () => {
  const pilot = require("../pilot/engine.js");
  const fixtures = [
    "Our checkout stopped working urgently and we also need a quote.",
    "Please unsubscribe me from marketing.",
    "Could I get a price for a timber deck repair?",
    "Can we arrange a meeting for next week?",
  ];
  for (const message of fixtures) {
    const result = pilot.evaluate(message);
    assert.equal(result.externalModelCalls, 0);
    assert.equal(result.externalActions, 0);
    assert.equal(result.approvalRequired, true);
    assert.equal(result.measuredEnergy, null);
  }
});
