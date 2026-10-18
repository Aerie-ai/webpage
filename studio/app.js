/* Aerie Studio UI: six fictional, local-only tools.
 * DOM uses textContent/createElement; no network, personal data, tracking or storage.
 */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const euro = value => new Intl.NumberFormat("en-IE", {style:"currency", currency:"EUR"}).format(value);
  const number = value => new Intl.NumberFormat("en-IE", {maximumFractionDigits:2}).format(value);
  const value = id => $(id).value;
  const checked = id => $(id).checked;
  let quoteData = null;
  let fieldData = null;

  function clear(id) { $(id).replaceChildren(); return $(id); }
  function node(tag, text, className) {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = String(text);
    if (className) n.className = className;
    return n;
  }
  function message(box, content, type) {
    box.appendChild(node(type || "p", content));
  }
  function heading(box, content) { message(box, content, "h3"); }
  function bullets(box, items) {
    const ul = document.createElement("ul");
    items.forEach(x => ul.appendChild(node("li", x)));
    box.appendChild(ul);
  }
  function resultError(id, error) {
    clear(id).appendChild(node("p", "Please check the example inputs: " + (error && error.message ? error.message : "Invalid values.")));
  }
  function metric(box, label, content) {
    const p = node("p");
    p.appendChild(node("strong", label + ": "));
    p.appendChild(document.createTextNode(String(content)));
    box.appendChild(p);
  }
  function downloadCsv(rows, filename) {
    const csv = AerieCsv.rows(rows);
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.requestAnimationFrame(() => URL.revokeObjectURL(url));
  }

  $("flowGo").addEventListener("click", () => {
    try {
      const result = AerieStudio.workflowPlan({
        sector:value("sector"), tasksPerWeek:value("tasksPerWeek"),
        minutesPerTask:value("minutesPerTask"), improvementPercent:value("improvementPercent"),
        weeksPerYear:value("weeksPerYear"), euroPerHour:value("euroPerHour")
      });
      const box = clear("flowResult");
      heading(box, number(result.potentialHoursFreed) + " hypothetical hours per year freed");
      metric(box, "Current task hours/year", number(result.annualHoursSpent));
      metric(box, "Indicative value of time", euro(result.indicativeTimeValueEuro));
      message(box, "Three ideas to explore:", "p");
      result.ideas.forEach(item => {
        const block = node("div", undefined, "mini");
        block.appendChild(node("h3", item.title));
        message(block, item.action);
        message(block, "Safety: " + item.safeguard, "p");
        box.appendChild(block);
      });
      message(box, result.assumption + " " + result.notAdditive, "p");
    } catch (error) { resultError("flowResult", error); }
  });

  $("energyGo").addEventListener("click", () => {
    try {
      const r = AerieStudio.equipmentEstimate({
        watts:value("watts"), units:value("units"), hoursPerDay:value("hoursPerDay"),
        daysPerWeek:value("daysPerWeek"), weeksPerYear:value("energyWeeks"),
        euroPerKwh:value("energyTariff"), hoursReducedPerDay:value("hoursReduced")
      });
      const box = clear("energyResult");
      heading(box, euro(r.potentialCostAvoidedEuro) + " potential annual running-cost difference");
      metric(box, "Baseline electricity", number(r.annualKwh) + " kWh/year");
      metric(box, "Baseline electricity cost", euro(r.annualCostEuro) + "/year");
      metric(box, "Potential avoided electricity", number(r.potentialKwhAvoided) + " kWh/year");
      metric(box, "Revised electricity", number(r.newAnnualKwh) + " kWh/year");
      message(box, r.assumption + " Never reduce operation where safety, refrigeration or critical processes depend on it.");
    } catch (error) { resultError("energyResult", error); }
  });

  // In-memory fictional equipment plan: never synced, logged or persisted.
  const equipmentScenarios=[];
  function equipmentInput(){
    return {
      label:value("equipmentLabel"), watts:value("watts"), units:value("units"),
      hoursPerDay:value("hoursPerDay"), daysPerWeek:value("daysPerWeek"),
      weeksPerYear:value("energyWeeks"), euroPerKwh:value("energyTariff"),
      hoursReducedPerDay:value("hoursReduced")
    };
  }
  function renderEquipment(){
    const box=clear("portfolioResult");
    if(!equipmentScenarios.length){
      message(box,"No equipment scenarios added. Nothing is stored between sessions.");
      $("energyPortfolioCsv").disabled=true; return;
    }
    const result=AerieStudio.equipmentPortfolio(equipmentScenarios);
    heading(box,euro(result.annualCostEuro) + " illustrative annual portfolio cost");
    metric(box,"Portfolio electricity",number(result.annualKwh)+" kWh/year");
    metric(box,"Hypothetical reduced operating costs",euro(result.potentialCostAvoidedEuro)+"/year");
    result.items.forEach(item=>{
      const block=node("div",undefined,"mini");
      block.appendChild(node("strong",item.index+". "+item.label));
      message(block,number(item.annualKwh)+" kWh/year · "+euro(item.annualCostEuro)+" per year; possible change "+euro(item.potentialCostAvoidedEuro));
      box.appendChild(block);
    });
    message(box,result.note);
    $("energyPortfolioCsv").disabled=false;
  }
  $("energyAdd").addEventListener("click",()=>{
    try{
      if(equipmentScenarios.length>=40)throw new RangeError("Only 40 fictional equipment types can be compared at once.");
      const record=equipmentInput();
      AerieStudio.equipmentEstimate(record);
      equipmentScenarios.push(record);
      renderEquipment();
    }catch(error){resultError("portfolioResult",error);}
  });
  $("energyReset").addEventListener("click",()=>{
    equipmentScenarios.length=0;renderEquipment();
  });
  $("energyPortfolioCsv").addEventListener("click",()=>{
    if(!equipmentScenarios.length)return;
    const data=AerieStudio.equipmentPortfolio(equipmentScenarios);
    const rows=[["Field","Fictional value"],["Kind","Equipment scenario assumptions - NOT METERED"],
      ["Annual portfolio kWh",data.annualKwh],["Annual portfolio cost EUR",data.annualCostEuro],
      ["Hypothetical avoided kWh",data.potentialKwhAvoided],
      ["Hypothetical avoided cost EUR",data.potentialCostAvoidedEuro]];
    data.items.forEach(item=>{
      rows.push(["Equipment "+item.index+" "+item.label,
        item.annualKwh+" kWh per year; EUR "+item.annualCostEuro+" annual cost"]);
    });
    rows.push(["Warning",data.note]);
    downloadCsv(rows,"aerie-fictional-energy-portfolio.csv");
  });

  $("computeGo").addEventListener("click", () => {
    try {
      const r = AerieStudio.computeEstimate({
        tasksPerDay:value("computeTasks"), daysPerYear:value("computeDays"),
        modelSharePercent:value("aiShare"), localJoulesPerTask:value("localJoules"),
        aiJoulesPerTask:value("aiJoules"), euroPerKwh:value("energyTariff")
      });
      const box = clear("computeResult");
      heading(box, "Scenario, not measured performance");
      metric(box, "Tasks per year", number(r.annualTasks));
      metric(box, "Hypothetical AI calls/year", number(r.hypotheticalAiCalls));
      metric(box, "All-AI scenario", number(r.allAiKwh) + " kWh/year");
      metric(box, "Hybrid scenario", number(r.hybridKwh) + " kWh/year");
      metric(box, "Energy difference vs all-AI", number(r.differenceKwh) + " kWh/year");
      metric(box, "Electricity-only indicative cost difference", euro(r.differenceEuro));
      message(box, r.assumption);
    } catch (error) { resultError("computeResult", error); }
  });

  const quoteIds = ["quoteScope","quoteHours","quoteRate","quoteMaterials","quoteOverheads","quoteMarkup",
    "quoteMeasurements","quoteAccess","quoteTimeline","quoteMaterialsChecked"];
  quoteIds.forEach(id => $(id).addEventListener("input", () => {
    quoteData=null; $("quoteCsv").disabled=true;
  }));
  $("quoteGo").addEventListener("click", () => {
    try {
      const r = AerieProducts.quoteReview({
        scope:value("quoteScope"),hours:value("quoteHours"),rate:value("quoteRate"),
        materials:value("quoteMaterials"),overheads:value("quoteOverheads"),
        markup:value("quoteMarkup"),measurements:checked("quoteMeasurements"),
        access:checked("quoteAccess"), timeline:checked("quoteTimeline"),
        materialsChecked:checked("quoteMaterialsChecked")
      }, AeriePilot.quoteEstimate);
      quoteData=r; $("quoteCsv").disabled=false;
      const box=clear("quoteResult");
      heading(box, euro(r.total) + " fictional internal estimate");
      metric(box, "Labour", euro(r.labor));
      metric(box, "Cost subtotal", euro(r.subtotal));
      metric(box, "Markup amount", euro(r.markup));
      metric(box, "Indicative margin before omitted costs", number(r.marginPercentBeforeOtherCosts) + "%");
      metric(box, "Intake status", r.readiness);
      if(r.missing.length){message(box,"Missing checks to resolve:");bullets(box,r.missing);}
      else message(box,"All five basic intake prompts were answered; still requires human quote approval.");
      message(box,r.message);
    } catch(error){quoteData=null;$("quoteCsv").disabled=true;resultError("quoteResult",error);}
  });
  $("quoteCsv").addEventListener("click", () => {
    if(!quoteData)return;
    const rows=[
      ["Field","Fictional value"],["Status","INTERNAL EXAMPLE - NOT APPROVED"],
      ["Scope",value("quoteScope")],["Estimate EUR",quoteData.total],
      ["Labour EUR",quoteData.labor],["Cost subtotal EUR",quoteData.subtotal],
      ["Markup EUR",quoteData.markup],["Human review required","Yes"],
      ["Missing information",quoteData.missing.join("; ")],
      ["Notice",quoteData.message]
    ];
    downloadCsv(rows,"aerie-fictional-quote-review.csv");
  });

  $("followGo").addEventListener("click",()=>{
    try{
      const r=AerieProducts.followUp({stage:value("followStage"),daysElapsed:value("followDays"),
        contactPermission:checked("followAllowed"),optOut:checked("followOptOut")});
      const box=clear("followResult");
      heading(box,r.status);
      message(box,r.suggestion);
      if(r.reviewOnlyDraft){message(box,"Unsent, generic draft:");const block=node("blockquote",r.reviewOnlyDraft);box.appendChild(block);}
      metric(box,"Manual review threshold",r.reviewThresholdDays + " days");
      message(box,r.note);
    }catch(error){resultError("followResult",error);}
  });

  const followCases=[];
  function followInput(){
    return {stage:value("followStage"),daysElapsed:value("followDays"),
      contactPermission:checked("followAllowed"),optOut:checked("followOptOut")};
  }
  function renderFollowQueue(){
    const box=clear("followQueueResult");
    if(!followCases.length){
      message(box,"No fictional cases added. Reloading clears the queue.");
      $("followCsv").disabled=true;return;
    }
    heading(box,followCases.length+" fictional cases awaiting review");
    const blocked=followCases.filter(item=>!item.needsReview).length;
    metric(box,"Held/not due/closed",blocked);
    followCases.forEach((item,index)=>{
      const line=node("div",undefined,"mini");
      line.appendChild(node("strong","Fictional case "+(index+1)+" — "+item.status));
      message(line,item.suggestion);
      box.appendChild(line);
    });
    message(box,"No messages are sent. These cases do not establish a lawful contact basis.");
    $("followCsv").disabled=false;
  }
  $("followAdd").addEventListener("click",()=>{
    try{
      if(followCases.length>=30)throw new RangeError("The temporary fictional queue holds up to 30 cases.");
      followCases.push(AerieProducts.followUp(followInput()));
      renderFollowQueue();
    }catch(error){resultError("followQueueResult",error);}
  });
  $("followClear").addEventListener("click",()=>{
    followCases.length=0;renderFollowQueue();
  });
  $("followCsv").addEventListener("click",()=>{
    if(!followCases.length)return;
    const rows=[["Field","Fictional value"],["Kind","Internal review queue - NOT SENT"]];
    followCases.forEach((item,index)=>{
      rows.push(["Case "+(index+1)+" stage",item.stage]);
      rows.push(["Case "+(index+1)+" decision",item.status]);
      rows.push(["Case "+(index+1)+" review",item.suggestion]);
    });
    rows.push(["Warning","Generic fictional queue. No customer identifiers, messages or automatic sending."]);
    downloadCsv(rows,"aerie-fictional-follow-up-queue.csv");
  });

  $("followOptOut").addEventListener("change",()=>{
    if(checked("followOptOut")){$("followAllowed").checked=false;}
  });

  $("fieldType").addEventListener("change",()=>{
    fieldData=null;$("fieldCsv").disabled=true;clear("fieldResult").appendChild(node("p","Choose Build checklist to regenerate this fictional pack."));
  });
  $("fieldGo").addEventListener("click",()=>{
    try{
      fieldData=AerieProducts.fieldPack(value("fieldType"));
      $("fieldCsv").disabled=false;
      const box=clear("fieldResult");
      heading(box,fieldData.title);
      fieldData.items.forEach((item,index)=>{
        const label=node("label",undefined,"check");
        const checkbox=document.createElement("input");
        checkbox.type="checkbox";
        checkbox.addEventListener("change",()=>{item.checked=checkbox.checked;});
        checkbox.setAttribute("aria-label","Mark checklist step " + (index+1) + " complete");
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(item.text));
        box.appendChild(label);
      });
      message(box,fieldData.note);
    }catch(error){fieldData=null;$("fieldCsv").disabled=true;resultError("fieldResult",error);}
  });
  $("fieldCsv").addEventListener("click",()=>{
    if(!fieldData)return;
    const rows=[["Step","Status"],["Pack",fieldData.title],
      ...fieldData.items.map(item=>[item.text,item.checked?"Checked in browser":"Not checked"]),
      ["Important",fieldData.note]];
    downloadCsv(rows,"aerie-fictional-site-checklist.csv");
  });

  AerieProducts.guardianChecks.forEach(check=>{
    const wrapper=node("div",undefined,"guardian-field");
    const label=node("label",check.label);
    label.htmlFor="guardian-"+check.id;
    const select=node("select");
    select.id="guardian-"+check.id;
    [["unknown","Not sure"],["yes","Yes (self-reported)"],["no","No"]].forEach(pair=>{
      const opt=node("option",pair[1]);opt.value=pair[0];select.appendChild(opt);
    });
    wrapper.appendChild(label);wrapper.appendChild(select);
    $("guardianQuestions").appendChild(wrapper);
  });
  $("guardianGo").addEventListener("click",()=>{
    try{
      const answers={};
      AerieProducts.guardianChecks.forEach(item=>{answers[item.id]=value("guardian-"+item.id);});
      const r=AerieProducts.guardian(answers);
      const box=clear("guardianResult");
      heading(box,"Controls needing attention or verification");
      metric(box,"Weighted unconfirmed controls",number(r.notConfirmedWeightPercent)+"%");
      if(r.priorityActions.length)bullets(box,r.priorityActions.map(item=>item.action));
      else message(box,"All answers were marked yes by you, but no control has been independently verified.");
      message(box,r.note);
    }catch(error){resultError("guardianResult",error);}
  });
})();
