"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const lab = fs.readFileSync(path.join(root, "pilot", "index.html"), "utf8");

test("Aerie homepage retains original brand assets", () => {
  assert.match(home, /Aerie nest sheltered by a mountain at sunset/);
  assert.match(home, /Aerie abstract cliff and nest emblem/);
  assert.equal((home.match(/data:image\//g) || []).length, 2);
  for (const color of ["#102d47", "#173f67", "#7c2539", "#d87050"]) {
    assert.ok(home.includes(color), "Missing brand color "+color);
  }
});

test("Homepage is clear about real product limitations", () => {
  assert.match(home, /experimental/i);
  assert.match(home, /fictional-data demo/i);
  assert.match(home, /not yet available/i);
  assert.match(home, /No messages are sent/i);
  assert.match(home, /not a claim of end-to-end encryption/i);
  assert.doesNotMatch(home, /id="lead-form"/);
});

test("Main site navigation and Lab anchors exist", () => {
  for (const id of ["main", "services", "lab", "tools", "how", "contact"]) {
    assert.ok(home.includes('id="'+id+'"'), "Missing main page anchor: "+id);
  }
  for (const id of ["enquiries", "review", "quote"]) {
    assert.ok(lab.includes('id="'+id+'"'), "Missing Lab section: "+id);
  }
  assert.ok(home.includes('href="pilot/"'));
  assert.ok(home.includes('href="pilot/#enquiries"'));
  assert.ok(home.includes('href="pilot/#quote"'));
});

test("All local HTML page and asset links resolve in repository", () => {
  for (const [html, folder] of [[home,root], [lab,path.join(root,"pilot")]]) {
    const matches = html.matchAll(/\b(?:href|src)="([^"]+)"/g);
    for (const match of matches) {
      const url = match[1];
      if (!url || url.startsWith("#") || url.startsWith("data:") || /^(?:https?:|mailto:)/i.test(url)) continue;
      const plain = url.split("#")[0].split("?")[0];
      if (!plain) continue;
      const target = path.resolve(folder, plain);
      assert.ok(target.startsWith(root), "Unexpected path outside repository: "+plain);
      assert.ok(fs.existsSync(target), "Missing local link: "+plain);
    }
  }
});

test("Accessible keyboard skip link and mobile-friendly styles", () => {
  assert.match(home, /class="skip-link" href="#main"/);
  assert.match(home, /a:focus-visible/);
  assert.match(home, /@media\(max-width:750px\)/);
});

test("Aerie Lab remains deliberately isolated from external systems", () => {
  assert.match(lab, /connect-src 'none'/);
  assert.match(lab, /form-action 'none'/);
  assert.match(lab, /Fictional-data laboratory only/);
  assert.match(lab, /No paid model calls/);
});


test("Commercial offer distinguishes tools from planned tailored services", () => {
  assert.match(home, /DIGITAL PRODUCTS/);
  assert.match(home, /AUTOMATION SERVICES/);
  assert.match(home, /Tools you can use yourself/);
  assert.match(home, /Workflows tailored to your business/);
  assert.match(home, /Products not yet for sale/);
  assert.match(home, /Not currently taking on paying clients/);
  assert.match(home, /Aerie Lab is our free demonstration space—not a paid service/);
});

test("Homepage explains the task and gives a useful next step above the fold", () => {
  assert.match(home, /Less admin/);
  assert.match(home, /manage customer enquiries, prepare quotations and keep work organised/);
  assert.match(home, /See what Aerie offers/);
  assert.match(home, /Try our free demos/);
  assert.match(home, /Commercial products and setup services are in development/);
});
