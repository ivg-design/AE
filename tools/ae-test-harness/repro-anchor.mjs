// Diagnose Rectangulator's anchor dropdown. Capture the applied anchorPoint
// expression and evaluate it with the popup returning a 1-based INDEX (what AE
// docs say) and a LABEL STRING (a real possibility), to see which the code
// tolerates.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { runFixtureScenario } from './src/index.js';
import fixture from './fixtures/layers/Rectangulator.fixture.js';

const code = readFileSync('/Users/ivg/github/ae-script-catalog/ae/packages/ae-scripts/src/layers/Rectangulator.jsx', 'utf8');
const success = fixture.scenarios.find(s => s.kind === 'success');
const res = await runFixtureScenario(success.host, code, success.actions || [{ type: 'run' }]);
const ops = res.operations || [];

let anchorExpr = null;
for (const o of ops) {
  const e = (o.value && o.value.expression) || o.expression || (o.meta && o.meta.expression) || (typeof o.value === 'string' ? o.value : '');
  if (typeof e === 'string' && e.indexOf('Top Left') !== -1 && e.indexOf('result') !== -1 && e.indexOf('createPath') === -1) { anchorExpr = e; break; }
}
console.log('anchor expression captured:', anchorExpr ? 'yes' : 'NO');

function evalAnchor(anchorValue, popupName) {
  const controls = [
    { name: 'Rectangle Width (px)', value: 100 },
    { name: 'Rectangle Height (px)', value: 100 },
    { name: popupName, value: anchorValue },
  ];
  const byName = {};
  for (const c of controls) byName[String(c.name).replace(/\s+$/, '')] = c.value;
  const mkCtl = () => {
    const fn = (sel) => {
      if (typeof sel === 'number') { const c = controls[sel - 1]; if (!c) throw new Error('idx'); return { name: c.name, value: c.value }; }
      const k = String(sel).replace(/\s+$/, ''); if (!(k in byName)) throw new Error('name'); return { value: byName[k], name: sel };
    };
    fn.numProperties = controls.length;
    return fn;
  };
  const sandbox = { effect: () => mkCtl(), Math, thisProperty: {} };
  vm.createContext(sandbox);
  try { const r = vm.runInContext(anchorExpr, sandbox, { timeout: 2000 }); return r; }
  catch (e) { return 'ERR ' + e.message; }
}

const EXPECT = { 1: [-50, -50], 2: [0, -50], 3: [50, -50], 4: [-50, 0], 5: [0, 0], 6: [50, 0], 7: [-50, 50], 8: [0, 50], 9: [50, 50] };
const LABELS = { 1: 'Top Left', 2: 'Top Center', 3: 'Top Right', 4: 'Center Left', 5: 'Center', 6: 'Center Right', 7: 'Bottom Left', 8: 'Bottom Center', 9: 'Bottom Right' };

console.log('\n-- popup returns a 1-based INDEX number (AE-documented behavior) --');
for (let i = 1; i <= 9; i++) {
  const r = evalAnchor(i, 'Anchor Point');
  const ok = JSON.stringify(r) === JSON.stringify(EXPECT[i]);
  console.log(`  value ${i} (${LABELS[i]}): result=${JSON.stringify(r)}  ${ok ? 'OK' : '❌'}`);
}
console.log('\n-- popup returns the LABEL STRING (if AE did that, code would break) --');
for (let i = 1; i <= 9; i++) {
  const r = evalAnchor(LABELS[i], 'Anchor Point');
  const ok = JSON.stringify(r) === JSON.stringify(EXPECT[i]);
  console.log(`  "${LABELS[i]}": result=${JSON.stringify(r)}  ${ok ? 'OK' : '❌ falls back to Center'}`);
}
