/* ===========================================================================
   AE Script Catalog — capability dashboard front-end (ESM, zero-dep).

   Reads /data/index.json (manifest), then lazily fetches each script's
   capability/<name>.model.json (+ optional .render.json) on detail open and
   merges them by `name`. See index.html for the full DATA CONTRACT.

   The EXPRESSION-SIM imports the live evaluator from the served expr-eval
   module. The import is lazy + guarded so the page still works (with static
   fallback curves) if that module is not yet present in the pipeline.
   =========================================================================== */

// ---- live evaluator (lazy, guarded) ---------------------------------------
let EXPR = null;         // { evaluate, sample } once loaded
let exprLoadTried = false;

async function loadEvaluator() {
  if (exprLoadTried) return EXPR;
  exprLoadTried = true;
  try {
    const mod = await import('/src/expr-eval/index.mjs');
    if (mod && (typeof mod.evaluate === 'function' || typeof mod.sample === 'function')) {
      EXPR = mod;
    }
  } catch (_e) {
    EXPR = null;          // module not built yet → static fallback
  }
  return EXPR;
}

// ---- small DOM helpers -----------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}
const text = (s) => document.createTextNode(s == null ? '' : String(s));
function fmtVal(v) {
  if (v === null) return 'null';
  if (v === undefined) return '—';
  if (typeof v === 'string') return v === '' ? '""' : v;
  if (typeof v === 'object') { try { return JSON.stringify(v); } catch { return String(v); } }
  return String(v);
}
async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

// ---- state -----------------------------------------------------------------
const state = {
  manifest: null,
  entries: [],         // ManifestEntry[]
  filtered: [],
  selected: null,      // name
  cache: new Map(),    // name -> { model, render }
};

// ===========================================================================
// BOOT
// ===========================================================================
boot();
async function boot() {
  // warm the evaluator in the background (non-blocking)
  loadEvaluator();
  try {
    const manifest = await getJSON('/data/index.json');
    state.manifest = manifest;
    state.entries = Array.isArray(manifest.scripts) ? manifest.scripts.slice() : [];
    state.entries.sort((a, b) =>
      (a.category || '').localeCompare(b.category || '') ||
      (a.name || '').localeCompare(b.name || ''));
    $('#stamp').textContent =
      `${state.entries.length} scripts · ${manifest.generatedAt ? new Date(manifest.generatedAt).toLocaleString() : 'no timestamp'}`;
    buildCategoryFilter();
    applyFilter();
    setStatus(`loaded ${state.entries.length} scripts`);
  } catch (e) {
    $('#stamp').textContent = 'manifest unavailable';
    $('#grid-empty').hidden = false;
    $('#grid-empty').textContent =
      'could not load /data/index.json — the Assemble step has not run yet.';
    setStatus('manifest missing: ' + e.message);
  }
  $('#search').addEventListener('input', applyFilter);
  $('#catfilter').addEventListener('change', applyFilter);
}

function setStatus(s) { $('#status-text').textContent = s; }

function buildCategoryFilter() {
  const cats = [...new Set(state.entries.map((e) => e.category).filter(Boolean))].sort();
  const sel = $('#catfilter');
  for (const c of cats) sel.append(el('option', { value: c }, c));
}

// ===========================================================================
// GRID
// ===========================================================================
function applyFilter() {
  const q = $('#search').value.trim().toLowerCase();
  const cat = $('#catfilter').value;
  state.filtered = state.entries.filter((e) => {
    if (cat && e.category !== cat) return false;
    if (!q) return true;
    return (`${e.name} ${e.category} ${e.ui}`).toLowerCase().includes(q);
  });
  renderGrid();
}

