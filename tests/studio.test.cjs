/* Aerie Studio regression suite: synthetic-only numbers and guardrails. */
"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const energy = require("../studio/engine.js");
const products = require("../studio/products.js");
const quote = require("../pilot/engine.js");

test("equipment electricity estimate follows W*hours/1000 and real entered tariff", () => {
  const a = energy.equipmentEstimate({watts:500, units:2, hoursPerDay:8, daysPerWeek:5, weeksPerYear:50, euroPerKwh:.30, hoursReducedPerDay:2});
  assert.equal(a.annualKwh,2000);
  assert.equal(a.annualCostEuro,600);
  assert.equal(a.potentialKwhAvoided,500);
  assert.equal(a.potentialCostAvoidedEuro,150);
  assert.equal(a.modelCalls,0); assert.equal(a.externalActions,0);
  assert.equal(a.measuredEnergy,false);
});

test("equipment rejects invalid input and cannot save more operating hours than used", () => {
  const x = {watts:250,units:1,hoursPerDay:8,daysPerWeek:5,weeksPerYear:50,euroPerKwh:.2,hoursReducedPerDay:2};
  assert.throws(() => energy.equipmentEstimate({...x,hoursReducedPerDay:9}),RangeError);
  assert.throws(() => energy.equipmentEstimate({...x,watts:-1}),RangeError);
  assert.throws(() => energy.equipmentEstimate({...x,units:""}),RangeError);
  assert.throws(() => energy.equipmentEstimate({...x,euroPerKwh:"NaN"}),RangeError);
});

test("compute comparison is optional, transparent scenario, never a CO2 measurement", () => {
  const result = energy.computeEstimate({tasksPerDay:100,daysPerYear:365,modelSharePercent:20,localJoulesPerTask:2,aiJoulesPerTask:50,euroPerKwh:.3});
  assert.equal(result.annualTasks,36500);
  assert.equal(result.hypotheticalAiCalls,7300);
  assert.equal(result.hypotheticalLocalTasks,29200);
  assert.equal(result.measuredEnergy,false);
  assert.equal(result.hybridKwh,0.11772);
  assert.equal(result.allAiKwh,0.50694);
  assert.ok(result.differenceKwh>0);
});

test("workflow sector ideas are copy-safe, fictional, and estimates are owner-entered", () => {
  for (const sector of ["trades","hospitality","retail","services","fieldwork"]) {
    const r=energy.workflowPlan({sector,tasksPerWeek:20,minutesPerTask:15,improvementPercent:20,weeksPerYear:50,euroPerHour:30});
    assert.equal(r.annualHoursSpent,250);
    assert.equal(r.potentialHoursFreed,50);
    assert.equal(r.indicativeTimeValueEuro,1500);
    assert.equal(r.ideas.length,3);
    assert.equal(r.externalActions,0);
    assert.equal(r.modelCalls,0);
  }
  assert.throws(()=>energy.workflowPlan({sector:"__proto__",tasksPerWeek:1,minutesPerTask:1,improvementPercent:1,weeksPerYear:1,euroPerHour:1}),RangeError);
});

test("Quote enriches actual calculator and flags missing facts without inventing prices", () => {
  const x=products.quoteReview({hours:8,rate:35,materials:120,overheads:40,markup:20,scope:"Repair three decking boards",measurements:false,access:true,timeline:false,materialsChecked:true}, quote.quoteEstimate);
  assert.equal(x.total,528);
  assert.equal(x.readiness,"Incomplete intake");
  assert.equal(x.missing.length,2);
  assert.equal(x.marginPercentBeforeOtherCosts,16.67);
  assert.equal(x.externalActions,0);
  assert.equal(x.reviewRequired,true);
});

test("Follow-Up respects opt-outs and unclear permissions and never sends", () => {
  let x=products.followUp({stage:"quoted",daysElapsed:10,optOut:true,contactPermission:true});
  assert.match(x.status,/Stop/); assert.equal(x.reviewOnlyDraft,""); assert.equal(x.needsReview,false);
  x=products.followUp({stage:"quoted",daysElapsed:10,optOut:false,contactPermission:false});
  assert.match(x.status,/Hold/); assert.equal(x.reviewOnlyDraft,"");
  x=products.followUp({stage:"quoted",daysElapsed:10,optOut:false,contactPermission:true});
  assert.equal(x.needsReview,true);assert.match(x.reviewOnlyDraft,/following up/);assert.equal(x.externalActions,0);
  assert.throws(()=>products.followUp({stage:"foo",daysElapsed:0}),RangeError);
});

test("Field produces portable generic checklists with zero automatic actions", () => {
  for(const sector of ["field","building","retail","maintenance"]) {
    const x=products.fieldPack(sector);
    assert.ok(x.items.length>=6);
    assert.equal(x.items[0].step,1);
    assert.equal(x.items[0].checked,false);
    assert.equal(x.externalActions,0);
  }
  assert.throws(()=>products.fieldPack("bad"),RangeError);
});

test("Guardian flags gaps and unknown items as unverified, not certified", () => {
  const answers={mfa:"no",separate:"yes",restore:"unknown",updates:"yes",export:"yes",privacy:"yes",ai:"yes",incident:"yes"};
  const r=products.guardian(answers);
  assert.equal(r.verifiedSecurity,false);
  assert.equal(r.priorityActions.length,2);
  assert.ok(r.notConfirmedWeightPercent>0);
  assert.equal(r.externalActions,0);
  assert.throws(()=>products.guardian({mfa:"green"}),RangeError);
});
