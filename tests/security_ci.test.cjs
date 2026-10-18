/* Security guardrails for this prototype. Static tests are not a security audit. */
"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/aerie-demo.yml"), "utf8");
const lab = fs.readFileSync(path.join(root, "pilot/index.html"), "utf8");
const scripts = ["engine.js", "csv.js", "app.js"];

test("CI runs with read-only permissions and no persisted checkout credentials", () => {
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /persist-credentials:\s*false/);
  assert.doesNotMatch(workflow, /pull_request_target/);
  assert.doesNotMatch(workflow, /\$\{\{\s*secrets\./);
  const uses = Array.from(workflow.matchAll(/\buses:\s*(actions\/[\w-]+)@([^\s#]+)/g));
  assert.ok(uses.length >= 3);
  for (const [,action,sha] of uses) {
    assert.match(sha, /^[a-f0-9]{40}$/, action + " is not SHA-pinned");
  }
});

test("fictional browser Lab cannot connect to services and loads only expected scripts", () => {
  for (const policy of ["default-src 'none'", "connect-src 'none'", "form-action 'none'", "script-src 'self'", "base-uri 'none'"]) {
    assert.ok(lab.includes(policy), "Missing policy " + policy);
  }
  const sources = Array.from(lab.matchAll(/<script[^>]*src="([^"]+)"/g), m => m[1]);
  assert.deepEqual(sources, scripts);
  assert.doesNotMatch(lab, /<script(?![^>]*\bsrc=)[^>]*>/i);
});

test("public static pages forbid scripts and outgoing connections", () => {
  for (const file of ["index.html", "privacy.html"]) {
    const page = fs.readFileSync(path.join(root, file), "utf8");
    for (const policy of ["default-src 'none'", "script-src 'none'", "connect-src 'none'", "form-action 'none'"]) {
      assert.ok(page.includes(policy), file + ": missing " + policy);
    }
    assert.doesNotMatch(page, /<script\b/i, file + ": unexpected JavaScript");
  }
});

test("customer text is not interpreted as HTML or executed from the demo", () => {
  const app = fs.readFileSync(path.join(root, "pilot/app.js"), "utf8");
  const engine = fs.readFileSync(path.join(root, "pilot/engine.js"), "utf8");
  const exporter = fs.readFileSync(path.join(root, "pilot/csv.js"), "utf8");
  for (const code of [app, engine, exporter]) {
    assert.doesNotMatch(code, /\beval\s*\(|\bnew\s+Function\s*\(/);
    assert.doesNotMatch(code, /\.innerHTML\s*=/);
  }
  assert.match(app, /AerieCsv\.rows\(entries\)/);
  assert.doesNotMatch(app, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
});
