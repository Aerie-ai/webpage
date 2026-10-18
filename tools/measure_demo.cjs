/* Low-cost CI reporting only. Synthetic data; no network, no customer details.
 * Byte count and execution time are proxy metrics, NOT electricity/CO2.
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const {performance} = require("node:perf_hooks");
const root = path.resolve(__dirname, "..");
const pilot = require("../pilot/engine.js");
const paths = ["index.html","privacy.html","pilot/index.html","pilot/engine.js","pilot/csv.js","pilot/app.js"];
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
const report = {
  kind: "synthetic_local_first_development_metrics",
  samples_per_repeat: samples.length,
  repeats,
  classifications: local,
  review_required: reviews,
  local_model_calls: modelCalls,
  external_actions: externalActions,
  runtime_ms_observed: duration,
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
  + "; outbound actions: " + externalActions + "; public source bytes: " + total
  + "; observed runtime ms: " + duration + "\n");
