/* Lightweight DOM integration test for the six Aerie Studio buttons.
 * Runs in built-in Node vm: no browser installation, internet, real data or dependencies.
 */
"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const vm=require("node:vm");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"studio/index.html"),"utf8");
const script=fs.readFileSync(path.join(root,"studio/app.js"),"utf8");
const energy=require("../studio/engine.js");
const products=require("../studio/products.js");
const pilot=require("../pilot/engine.js");
const csv=require("../pilot/csv.js");

class Element {
  constructor(tag="div"){
    this.tagName=tag;this.children=[];this.listeners={};this.value="";
    this.checked=false;this.disabled=false;this.textContent="";this.className="";
  }
  addEventListener(name,callback){this.listeners[name]=callback;}
  dispatch(name){if(!this.listeners[name])throw new Error("Missing "+name+" listener for "+this.tagName);return this.listeners[name]();}
  appendChild(child){this.children.push(child);return child;}
  replaceChildren(...elements){this.children=elements;}
  setAttribute(name,val){this[name]=val;}
  click(){this.clicked=true;}
}
const flatten=element=>{
  if(!element)return "";
  return String(element.textContent||"")+" "+(element.children||[]).map(flatten).join(" ");
};
function session(){
  const elements=new Map();
  for(const m of html.matchAll(/\bid="([^"]+)"/g))elements.set(m[1],new Element());
  function search(root,id){
    if(root.id===id)return root;
    for(const child of root.children){const found=search(child,id);if(found)return found;}
    return null;
  }
  const document={
    getElementById(id){
      if(elements.has(id))return elements.get(id);
      for(const e of elements.values()){
        const match=search(e,id);
        if(match)return match;
      }
      throw new Error("Unknown element: "+id);
    },
    createElement(tag){return new Element(tag);},
    createTextNode(str){const e=new Element("#text");e.textContent=str;return e;}
  };
  const sample={
    sector:"trades",tasksPerWeek:"20",minutesPerTask:"15",improvementPercent:"20",weeksPerYear:"50",euroPerHour:"30",
    watts:"500",units:"2",hoursPerDay:"8",daysPerWeek:"5",energyWeeks:"50",energyTariff:".30",hoursReduced:"2",equipmentLabel:"Example lighting",
    computeTasks:"100",computeDays:"365",aiShare:"20",localJoules:"2",aiJoules:"50",
    quoteScope:"Repair three decking boards",quoteHours:"8",quoteRate:"35",quoteMaterials:"120",quoteOverheads:"40",quoteMarkup:"20",
    followStage:"quoted",followDays:"7",fieldType:"field"
  };
  for(const [id,value] of Object.entries(sample))document.getElementById(id).value=value;
  document.getElementById("followAllowed").checked=true;
  const files=[];
  const context={
    document,
    window:{requestAnimationFrame(cb){cb();}},
    Intl,Blob,
    URL:{
      createObjectURL(blob){files.push(blob);return "blob:fictional-download";},
      revokeObjectURL(){},
    },
    AerieStudio:energy,AerieProducts:products,AeriePilot:pilot,AerieCsv:csv,
  };
  vm.runInNewContext(script,context,{timeout:5000});
  return {elements,files,document,el:id=>document.getElementById(id)};
}
test("six Studio product interactions render results without network or browser storage",()=>{
  const s=session();
  const steps=[
    ["flowGo","flowResult","hypothetical hours"],
    ["energyGo","energyResult","annual"],
    ["computeGo","computeResult","Hybrid scenario"],
    ["quoteGo","quoteResult","528"],
    ["followGo","followResult","Draft for human review"],
    ["fieldGo","fieldResult","Ecology and field survey"],
    ["guardianGo","guardianResult","unconfirmed controls"]
  ];
  for(const [button,target,fragment] of steps){
    s.el(button).dispatch("click");
    const output=flatten(s.el(target));
    assert.ok(output.toLowerCase().includes(fragment.toLowerCase()), button+": "+output.slice(0,180));
    assert.doesNotMatch(output,/Please check the example inputs/);
  }
  assert.equal(s.el("quoteCsv").disabled,false);
  assert.equal(s.el("fieldCsv").disabled,false);
  assert.equal(s.el("guardianQuestions").children.length,8);
});

test("Energy and Follow-Up queues stay in memory and exported reports are manually triggered",()=>{
  const s=session();
  s.el("energyAdd").dispatch("click");
  assert.match(flatten(s.el("portfolioResult")),/Example lighting/);
  assert.equal(s.el("energyPortfolioCsv").disabled,false);
  s.el("energyPortfolioCsv").dispatch("click");
  assert.equal(s.files.length,1);

  s.el("followAdd").dispatch("click");
  assert.match(flatten(s.el("followQueueResult")),/fictional cases/);
  assert.equal(s.el("followCsv").disabled,false);
  s.el("followCsv").dispatch("click");
  assert.equal(s.files.length,2);

  s.el("quoteGo").dispatch("click");
  s.el("quoteCsv").dispatch("click");
  s.el("fieldGo").dispatch("click");
  s.el("fieldCsv").dispatch("click");
  assert.equal(s.files.length,4);
  s.el("followOptOut").checked=true;
  s.el("followOptOut").dispatch("change");
  assert.equal(s.el("followAllowed").checked,false);
  s.el("followAdd").dispatch("click");
  assert.match(flatten(s.el("followQueueResult")),/Stop — privacy review/);

  s.el("energyReset").dispatch("click");
  s.el("followClear").dispatch("click");
  assert.equal(s.el("energyPortfolioCsv").disabled,true);
  assert.equal(s.el("followCsv").disabled,true);
});
