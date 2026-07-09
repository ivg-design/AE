// Reproduce bug #3: Rectangulator's bottom-right corner "not rectangulating".
// Run the real script, capture (a) the seeding setValue ops (is BR seeded?) and
// (b) the exact path expression applied. Then evaluate that path expression with
// only the Bottom-Right control raised and confirm the BR vertices actually round.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { runFixtureScenario } from './src/index.js';
import fixture from './fixtures/layers/Rectangulator.fixture.js';

const code = readFileSync(
  '/Users/ivg/github/ae-script-catalog/ae/packages/ae-scripts/src/layers/Rectangulator.jsx',
  'utf8'
);

const success = fixture.scenarios.find(s => s.kind === 'success');
const res = await runFixtureScenario(success.host, code, success.actions || [{ type: 'run' }]);
console.log('run error:', res.error ? (res.error.message || String(res.error)) : 'none');
const ops = res.operations || [];

// --- (a) seeding: which corner controls were setValue'd, and to what ---
const seeds = ops.filter(o => o.kind === 'setValue' && o.meta && /Corner Rounding/.test(o.meta.name || (o.target || '')));
console.log('\ncorner setValue (seeding) ops:',
  JSON.stringify(ops.filter(o => o.kind === 'setValue').map(o => ({ t: o.target, n: o.meta && o.meta.name, v: o.value })).filter(x => /Corner|Rounding|Width|Height/i.test(JSON.stringify(x)))));

// --- (b) grab the path expression that got applied (contains createPath) ---
let pathExpr = null;
for (const o of ops) {
  const e = (o.value && o.value.expression) || o.expression || (o.meta && o.meta.expression) || (typeof o.value === 'string' ? o.value : '');
  if (typeof e === 'string' && e.indexOf('createPath') !== -1 && e.indexOf('brPercent') !== -1) { pathExpr = e; break; }
}
console.log('\npath expression captured from setExpression:', pathExpr ? 'yes (' + pathExpr.length + ' chars)' : 'NO');

if (!pathExpr) {
  // fall back: extract the literal path expression from source between `path:` and `anchorPoint:`
  const m = code.match(/path:\s*"([\s\S]*?)",\s*\n\s*\/\/ Anchor point/);
  if (m) { pathExpr = JSON.parse('"' + m[1].replace(/"\s*\+\s*\n\s*"/g, '') + '"'); console.log('  (used source-extracted path expr, ' + pathExpr.length + ' chars)'); }
}

// --- evaluate the path expression with a mock AE expression environment ---
// `controls` is an ordered array of {name, value} mirroring the pseudo-effect
// params, so we model BOTH name access ctl("X").value AND index access
// ctl(i).name / ctl(i).value + ctl.numProperties (exactly what AE exposes).
function evalExpr(expr, controls) {
  let captured = null;
  const mkCtl = () => {
    const byName = {};
    for (const c of controls) byName[String(c.name).replace(/\s+$/, '')] = c.value;
    const fn = (sel) => {
      if (typeof sel === 'number') {
        const c = controls[sel - 1];
        if (!c) throw new Error('no index ' + sel);
        return { name: c.name, value: c.value };
      }
      const key = String(sel).replace(/\s+$/, '');
      if (!(key in byName)) throw new Error('no control ' + sel);
      return { value: byName[key], name: sel };
    };
    fn.numProperties = controls.length;
    return fn;
  };
  const sandbox = {
    effect: () => mkCtl(),
    createPath: (v, i, o, closed) => { captured = { vertices: v, inTangents: i, outTangents: o, closed }; },
    Math, thisProperty: {},
  };
  vm.createContext(sandbox);
  try { vm.runInContext(expr, sandbox, { timeout: 2000 }); }
  catch (e) { return { error: e.message }; }
  return captured;
}

// Build the pseudo-effect control list. `brName` lets us simulate AE truncating
// the over-long "Bottom Right Left Corner Rounding" name.
function controlsWith(active, brName) {
  const v = (n) => (active === n ? 100 : 0);
  return [
    { name: 'Rectangle Width (px)', value: 100 },
    { name: 'Rectangle Height (px)', value: 100 },
    { name: 'Top Left Corner Rounding', value: v('tl') },
    { name: 'Top Right Corner Rounding', value: v('tr') },
    { name: brName, value: v('br') },
    { name: 'Bottom Left Corner Rounding', value: v('bl') },
    { name: 'Anchor Point ', value: 5 },
  ];
}

function cornerRounds(r, corner) {
  if (!r || r.error) return `EVAL ERROR ${r && r.error}`;
  const idx = { tl: [0, 1], tr: [2, 3], br: [4, 5], bl: [6, 7] }[corner];
  const v0 = r.vertices[idx[0]], v1 = r.vertices[idx[1]];
  const t0 = r.outTangents[idx[0]], t1 = r.inTangents[idx[1]];
  const rounded = (v0[0] !== v1[0] || v0[1] !== v1[1]) && (Math.abs(t0[0]) + Math.abs(t0[1]) > 0);
  return rounded ? 'ROUNDS ✅' : 'NOT ROUNDED ❌';
}

// Verify: for a given active corner + BR control name, ONLY that corner rounds.
function checkIsolation(active, brName) {
  const r = evalExpr(pathExpr, controlsWith(active, brName));
  if (!r || r.error) return `EVAL ERROR ${r && r.error}`;
  const results = ['tl', 'tr', 'br', 'bl'].map(c => [c, cornerRounds(r, c)]);
  const shouldRound = results.filter(([c]) => c === active).every(([, s]) => s.includes('ROUNDS'));
  const othersFlat = results.filter(([c]) => c !== active).every(([, s]) => s.includes('NOT'));
  return `${active} rounds:${shouldRound ? '✅' : '❌'}  others-flat:${othersFlat ? '✅' : '❌'}   [${results.map(([c, s]) => c + (s.includes('ROUNDS') ? '●' : '·')).join(' ')}]`;
}

console.log('\n=== FIXED path expression (keyword scan) ===');
console.log('-- baked name "Bottom Right Left Corner Rounding" (full) --');
for (const c of ['tl', 'tr', 'br', 'bl']) console.log(`  ${c}: ${checkIsolation(c, 'Bottom Right Left Corner Rounding')}`);
console.log('-- AE-truncated BR name "Bottom Right Left Corner Roundi" (31 chars) --');
for (const c of ['tl', 'tr', 'br', 'bl']) console.log(`  ${c}: ${checkIsolation(c, 'Bottom Right Left Corner Roundi')}`);
console.log('-- if the name were corrected to "Bottom Right Corner Rounding" --');
for (const c of ['tl', 'tr', 'br', 'bl']) console.log(`  ${c}: ${checkIsolation(c, 'Bottom Right Corner Rounding')}`);
