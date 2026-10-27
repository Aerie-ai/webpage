/* Aerie Efficiency Studio: small, deterministic, synthetic-data-only calculators.
 * No API, model calls or storage. Source inputs are assumptions supplied by users.
 * Outcomes are scenarios, not verified financial or environmental savings.
 */
(function (root) {
  "use strict";
  function number(name, value, min, max) {
    if (value === "" || value == null || typeof value === "boolean") throw new RangeError(name + " is required");
    if (typeof value === "string" && !value.trim()) throw new RangeError(name + " is required");
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      throw new RangeError(name + " must be between " + min + " and " + max);
    }
    return parsed;
  }
  function round(value, places) {
    const power = Math.pow(10, places == null ? 2 : places);
    return Math.round((value + Number.EPSILON) * power) / power;
  }
  function equipmentEstimate(raw) {
    const watts = number("Power (watts)", raw.watts, 0, 1000000);
    const units = number("Number of devices", raw.units, 1, 100000);
    const hours = number("Hours per day", raw.hoursPerDay, 0, 24);
    const days = number("Days per week", raw.daysPerWeek, 0, 7);
    const weeks = number("Weeks per year", raw.weeksPerYear, 0, 52.18);
    const tariff = number("Price per kWh", raw.euroPerKwh, 0, 10);
    const avoided = number("Hours reduced each active day", raw.hoursReducedPerDay, 0, 24);
    if (avoided > hours) throw new RangeError("Reduced hours cannot exceed the original operating hours");
    const hoursYear = days * weeks;
    const annualKwh = watts * units * hours * hoursYear / 1000;
    const potentialKwh = watts * units * avoided * hoursYear / 1000;
    return {
      annualKwh: round(annualKwh, 2),
      annualCostEuro: round(annualKwh * tariff, 2),
      potentialKwhAvoided: round(potentialKwh, 2),
      potentialCostAvoidedEuro: round(potentialKwh * tariff, 2),
      newAnnualKwh: round(annualKwh - potentialKwh, 2),
      modelCalls: 0, externalActions: 0,
      assumption: "Scenario only. Constant device wattage; excludes standby, seasonal variation, tariffs by time, standing charges, VAT and rebound effects.",
      measuredEnergy: false
    };
  }
  function equipmentPortfolio(rows) {
    if (!Array.isArray(rows) || rows.length < 1 || rows.length > 40) {
      throw new RangeError("Provide between 1 and 40 fictional equipment scenarios");
    }
    const items = rows.map((row, index) => {
      const estimate = equipmentEstimate(row);
      return {
        index: index + 1,
        label: String(row.label || "Example equipment " + (index + 1)).trim().slice(0, 60),
        annualKwh: estimate.annualKwh,
        annualCostEuro: estimate.annualCostEuro,
        potentialKwhAvoided: estimate.potentialKwhAvoided,
        potentialCostAvoidedEuro: estimate.potentialCostAvoidedEuro
      };
    });
    const sum = key => round(items.reduce((acc, item) => acc + item[key], 0), 2);
    return {
      items,
      annualKwh: sum("annualKwh"),
      annualCostEuro: sum("annualCostEuro"),
      potentialKwhAvoided: sum("potentialKwhAvoided"),
      potentialCostAvoidedEuro: sum("potentialCostAvoidedEuro"),
      modelCalls: 0,
      externalActions: 0,
      measuredEnergy: false,
      note: "Fictional equipment inventory. Figures add owner-entered scenarios; overlapping devices, unsafe shutdowns, and coincident or variable loads may invalidate savings assumptions."
    };
  }
  function computeEstimate(raw) {
    const tasksPerDay = number("Tasks per day", raw.tasksPerDay, 0, 1000000);
    const daysPerYear = number("Active days per year", raw.daysPerYear, 0, 366);
    const modelSharePercent = number("Tasks requiring AI (%)", raw.modelSharePercent, 0, 100);
    const localJoules = number("Measured local joules per task", raw.localJoulesPerTask, 0, 1000000000);
    const aiJoules = number("Measured AI joules per task", raw.aiJoulesPerTask, 0, 1000000000);
    const tariff = number("Price per kWh", raw.euroPerKwh, 0, 10);
    const totalTasks = tasksPerDay * daysPerYear;
    const externalCalls = totalTasks * modelSharePercent / 100;
    const localTasks = totalTasks - externalCalls;
    const allAiJoules = totalTasks * aiJoules;
    const mixedJoules = localTasks * localJoules + externalCalls * aiJoules;
    const joulesPerKwh = 3600000;
    return {
      annualTasks: totalTasks,
      hypotheticalAiCalls: externalCalls,
      hypotheticalLocalTasks: localTasks,
      allAiKwh: round(allAiJoules / joulesPerKwh, 5),
      hybridKwh: round(mixedJoules / joulesPerKwh, 5),
      differenceKwh: round((allAiJoules - mixedJoules) / joulesPerKwh, 5),
      differenceEuro: round((allAiJoules - mixedJoules) / joulesPerKwh * tariff, 4),
      comparison: "All-AI scenario compared with local rules for suitable tasks plus AI for chosen tasks.",
      measuredEnergy: false,
      assumption: "Only as reliable as the entered joules/task and matching measurement boundaries. Not measured by Aerie; excludes unentered network, idle, device, model training and storage energy."
    };
  }
  const IDEAS = Object.freeze({
    trades: [
      {title:"Quote completeness companion", action:"Flag missing measurements, site access, materials and deadlines before estimating.", safeguard:"Never invent prices; owner reviews every quote.", kind:"local"},
      {title:"Job-to-invoice checklist", action:"Turn completed jobs into a locally reviewed invoice preparation checklist.", safeguard:"No invoices, payments or reminders are sent.", kind:"local"},
      {title:"Return-visit prevention", action:"Prepare a materials and photos checklist before leaving for a job.", safeguard:"Photos and customer details remain outside this demo.", kind:"local"}
    ],
    hospitality: [
      {title:"Shift handover board", action:"Create daily opening, closing, cleaning and stock-check routines.", safeguard:"No employee records or automatic scheduling.", kind:"local"},
      {title:"Waste and ordering tracker", action:"Compare fictional food-preparation quantities and leftovers to spot waste.", safeguard:"Requires owner-entered figures; no live inventory connections.", kind:"local"},
      {title:"Energy use planner", action:"Review refrigeration, heating and lighting schedules without compromising safety.", safeguard:"Never advise turning off food-safety refrigeration.", kind:"local"}
    ],
    retail: [
      {title:"Stock reorder prompt", action:"Spot products that may need restocking from owner-entered example counts.", safeguard:"No automatic orders; human checks stock and demand.", kind:"local"},
      {title:"Returns triage desk", action:"Organise return reasons and draft follow-up questions.", safeguard:"Consumer rights and refunds require human review.", kind:"review"},
      {title:"Enquiry-to-sale planner", action:"Flag unanswered product questions and prepare a review-only reply.", safeguard:"No real customer contact or automatic marketing.", kind:"review"}
    ],
    services: [
      {title:"Proposal builder", action:"Create a clear checklist of scope, deliverables, timings and missing information.", safeguard:"A human confirms terms and pricing.", kind:"local"},
      {title:"Unpaid-invoice review", action:"Organise outstanding fictional invoices into a manual follow-up queue.", safeguard:"Never contacts customers or claims a debt is owed.", kind:"review"},
      {title:"Meeting preparation assistant", action:"Generate a local agenda and decisions-needed checklist.", safeguard:"No calendar access or confidential uploads.", kind:"local"}
    ],
    fieldwork: [
      {title:"Offline field pack", action:"Prepare site visit checklists, sample labels and equipment lists.", safeguard:"No real coordinates, species records or client information in the demo.", kind:"local"},
      {title:"Site-to-report companion", action:"Organise invented field observations into reviewable headings and evidence gaps.", safeguard:"Never invent survey findings or regulatory conclusions.", kind:"review"},
      {title:"Equipment and route planner", action:"Compare what must be collected on the same trip to avoid repeat visits.", safeguard:"No access to private travel history, GPS or client addresses.", kind:"local"}
    ]
  });
  function workflowPlan(raw) {
    const sector = String(raw.sector || "");
    if (!Object.prototype.hasOwnProperty.call(IDEAS, sector)) throw new RangeError("Choose a valid business type");
    const tasksPerWeek = number("Tasks per week", raw.tasksPerWeek, 0, 100000);
    const minutesPerTask = number("Minutes per task", raw.minutesPerTask, 0, 1440);
    const improvementPercent = number("Assumed time reduction (%)", raw.improvementPercent, 0, 100);
    const weeksPerYear = number("Weeks per year", raw.weeksPerYear, 0, 52.18);
    const euroPerHour = number("Estimated hourly value (€)", raw.euroPerHour, 0, 10000);
    const baselineHours = tasksPerWeek * minutesPerTask * weeksPerYear / 60;
    const potentialHours = baselineHours * improvementPercent / 100;
    return {
      sector, ideas: IDEAS[sector].map(item => Object.assign({}, item)),
      annualHoursSpent: round(baselineHours),
      potentialHoursFreed: round(potentialHours),
      indicativeTimeValueEuro: round(potentialHours * euroPerHour),
      measured: false,
      notAdditive: "Each idea is a separate opportunity. The same potential time saving must not be counted for multiple tools.",
      assumption: "Illustrative owner-entered scenario, not a tested productivity gain. Include setup, maintenance and review time when assessing real ROI.",
      modelCalls: 0, externalActions: 0
    };
  }
  const api = Object.freeze({equipmentEstimate, equipmentPortfolio, computeEstimate, workflowPlan});
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.AerieStudio = api;
})(typeof window !== "undefined" ? window : globalThis);
