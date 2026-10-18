/* Low-cost CI reporting only. Synthetic data; no network, no customer details.
 * Byte count and execution time are proxy metrics, NOT electricity/CO2.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {performance} = require("node:perf_hooks");
const root = path.resolve(__dirname, "..");
const pilot = require("../pilot/engine.js");
const studio = require("../studio/engine.js");
const products = require("../studio/products.js");
const paths = ["index.html","privacy.html","pilot/index.html","pilot/engine.js","pilot/csv.js","pilot/app.js","studio/index.html","studio/engine.js","studio/products.js","studio/app.js"];
const total = paths.reduce((n, p) => n + fs.statSync(path.join(root, p)).size, 0);
const jsBytes = paths.filter(p => p.endsWith(".js"))
  .reduce((n, p) => n + fs.statSync(path.join(root, p)).size, 0);
const samples = [
  "Please quote for an invented repair in Galway.",
  "Our imaginary checkout is not working urgently.",
  "Please remove my data from your mailing list.",
  "Can I book a consultation next Friday?",
  "Tell me what business services you are developing."
];
const repeats = 200;
let local = 0, modelCalls = 0, externalActions = 0, reviews = 0;
const start = performance.now();
for (let pass = 0; pass < repeats; pass++) {
  for (const message of samples) {
    const r = pilot.evaluate(message);
    local++;
    modelCalls += r.externalModelCalls;
    externalActions += r.externalActions;
    reviews += r.approvalRequired ? 1 : 0;
  }
}
const duration = Number((performance.now() - start).toFixed(3));
// Run representative fictional scenarios for all six new tools, with no network.
const studioStart = performance.now();
const studioRepeats = 200;
let studioEvaluations = 0, studioModelCalls = 0, studioActions = 0;
const inc = (r) => {
  studioEvaluations++;
  studioModelCalls += r.modelCalls || 0;
  studioActions += r.externalActions || 0;
};
for(let pass=0;pass<studioRepeats;pass++){
  inc(studio.workflowPlan({sector:"trades",tasksPerWeek:20,minutesPerTask:15,improvementPercent:20,weeksPerYear:50,euroPerHour:30}));
  inc(studio.equipmentEstimate({watts:500,units:2,hoursPerDay:8,daysPerWeek:5,weeksPerYear:50,euroPerKwh:.3,hoursReducedPerDay:2}));
  inc(products.quoteReview({scope:"Fictional repair",hours:8,rate:35,materials:120,overheads:40,markup:20},pilot.quoteEstimate));
  inc(products.followUp({stage:"quoted",daysElapsed:7,contactPermission:true,optOut:false}));
  inc(products.fieldPack("building"));
  inc(products.guardian({mfa:"yes",separate:"unknown"}));
}
const studioRuntimeMs = Number((performance.now()-studioStart).toFixed(3));
const report = {
  kind: "synthetic_local_first_development_metrics",
  samples_per_repeat: samples.length,
  repeats,
  classifications: local,
  review_required: reviews,
  local_model_calls: modelCalls,
  external_actions: externalActions,
  runtime_ms_observed: duration,
  studio_local_scenarios: studioEvaluations,
  studio_model_calls: studioModelCalls,
  studio_external_actions: studioActions,
  studio_runtime_ms_observed: studioRuntimeMs,
  public_source_bytes_uncompressed: total,
  pilot_javascript_bytes_uncompressed: jsBytes,
  joules_measured: false,
  carbon_measured: false,
  warning: "Synthetic browser-engine Node benchmark. Runtime depends on hardware; no actual energy, network transfer or browser CPU measurement."
};
const out = path.join(root, "output");
fs.mkdirSync(out, {recursive:true});
fs.writeFileSync(path.join(out, "efficiency_baseline.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
process.stdout.write("Synthetic local decisions: " + local + "; model calls: " + modelCalls
  + "; Studio scenarios: " + studioEvaluations + "; Studio external actions: " + studioActions
  + "; outbound actions: " + externalActions + "; public source bytes: " + total
  + "; observed runtime ms: " + duration + "\n");
