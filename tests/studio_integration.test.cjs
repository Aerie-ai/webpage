/* Aerie Studio integration and safety checks, without browser dependencies. */
"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const studio=fs.readFileSync(path.join(root,"studio/index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"studio/app.js"),"utf8");
const products=fs.readFileSync(path.join(root,"studio/products.js"),"utf8");
const energy=fs.readFileSync(path.join(root,"studio/engine.js"),"utf8");

test("all six concrete tools are on the Studio page with working UI hooks",()=>{
  for(const section of ["flow","energy","quote","follow","field","guardian"]){
    assert.match(studio,new RegExp('id="'+section+'"'));
    assert.match(studio,new RegExp('href="#'+section+'"'));
  }
  for(const button of ["flowGo","energyGo","energyAdd","energyPortfolioCsv","energyReset","computeGo","quoteGo","quoteCsv","followGo","followAdd","followCsv","followClear","fieldGo","fieldCsv","guardianGo"]){
    assert.match(studio,new RegExp('id="'+button+'"'));
    assert.match(app,new RegExp('\\$\\("'+button+'"\\)'));
  }
  assert.match(studio,/Fictional,|fictional-data tools only/i);
  assert.match(studio,/no cloud calls/i);
});

test("all local Studio script dependencies resolve in order",()=>{
  const actual=Array.from(studio.matchAll(/<script[^>]*src="([^"]+)"/g),m=>m[1]);
  assert.deepEqual(actual,["../pilot/engine.js","../pilot/csv.js","engine.js","products.js","app.js"]);
  for(const source of actual) assert.ok(fs.existsSync(path.resolve(root,"studio",source)),source);
});

test("Studio is closed to network, external resources, live input and persistent storage",()=>{
  for(const policy of ["default-src 'none'","connect-src 'none'","form-action 'none'","script-src 'self'","base-uri 'none'"]){
    assert.ok(studio.includes(policy),policy);
  }
  for(const code of [app,energy,products]){
    assert.doesNotMatch(code,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource)\s*\(/);
    assert.doesNotMatch(code,/\b(?:localStorage|sessionStorage|indexedDB)\b/);
    assert.doesNotMatch(code,/\.innerHTML\s*=/);
    assert.doesNotMatch(code,/\beval\s*\(/);
  }
  assert.doesNotMatch(studio,/<form\b/i);
  assert.doesNotMatch(studio,/<iframe\b/i);
  assert.doesNotMatch(studio,/<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(studio,/\b(?:src|href)\s*=\s*["']https?:\/\//i);
});

test("exports go through shared guarded CSV module, not raw cell interpolation",()=>{
  assert.match(app,/AerieCsv\.rows\(rows\)/);
  assert.match(app,/URL\.createObjectURL\(blob\)/);
  assert.match(studio,/Nothing is actually sent or scheduled/);
});

test("navigation makes the Studio discoverable without replacing the Lab",()=>{
  const home=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const lab=fs.readFileSync(path.join(root,"pilot/index.html"),"utf8");
  assert.match(home,/href="studio\/"/);
  assert.match(lab,/href="\.\.\/studio\/"/);
  assert.match(home,/href="pilot\/"/);
});