function renderGrid() {
  const grid = $('#grid');
  grid.innerHTML = '';
  $('#grid-empty').hidden = state.filtered.length > 0;
  for (const e of state.filtered) {
    const headless = (e.ui || '').toUpperCase() === 'HEADLESS';
    const card = el('button', {
      class: 'card' + (e.name === state.selected ? ' active' : ''),
      dataset: { name: e.name },
      onclick: () => select(e.name),
    },
      el('span', { class: 'nm' }, e.name || '(unnamed)'),
      el('span', { class: 'cat' }, e.category || 'uncategorized'),
      el('span', { class: 'badges' },
        el('span', { class: 'tag ui' }, e.ui || '?'),
        e.hasScreenshot ? el('span', { class: 'tag shot' }, 'shot') : null,
        headless ? el('span', { class: 'tag headless' }, 'headless') : null,
        e.hasExpressions ? el('span', { class: 'tag expr' }, 'expr') : null,
      ),
    );
    grid.append(card);
  }
}

// ===========================================================================
// DETAIL
// ===========================================================================
async function select(name) {
  state.selected = name;
  renderGrid(); // refresh active highlight
  const entry = state.entries.find((e) => e.name === name);
  const body = $('#detail-body');
  $('#detail-empty').hidden = true;
  body.hidden = false;
  body.innerHTML = '';
  body.append(el('div', { class: 'muted' }, 'loading model…'));
  setStatus(`loading ${name}…`);

  let merged = state.cache.get(name);
  if (!merged) {
    merged = await fetchMerged(entry);
    state.cache.set(name, merged);
  }
  renderDetail(entry, merged);
  setStatus(`viewing ${name}`);
}

async function fetchMerged(entry) {
  const out = { model: null, render: null, errors: [] };
  // model path: contract gives a harness-root-relative path; serve maps
  // /capability/* → harness capability dir. Normalize to a leading-slash URL.
  const modelUrl = toUrl(entry.model) || `/capability/${entry.name}.model.json`;
  try { out.model = await getJSON(modelUrl); }
  catch (e) { out.errors.push('model: ' + e.message); }

  const renderUrl = entry.render ? toUrl(entry.render) : `/capability/${entry.name}.render.json`;
  if (renderUrl) {
    try { out.render = await getJSON(renderUrl); }
    catch (_e) { /* render is optional — silent */ }
  }
  return out;
}

