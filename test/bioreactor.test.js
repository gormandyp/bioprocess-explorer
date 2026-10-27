// Model tests for bioreactor.html. Run: node test/bioreactor.test.js
// Loads the first <script> block (the engine) from the page, so the page and the tests share one copy of the math.
const fs=require('fs'), vm=require('vm'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','bioreactor.html'),'utf8');
const m=html.match(/<script>\n([\s\S]*?)<\/script>/);
if(!m){ console.error('engine script not found'); process.exit(1); }
vm.runInThisContext(m[1], {filename:'bioreactor.html (engine)'});
const BRX=globalThis.BRX;
if(!BRX){ console.error('BRX not exposed'); process.exit(1); }
const {rates, simulate, analyze, fitBeta, DEFAULTS, CLONES, CHECKS, SOURCES, BETA_FIT, MW_IGG, AVOGADRO}=BRX;

let pass=0, fail=0;
function ok(name, cond, extra){
  if(cond) pass++;
  else { fail++; console.log('FAIL:', name, extra===undefined?'':JSON.stringify(extra)); }
}
function near(a,b,tol){ return Math.abs(a-b)<=tol*Math.max(1e-12,Math.abs(b)); }
const P=o=>Object.assign({}, DEFAULTS, o||{});
const last=a=>a[a.length-1];

/* 1. rate expressions by hand at day 0 */
{
  const p=P(), r=rates(p,[p.X0,p.S0,p.Cstar,0]);
  const mu=p.muMax*p.S0/(p.Ks+p.S0)*p.Cstar/(p.KO2+p.Cstar);
  ok('mu hand calc', near(r.mu, mu, 1e-12), [r.mu, mu]);
  ok('kd while fed', near(r.kd, p.kd0+p.kdStarve*p.Ks/(p.Ks+p.S0), 1e-12));
  ok('OUR = qO2 X with cells/mL -> cells/L', near(r.our, 4e-10*0.5e6*1e3, 1e-12), r.our);
  ok('OTR zero at saturation', r.otr===0);
  ok('no growth without glucose', rates(p,[1,0,p.Cstar,0]).mu===0);
  ok('no growth without oxygen', rates(p,[1,p.S0,0,0]).mu===0);
  ok('starvation death = kd0 + kdStarve', near(rates(p,[1,0,p.Cstar,0]).kd, p.kd0+p.kdStarve, 1e-12));
}
/* 2. pure exponential growth: Ks = 0, KO2 = 0, no death -> X = X0 exp(mu_max t) */
{
  const p=P({Ks:0, KO2:0, kd0:0, kdStarve:0, S0:1e6, kLa:1e3, qO2:0, days:4});
  const s=simulate(p);
  const exact=p.X0*Math.exp(p.muMax*96);
  ok('exponential growth (RK4) to 1e-8', near(last(s.X), exact, 1e-8), [last(s.X), exact]);
  ok('doubling time 20 h', near(Math.LN2/p.muMax, 20, 1e-12));
}
/* 3. yield balance: with no death, cells made = Y x glucose eaten, at every saved point */
{
  const p=P({kd0:0, kdStarve:0});
  const s=simulate(p);
  let worst=0; for(let i=0;i<s.t.length;i++) worst=Math.max(worst, Math.abs((s.X[i]-p.X0) - p.Yxs*(p.S0-s.S[i])));
  ok('X - X0 = Y (S0 - S)', worst<1e-6, worst);
  ok('final cells hit the glucose limit X0 + Y S0', near(last(s.X), p.X0+p.Yxs*p.S0, 1e-3), last(s.X));
}
/* 4. Luedeking-Piret: P = alpha (X - X0) + beta * integral of X dt when there is no death */
{
  const p=P({kd0:0, kdStarve:0, alpha:7.65e-7, beta:7.68e-8});
  const s=simulate(p);
  const expect=(p.alpha*(last(s.X)-p.X0) + p.beta*s.intX)*1e3;
  ok('Luedeking-Piret integral', near(last(s.P), expect, 1e-4), [last(s.P), expect]);
}
/* 5. oxygen steady state with frozen cells: C -> C* - qO2 X / kLa */
{
  const p=P({muMax:0, kd0:0, kdStarve:0, X0:2, days:2});
  const s=simulate(p);
  const css=p.Cstar - p.qO2*p.X0*1e9/p.kLa;
  ok('O2 steady state', near(last(s.C), css, 1e-6), [last(s.C), css]);
  // first-order approach: after one time constant 1/kLa, 63.2% of the way
  const s2=simulate(Object.assign({}, p, {days:1/(p.kLa*24), C0:0}), {dt:1e-4});
  ok('O2 rises 63.2% in 1/kLa', near(last(s2.C), css*(1-Math.exp(-1)), 1e-4), [last(s2.C), css*(1-Math.exp(-1))]);
}
/* 6. the oxygen ceiling kLa C* / qO2 */
{
  const p=P({S0:10, Yxs:3, kLa:3, days:14});
  const r=analyze(p);
  ok('ceiling formula', near(r.xO2, 3*0.21/(4e-10*1e9), 1e-12), r.xO2);
  ok('cells never pass the oxygen ceiling', r.peakX<=r.xO2*1.001, [r.peakX, r.xO2]);
  ok('O2-limited run ends close to the ceiling', r.peakX>0.9*r.xO2, [r.peakX, r.xO2]);
  ok('O2-limited run flags low DO', isFinite(r.tLowDO));
}
/* 7. physical bounds */
for(const c of [{}, {kLa:1}, {kLa:40}, {S0:1, days:14}, {X0:2, qO2:8e-10}, {kdStarve:0.08}]){
  const s=simulate(P(c));
  ok('no negatives '+JSON.stringify(c), Math.min(...s.X,...s.S,...s.C,...s.P)>=0);
  ok('DO never above C* '+JSON.stringify(c), Math.max(...s.C)<=P(c).Cstar*(1+1e-9));
  let mono=true; for(let i=1;i<s.P.length;i++) if(s.P[i]<s.P[i-1]-1e-12) mono=false;
  ok('titer never falls '+JSON.stringify(c), mono);
  let glc=true; for(let i=1;i<s.S.length;i++) if(s.S[i]>s.S[i-1]+1e-12) glc=false;
  ok('glucose never rises '+JSON.stringify(c), glc);
}
/* 8. step-size convergence */
{
  const a=analyze(P()).titer, b=analyze(P(),{dt:0.005}).titer;
  ok('halving the step changes titer < 0.1%', near(a,b,1e-3), [a,b]);
}
/* 9. direction of effects */
{
  const A=o=>analyze(P(o));
  ok('more glucose -> more cells', A({S0:8}).peakX > A({S0:3}).peakX);
  ok('higher kLa -> higher lowest DO', A({kLa:20}).minDO > A({kLa:5}).minDO);
  ok('low kLa caps the cells', A({kLa:2}).peakX < A({kLa:20}).peakX);
  ok('higher qO2 -> lower ceiling', A({qO2:8e-10}).xO2 < A({qO2:2e-10}).xO2);
  ok('higher yield -> more cells', A({Yxs:2}).peakX > A({Yxs:1}).peakX);
  ok('faster starvation death -> fewer cells at harvest', A({kdStarve:0.06}).viableEnd < A({kdStarve:0.01}).viableEnd);
  ok('research clone makes far less', A({alpha:7.65e-7, beta:7.68e-8}).titer < 0.1*A().titer);
}
/* 10. calibration and unit conversions */
{
  ok('default clone reaches 1.0 g/L (fit)', near(analyze(P()).titer, 1.0, 0.005), analyze(P()).titer);
  ok('stored BETA_FIT matches a fresh fit (±1%)', near(BETA_FIT, fitBeta(P(), 1.0), 0.01), [BETA_FIT, fitBeta(P(),1.0)]);
  const r=analyze(P());
  ok('qP 73.9 pg/cell/day', near(r.qpPgDay, BETA_FIT*1e6*24, 1e-12) && near(r.qpPgDay, 73.9, 0.01), r.qpPgDay);
  ok('molecules per cell per second', near(r.moleculesPerSec, BETA_FIT*1e-6/150000*6.02214076e23/3600, 1e-12), r.moleculesPerSec);
  ok('qO2 inside cited CHO range', DEFAULTS.qO2>=2e-10 && DEFAULTS.qO2<=8e-10);
  ok('kLa inside cited flask range', DEFAULTS.kLa>=8 && DEFAULTS.kLa<=42);
  ok('yield inside cited range', DEFAULTS.Yxs>=0.72 && DEFAULTS.Yxs<=2.79);
  ok('research clone uses published alpha, beta', CLONES.research.alpha===7.65e-7 && CLONES.research.beta===7.68e-8);
  console.log(`calibration: titer ${r.titer.toFixed(3)} g/L (fit to 1.0); peak ${r.peakX.toFixed(2)}e6 cells/mL (older batch ~3e6, context); qP ${r.qpPgDay.toFixed(1)} pg/cell/day`);
}
/* 11. every source has text */
{
  for(const [k,s] of Object.entries(SOURCES)) ok('source '+k+' has text', s.cite && s.cite.length>20);
  for(const c of CHECKS) ok('check '+c.id+' source exists', !!SOURCES[c.src]);
}
/* 12. speed: the page recomputes on every slider move */
{
  const t=Date.now(); analyze(P({kLa:40, days:14})); const ms=Date.now()-t;
  ok('slowest slider case under 300 ms', ms<300, ms);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
