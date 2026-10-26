// Model tests for protein-a-capture.html. Run: node test/model.test.js
// Loads the first <script> block (the engine) from the page, so the page and the tests share one copy of the math.
const fs=require('fs'), vm=require('vm'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','protein-a-capture.html'),'utf8');
const m=html.match(/<script>\n([\s\S]*?)<\/script>/);
if(!m){ console.error('engine script not found'); process.exit(1); }
vm.runInThisContext(m[1], {filename:'protein-a-capture.html (engine)'});
const PAX=globalThis.PAX;
if(!PAX){ console.error('PAX not exposed'); process.exit(1); }
const {langmuir, mgmlToNM, nmToMgml, occupancy, ldfK, simulate, crossing, dbcAt, analyze, fitDe, DEFAULTS, RESINS, CHECKS, SOURCES, DE_FIT}=PAX;

let pass=0, fail=0;
function ok(name, cond, extra){
  if(cond) pass++;
  else { fail++; console.log('FAIL:', name, extra===undefined?'':JSON.stringify(extra)); }
}
function near(a,b,tol){ return Math.abs(a-b)<=tol*Math.max(1e-12,Math.abs(b)); }
const P=o=>Object.assign({}, DEFAULTS, o||{});

/* 1. Langmuir isotherm by hand */
{
  ok('q(0)=0', langmuir(0,65.7,0.2)===0);
  ok('q(Kd)=qmax/2', near(langmuir(0.2,65.7,0.2), 32.85, 1e-12));
  ok('q(5) hand value', near(langmuir(5,65.7,0.2), 65.7*5/5.2, 1e-12), langmuir(5,65.7,0.2));
  ok('q -> qmax at high C', near(langmuir(1e6,65.7,0.2), 65.7, 1e-5));
  ok('q linear at low C (slope qmax/Kd)', near(langmuir(1e-6,65.7,0.2)/1e-6, 65.7/0.2, 1e-5));
  ok('occupancy(Kd)=0.5', near(occupancy(0.3,0.3), 0.5, 1e-12));
}
/* 2. unit conversions */
{
  ok('0.2 mg/mL = 1333.3 nM', near(mgmlToNM(0.2), 1333.333, 1e-6), mgmlToNM(0.2));
  ok('1 nM = 1.5e-4 mg/mL', near(nmToMgml(1), 1.5e-4, 1e-12));
  ok('round trip', near(nmToMgml(mgmlToNM(0.37)), 0.37, 1e-12));
}
/* 3. LDF rate constant by hand */
{
  const p=P();
  const Rp=85e-4/2, q0p=(65.7*5/5.2)/(1-0.35);
  const k=15*DE_FIT*5/(Rp*Rp*q0p);
  ok('ldfK hand calc', near(ldfK(p), k, 1e-12), [ldfK(p), k]);
  ok('k grows with feed titer', ldfK(P({C0:8}))>ldfK(P({C0:2})));
  ok('k falls with bead size', ldfK(P({dp_um:120}))<ldfK(P({dp_um:60})));
}
/* 4. crossing interpolation */
{
  ok('crossing midpoint', near(crossing([0,1,2],[0,0.2,0.6],0.4), 1.5, 1e-12));
  ok('crossing none -> NaN', isNaN(crossing([0,1],[0,0.05],0.1)));
}
/* 5. conservation: in = out + held in liquid + bound */
for(const c of [{}, {C0:1}, {rt_min:2.4}, {Kd:0.002}, {qmax:99.9, C0:9}]){
  const r=analyze(P(c), {stopAt:0});
  ok('mass balance '+JSON.stringify(c), Math.abs(r.massBalanceErr)<5e-3, r.massBalanceErr);
}
/* 6. curve shape */
{
  const r=analyze(P());
  const x=r.sim.x;
  ok('C/C0 starts at 0', x[0]===0);
  ok('C/C0 never above 1', Math.max(...x)<=1+1e-6, Math.max(...x));
  let mono=true; for(let i=1;i<x.length;i++) if(x[i]<x[i-1]-1e-9) mono=false;
  ok('C/C0 nondecreasing', mono);
  ok('curve runs to 98% (where it stops)', x[x.length-1]>=0.979, x[x.length-1]);
  ok('DBC10 below static capacity', r.d10.dbc<r.qs0, [r.d10.dbc, r.qs0]);
  ok('50% point near equilibrium front', near(r.d50.cv, r.shockCV, 0.15), [r.d50.cv, r.shockCV]);
}
/* 7. equilibrium limit: fast uptake + little mixing -> sharp front at epsB + q* / C0 */
{
  const p=P({k:5, Pe:5000});
  const r=analyze(p, {N:400});
  ok('sharp front 50% at shock CV', near(r.d50.cv, r.shockCV, 0.02), [r.d50.cv, r.shockCV]);
  ok('sharp front DBC10 ~ q*', near(r.d10.dbc, r.qs0, 0.05), [r.d10.dbc, r.qs0]);
}
/* 8. linear isotherm (C0 << Kd): retention epsB + qmax/Kd */
{
  const p=P({C0:0.01, Kd:5, k:5, Pe:5000});
  const r=analyze(p, {N:400});
  const expect=p.epsB+p.qmax/p.Kd*(p.Kd/(p.Kd+p.C0));
  ok('linear retention', near(r.d50.cv, expect, 0.03), [r.d50.cv, expect]);
}
/* 9. grid convergence: 100 cells vs 400 */
for(const c of [{}, {rt_min:2.4}, {C0:1}]){
  const a=analyze(P(c)).d10.dbc, b=analyze(P(c),{N:400}).d10.dbc;
  ok('grid convergence '+JSON.stringify(c), near(a,b,0.01), [a,b]);
}
/* 10. direction of effects */
{
  const d=o=>analyze(P(o)).d10.dbc;
  ok('longer residence time -> higher DBC', d({rt_min:2.4})<d({rt_min:4}) && d({rt_min:4})<d({rt_min:8}));
  ok('tighter Kd -> higher DBC', d({Kd:0.02})>d({Kd:0.2}) && d({Kd:0.2})>d({Kd:2}));
  ok('higher qmax -> higher DBC', d({qmax:99.9})>d({qmax:65.7}));
  ok('faster diffusion -> higher DBC', d({De:1e-7})>d({De:DE_FIT}));
  ok('bigger beads -> lower DBC', d({dp_um:120})<d({dp_um:85}));
  // bed height cancels at fixed residence time: nothing in the model depends on L, so check epsB/Pe are the only geometry inputs
  ok('no bed height input', !('L' in DEFAULTS) && !('L_cm' in DEFAULTS));
}
/* 11. calibration against published data */
{
  const sure=RESINS.sure;
  ok('SuRe isotherm from source', sure.qmax===65.7 && sure.Kd===0.2 && sure.src==='prisma');
  ok('defaults are SuRe', DEFAULTS.qmax===sure.qmax && DEFAULTS.Kd===sure.Kd);
  const cal=CHECKS.find(c=>c.id==='cal'), pred=CHECKS.find(c=>c.id==='pred');
  const pc=P({rt_min:cal.rt_min, C0:cal.C0});
  const dCal=analyze(pc).d10.dbc;
  ok('reproduces fitted point 50.3 mg/mL (±1%)', near(dCal, cal.dbc, 0.01), dCal);
  const deRefit=fitDe(P({rt_min:cal.rt_min, C0:cal.C0}), cal.dbc);
  ok('stored DE_FIT matches a fresh fit (±2%)', near(DE_FIT, deRefit, 0.02), [DE_FIT, deRefit]);
  const dPred=analyze(P({rt_min:pred.rt_min, C0:pred.C0})).d10.dbc;
  ok('unfitted 2.4 min point within 15%', near(dPred, pred.dbc, 0.15), dPred);
  console.log(`calibration: DBC10 at 6 min = ${dCal.toFixed(1)} (published 50.3, fitted); at 2.4 min = ${dPred.toFixed(1)} (published ~35, not fitted, ${((dPred-35)/35*100).toFixed(0)}%)`);
}
/* 12. every cited source has text, and every resin points to a real source */
{
  for(const [k,s] of Object.entries(SOURCES)) ok('source '+k+' has text', s.cite && s.cite.length>20);
  for(const [k,r] of Object.entries(RESINS)) ok('resin '+k+' source exists', !!SOURCES[r.src]);
  for(const c of CHECKS) ok('check '+c.id+' source exists', !!SOURCES[c.src]);
}
/* 13. speed: the page recomputes on every slider move */
{
  const t=Date.now(); analyze(P({C0:1})); const ms=Date.now()-t;
  ok('slowest slider case (1 g/L) under 600 ms', ms<600, ms);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