// Turn a harness-root-relative path ("capability/X.json") into a served URL.
function toUrl(p) {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  let s = p.replace(/^\.?\//, '');
  // strip any leading harness segments, keep the served prefixes
  const idx = s.search(/(capability|src|data|assets)\//);
  if (idx >= 0) s = s.slice(idx);
  return '/' + s;
}

function renderDetail(entry, merged) {
  const body = $('#detail-body');
  body.innerHTML = '';
  const m = merged.model || {};
  const r = merged.render || null;
  const name = (m.name || entry.name);
  const ui = (m.ui || entry.ui || '?').toUpperCase();

  // --- header
  body.append(el('div', { class: 'd-head' },
    el('h2', {}, name),
    el('span', { class: 'path' }, m.category || entry.category || ''),
    el('span', { class: 'badges' },
      el('span', { class: 'tag ui' }, ui),
      (r && r.expressionCurves && r.expressionCurves.length) || (m.expressions && m.expressions.length)
        ? el('span', { class: 'tag expr' }, 'expr') : null,
    ),
  ));

  if (merged.errors.length) {
    body.append(el('div', { class: 'expr-err' }, merged.errors.join(' · ')));
  }
  if (!merged.model) {
    body.append(el('p', { class: 'muted' }, 'No capability model available for this script yet.'));
    return;
  }

  // --- (a) screenshot / headless
  body.append(renderScreenshot(name, ui, r));

  // --- (b) CONSUMES
  body.append(renderConsumes(m.consumes));

  // --- (b) CONTROL surfaces
  body.append(renderControls(m.controls));

  // --- (b) FUNCTIONS
  body.append(renderFunctions(m.functions));

  // --- (c) SCRIPT-SIM timeline
  body.append(renderScriptSim(m.scriptSim));

  // --- (d) EXPRESSION-SIM
  body.append(renderExpressions(m.expressions, r));

  // --- notes
  if (Array.isArray(m.notes) && m.notes.length) {
    body.append(el('section', { class: 'block notes' },
      el('h3', {}, 'Notes'),
      el('ul', { class: 'list' }, m.notes.map((n) => el('li', {}, n))),
    ));
  }
}

function renderScreenshot(name, ui, render) {
  const wrap = el('section', { class: 'block' }, el('h3', {}, 'ScriptUI'));
  if (ui === 'HEADLESS') {
    wrap.append(el('div', { class: 'headless-badge' }, 'HEADLESS',
      el('small', {}, 'no ScriptUI surface — runs without a panel')));
    return wrap;
  }
  // Prefer render.screenshot path, else convention /assets/ui/<name>.png
  const src = (render && render.screenshot) ? toUrl(render.screenshot) : `/assets/ui/${name}.png`;
  const shot = el('div', { class: 'shot-wrap' });
  const img = el('img', { alt: `${name} ScriptUI capture`, src });
  img.addEventListener('error', () => {
    shot.replaceWith(el('div', { class: 'headless-badge' }, 'NO CAPTURE',
      el('small', {}, `expected ${src} — RenderEval has not produced it`)));
  });
  shot.append(img);
  wrap.append(shot);
  return wrap;
}

function renderConsumes(c) {
  const s = el('section', { class: 'block consume' }, el('h3', {}, 'Consumes'));
  if (!c) { s.append(el('p', { class: 'muted' }, 'not specified')); return s; }
  const sel = Array.isArray(c.selection) ? c.selection : [];
  s.append(el('div', { class: 'chips' },
    sel.length ? sel.map((k) => el('span', { class: 'chip cyan' }, k))
               : el('span', { class: 'muted' }, 'no selection required')));
  const dl = el('dl', { class: 'kv' });
  if (c.minimum) { dl.append(el('dt', {}, 'minimum'), el('dd', {}, c.minimum)); }
  if (c.description) { dl.append(el('dt', {}, 'reads'), el('dd', {}, c.description)); }
  if (dl.childElementCount) s.append(el('div', { style: 'margin-top:8px' }, dl));
  return s;
}

function renderControls(controls) {
  const s = el('section', { class: 'block control' }, el('h3', {}, 'Control surfaces'));
  if (!Array.isArray(controls) || !controls.length) {
    s.append(el('p', { class: 'muted' }, 'no controls')); return s;
  }
  const tbl = el('table', { class: 'ctl' },
    el('thead', {}, el('tr', {},
      el('th', {}, 'name'), el('th', {}, 'type'),
      el('th', {}, 'default'), el('th', {}, 'role'))),
  );
  const tb = el('tbody');
  for (const ctl of controls) {
    let def = fmtVal(ctl.default);
    if (Array.isArray(ctl.range)) def += `  [${ctl.range[0]}…${ctl.range[1]}]`;
    const roleCell = el('td', { class: 't-role' }, ctl.role || '');
    if (Array.isArray(ctl.options) && ctl.options.length) {
      roleCell.append(el('div', { class: 'muted', style: 'margin-top:3px' },
        'options: ' + ctl.options.join(', ')));
    }
    tb.append(el('tr', {},
      el('td', { class: 't-name' }, ctl.name || '—'),
      el('td', { class: 't-type' }, ctl.type || '—'),
      el('td', { class: 't-def' }, def),
      roleCell,
    ));
  }
  tbl.append(tb);
  s.append(tbl);
  return s;
}

function renderFunctions(fns) {
  const s = el('section', { class: 'block func' }, el('h3', {}, 'Functions'));
  if (!Array.isArray(fns) || !fns.length) { s.append(el('p', { class: 'muted' }, 'not specified')); return s; }
  s.append(el('ul', { class: 'list' }, fns.map((f) => el('li', {}, f))));
  return s;
}

function renderScriptSim(sim) {
  const s = el('section', { class: 'block sim' }, el('h3', {}, 'Script-sim · operation log'));
  if (!sim) { s.append(el('p', { class: 'muted' }, 'no simulation')); return s; }
  s.append(el('div', { class: 'tl-meta' },
    el('div', {}, el('b', {}, 'scenario: '), sim.scenario || '—'),
    sim.inputs ? el('div', {}, el('b', {}, 'inputs: '), sim.inputs) : null,
  ));
  const ops = Array.isArray(sim.operations) ? sim.operations : [];
  if (!ops.length) { s.append(el('p', { class: 'muted' }, 'no operations recorded')); return s; }
  const tl = el('div', { class: 'timeline' });
  ops.forEach((op, i) => {
    tl.append(el('div', { class: 'tl-step' },
      el('span', { class: 'tl-idx' }, String(i + 1).padStart(2, '0')),
      el('span', { class: 'tl-kind' }, op.kind || 'op'),
      text('  '),
      el('span', { class: 'tl-target' }, op.target || ''),
      ('value' in op && op.value !== undefined)
        ? el('span', { class: 'tl-val' }, '  = ' + fmtVal(op.value)) : null,
    ));
  });
  s.append(tl);
  return s;
}

// ---- EXPRESSION-SIM (interactive) -----------------------------------------
function renderExpressions(expressions, render) {
  const s = el('section', { class: 'block expr' }, el('h3', {}, 'Expression-sim · live'));
  const exprs = Array.isArray(expressions) ? expressions : [];
  if (!exprs.length) {
    s.append(el('p', { class: 'muted' }, 'this script writes no AE expressions'));
    return s;
  }
  exprs.forEach((spec, i) => s.append(buildExprCard(spec, i, render)));
  return s;
}

function buildExprCard(spec, idx, render) {
  const card = el('div', { class: 'expr-card' });
  card.append(el('div', { class: 'expr-target' }, spec.target || `expression #${idx + 1}`));
  if (spec.expression) card.append(el('pre', { class: 'expr-src' }, spec.expression));

  const sim = spec.sim || {};
  const binding = spec.controlBinding || null;
  const range = (binding && Array.isArray(binding.range)) ? binding.range
              : (Array.isArray(sim.range) ? sim.range : [0, 1]);
  const [lo, hi] = range;
  const steps = Math.max(2, Number(sim.steps) || 64);
  const variable = sim.variable || 'controlValue';
  const paramLabel = binding ? `${binding.control} · ${binding.param}` : variable;

  if (sim.note) card.append(el('div', { class: 'expr-note' }, sim.note));

  // slider + readout
  const valSpan = el('span', { class: 'val' }, '');
  const slider = el('input', {
    type: 'range', min: String(lo), max: String(hi),
    step: String((hi - lo) / 200 || 0.001), value: String((lo + hi) / 2),
  });
  card.append(el('div', { class: 'expr-ctl' },
    el('label', {}, paramLabel),
    slider,
    valSpan,
  ));

  // canvas
  const canvas = el('canvas', { class: 'curve' });
  card.append(el('div', { class: 'expr-canvas-wrap' }, canvas));
  const out = el('div', { class: 'expr-out' });
  const modeTag = el('span', { class: 'expr-mode' }, '…');
  out.append(modeTag);
  card.append(out);
  const errLine = el('div', { class: 'expr-err' });
  errLine.style.display = 'none';
  card.append(errLine);

  // Static fallback curve (from render.expressionCurves[] matched by target).
  const fallback = pickFallbackCurve(render, spec.target);

  // Render pipeline for this card.
  const ctx = { spec, lo, hi, steps, variable, canvas, valSpan, out, modeTag, errLine, fallback };
  const onInput = () => redrawExpr(ctx, Number(slider.value));
  slider.addEventListener('input', onInput);

  // initial draw (after evaluator attempt resolves)
  loadEvaluator().then(() => onInput());
  // also draw immediately with whatever is available (fallback or sync eval)
  onInput();

  return card;
}

function pickFallbackCurve(render, target) {
  if (!render || !Array.isArray(render.expressionCurves)) return null;
  return render.expressionCurves.find((c) => c.target === target) || null;
}

/**
 * Recompute + redraw a single expression card.
 *
 * The live evaluator (src/expr-eval/index.mjs) exposes:
 *   sample(exprSource, baseCtx, plan)
 *     plan = { variable:'controlValue'|'time', range:[min,max], steps,
 *              bindControl?, bindParam? }
 *     -> [{ x, y:(number|null), dim, error? }]   (y is null on per-point error)
 *   evaluate(exprSource, ctx) -> value | { __exprError }
 *
 * Strategy, in order of preference:
 *   1. EXPR.sample — sweeps the variable, binds the slider into the right
 *      effect param, returns curve points.
 *   2. render.expressionCurves fallback (static, pipeline-precomputed).
 */
function redrawExpr(ctx, controlValue) {
  const { spec, lo, hi, steps, variable, valSpan, modeTag, errLine } = ctx;
  valSpan.textContent = fmtNum(controlValue);
  errLine.style.display = 'none';

  let pts = null;       // [{x,y}]
  let mode = EXPR ? 'fallback' : 'fallback (no evaluator)';
  let curY = null;

  // 1: live evaluation via sample()
  if (EXPR && typeof EXPR.sample === 'function' && typeof spec.expression === 'string') {
    try {
      const binding = spec.controlBinding || null;
      const plan = { variable, range: [lo, hi], steps };
      if (binding) {
        if (binding.control) plan.bindControl = binding.control;
        if (binding.param) plan.bindParam = binding.param;
      }
      const swept = EXPR.sample(spec.expression, exprBaseCtx(spec), plan);
      if (Array.isArray(swept) && swept.length) {
        pts = swept
          .filter((p) => p && p.y != null && Number.isFinite(p.y))
          .map((p) => ({ x: +p.x, y: +p.y }));
        mode = 'live · sample';
        const firstErr = swept.find((p) => p && p.error);
        if (!pts.length && firstErr) {
          errLine.textContent = 'eval error: ' + firstErr.error;
          errLine.style.display = '';
        }
        // current y at the slider position (nearest sampled point)
        curY = nearestY(pts, controlValue);
      }
    } catch (e) {
      errLine.textContent = 'eval error: ' + e.message;
      errLine.style.display = '';
      pts = null;
    }
  }

  // 2: static fallback
  if ((!pts || !pts.length) && ctx.fallback &&
      Array.isArray(ctx.fallback.samples) && ctx.fallback.samples.length) {
    pts = normalizeSamples(ctx.fallback.samples);
    curY = nearestY(pts, controlValue);
  }

  modeTag.textContent = mode;
  drawCurve(ctx, pts, controlValue, curY);
}

/**
 * Build the base EvalCtx the evaluator expects. We seed a single effect named
 * after the binding control so sample() can write the swept value into it; for
 * unbound/time sweeps sample() falls back to a synthetic control + global.
 */
function exprBaseCtx(spec) {
  const ctx = { effects: {} };
  const b = spec && spec.controlBinding;
  if (b && b.control) {
    const param = b.param || 'Slider';
    ctx.effects[b.control] = { [param]: 0 };
  }
  return ctx;
}

function nearestY(pts, x) {
  if (!pts || !pts.length) return null;
  let best = pts[0], bd = Infinity;
  for (const p of pts) { const d = Math.abs(p.x - x); if (d < bd) { bd = d; best = p; } }
  return best.y;
}

function normalizeSamples(arr) {
  if (!Array.isArray(arr)) return null;
  const out = [];
  for (const p of arr) {
    if (p == null) continue;
    if (Array.isArray(p) && p.length >= 2) out.push({ x: +p[0], y: +p[1] });
    else if (typeof p === 'object' && 'x' in p && 'y' in p) out.push({ x: +p.x, y: +p.y });
    else if (typeof p === 'number') out.push({ x: out.length, y: p });
  }
  return out.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function fmtNum(n) {
  if (!Number.isFinite(n)) return String(n);
  const a = Math.abs(n);
  if (a !== 0 && (a < 1e-3 || a >= 1e5)) return n.toExponential(2);
  return (Math.round(n * 1000) / 1000).toString();
}

// ---- canvas curve drawing --------------------------------------------------
function drawCurve(ctx, pts, controlValue, curY) {
  const { canvas, out } = ctx;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 360, H = canvas.clientHeight || 150;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const css = getComputedStyle(document.documentElement);
  const cLine = css.getPropertyValue('--line').trim() || '#1e2530';
  const cViolet = css.getPropertyValue('--violet').trim() || '#9a8cff';
  const cGreen = css.getPropertyValue('--green').trim() || '#5fb88a';
  const cDim = css.getPropertyValue('--ink-faint').trim() || '#424b5a';

  const pad = { l: 38, r: 8, t: 8, b: 18 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;

  // reset outputs that aren't the mode tag
  [...out.querySelectorAll('.stat')].forEach((n) => n.remove());

  if (!pts || !pts.length) {
    g.fillStyle = cDim; g.font = '11px monospace';
    g.fillText('no curve data', pad.l, pad.t + ih / 2);
    return;
  }

  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  let xmin = Math.min(...xs), xmax = Math.max(...xs);
  let ymin = Math.min(...ys), ymax = Math.max(...ys);
  if (xmin === xmax) { xmax = xmin + 1; }
  if (ymin === ymax) { ymax = ymin + 1; ymin -= 1; }
  const ypad = (ymax - ymin) * 0.08; ymin -= ypad; ymax += ypad;

  const X = (x) => pad.l + ((x - xmin) / (xmax - xmin)) * iw;
  const Y = (y) => pad.t + ih - ((y - ymin) / (ymax - ymin)) * ih;

  // grid
  g.strokeStyle = cLine; g.lineWidth = 1; g.font = '9px monospace'; g.fillStyle = cDim;
  for (let i = 0; i <= 4; i++) {
    const yy = pad.t + (ih * i) / 4;
    g.beginPath(); g.moveTo(pad.l, yy); g.lineTo(W - pad.r, yy); g.stroke();
    const val = ymax - ((ymax - ymin) * i) / 4;
    g.fillText(fmtNum(val), 2, yy + 3);
  }
  // zero line
  if (ymin < 0 && ymax > 0) {
    g.strokeStyle = cDim; g.setLineDash([3, 3]);
    g.beginPath(); g.moveTo(pad.l, Y(0)); g.lineTo(W - pad.r, Y(0)); g.stroke();
    g.setLineDash([]);
  }

  // curve
  g.strokeStyle = cViolet; g.lineWidth = 1.6; g.beginPath();
  pts.forEach((p, i) => { const px = X(p.x), py = Y(p.y); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.stroke();

  // area fill
  g.lineTo(X(pts[pts.length - 1].x), pad.t + ih);
  g.lineTo(X(pts[0].x), pad.t + ih);
  g.closePath();
  g.fillStyle = hexA(cViolet, 0.10); g.fill();

  // marker at controlValue
  let markY = curY;
  if (markY == null) {
    // nearest sample to controlValue
    let best = pts[0], bd = Infinity;
    for (const p of pts) { const d = Math.abs(p.x - controlValue); if (d < bd) { bd = d; best = p; } }
    markY = best.y;
  }
  const mx = X(Math.min(Math.max(controlValue, xmin), xmax));
  g.strokeStyle = cGreen; g.lineWidth = 1; g.setLineDash([2, 3]);
  g.beginPath(); g.moveTo(mx, pad.t); g.lineTo(mx, pad.t + ih); g.stroke(); g.setLineDash([]);
  g.fillStyle = cGreen;
  g.beginPath(); g.arc(mx, Y(markY), 3.2, 0, Math.PI * 2); g.fill();

  // readout stats
  out.append(el('span', { class: 'stat' }, 'x=', el('b', {}, fmtNum(controlValue))));
  out.append(el('span', { class: 'stat' }, 'y=', el('b', {}, fmtNum(markY))));
  out.append(el('span', { class: 'stat' }, `range y:[${fmtNum(Math.min(...ys))}, ${fmtNum(Math.max(...ys))}]`));
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  if (h.length < 6) return hex;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
