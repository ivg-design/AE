/**
 * Dashboard data assembler.
 *
 * Merges capability/<name>.model.json + capability/<name>.render.json into one
 * per-script record, validates each against the frozen schema, and writes the
 * manifest to dashboard/data/index.json (this directory — the only owned path).
 *
 * Also prints a sanity report to stdout (models valid, screenshots present +
 * dimensions, expression-curve coverage, and scripts missing UI capture or with
 * empty expressions).
 *
 * ESM. Run: node dashboard/data/assemble.mjs
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  validateCapabilityModel,
  validateRenderArtifacts
} from '../../src/capability/schema.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // dashboard/data
const HARNESS_ROOT = path.resolve(HERE, '..', '..');
const CAPABILITY_DIR = path.join(HARNESS_ROOT, 'capability');
const ASSETS_UI_DIR = path.join(HARNESS_ROOT, 'dashboard', 'assets', 'ui');
const OUT = path.join(HERE, 'index.json');

/** Read the PNG IHDR width/height without any image library. */
function pngDimensions(file) {
  try {
    const buf = readFileSync(file);
    // PNG signature (8) + length(4) + "IHDR"(4) then width(4) height(4) BE.
    if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') return null;
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

function readJSON(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

// --- discover script names from *.model.json -------------------------------
const modelFiles = readdirSync(CAPABILITY_DIR).filter((f) => f.endsWith('.model.json'));
const names = modelFiles.map((f) => f.slice(0, -'.model.json'.length)).sort();

const scripts = [];
const report = {
  total: names.length,
  modelsValid: 0,
  modelsInvalid: [],
  renderPresent: 0,
  renderInvalid: [],
  screenshots: [],
  withExpressionCurves: 0,
  missingUiCapture: [],
  emptyExpressions: []
};

for (const name of names) {
  const modelPath = path.join(CAPABILITY_DIR, `${name}.model.json`);
  const renderPath = path.join(CAPABILITY_DIR, `${name}.render.json`);

  const model = readJSON(modelPath);
  const mv = validateCapabilityModel(model);
  if (mv.ok) report.modelsValid += 1;
  else report.modelsInvalid.push({ name, errors: mv.errors });

  let render = null;
  if (existsSync(renderPath)) {
    render = readJSON(renderPath);
    report.renderPresent += 1;
    const rv = validateRenderArtifacts(render);
    if (!rv.ok) report.renderInvalid.push({ name, errors: rv.errors });
  }

  // --- screenshot resolution -----------------------------------------------
  // Convention: dashboard/assets/ui/<name>.png  (referenced as assets/ui/<name>.png)
  const shotFile = path.join(ASSETS_UI_DIR, `${name}.png`);
  const shotRel = `assets/ui/${name}.png`;
  const hasScreenshot = existsSync(shotFile);
  let dims = null;
  if (hasScreenshot) {
    dims = pngDimensions(shotFile);
    report.screenshots.push({ name, ...(dims || { width: null, height: null }) });
  }

  // --- expression coverage -------------------------------------------------
  const modelExprs = Array.isArray(model.expressions) ? model.expressions : [];
  const curves = render && Array.isArray(render.expressionCurves) ? render.expressionCurves : [];
  const hasExpressions = modelExprs.length > 0;
  const hasCurves = curves.length > 0;
  if (hasCurves) report.withExpressionCurves += 1;

  // A script with a UI (DIALOG/PANEL/PALETTE) but no screenshot is "missing capture".
  const wantsUi = model.ui && model.ui !== 'HEADLESS';
  if (wantsUi && !hasScreenshot) report.missingUiCapture.push(name);

  if (!hasExpressions) report.emptyExpressions.push(name);

  // --- merged per-script record --------------------------------------------
  scripts.push({
    // identity + contract-required manifest fields
    name: model.name ?? name,
    category: model.category ?? 'uncategorized',
    ui: model.ui ?? 'HEADLESS',
    model: `capability/${name}.model.json`,
    render: render ? `capability/${name}.render.json` : null,
    hasExpressions,
    hasScreenshot,
    // dashboard-convenience / sanity additions (additive)
    screenshot: hasScreenshot ? shotRel : null,
    screenshotDims: dims,
    hasExpressionCurves: hasCurves,
    expressionCount: modelExprs.length,
    curveCount: curves.length,
    controlCount: Array.isArray(model.controls) ? model.controls.length : 0,
    modelValid: mv.ok,
    // full merged payload so the manifest is self-contained
    consumes: model.consumes ?? null,
    controls: model.controls ?? [],
    functions: model.functions ?? [],
    scriptSim: model.scriptSim ?? null,
    expressions: modelExprs,
    notes: model.notes ?? [],
    render_artifacts: render
      ? {
          screenshot: render.screenshot ?? null,
          uiTreePath: render.uiTreePath ?? null,
          expressionCurves: curves,
          notes: render.notes ?? []
        }
      : null
  });
}

// --- sort by category then name --------------------------------------------
scripts.sort(
  (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
);

const manifest = {
  generatedAt: new Date().toISOString(),
  count: scripts.length,
  scripts
};

writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');

// --- emit sanity report (stdout) -------------------------------------------
const lines = [];
lines.push(`# Dashboard manifest assembled -> ${path.relative(HARNESS_ROOT, OUT)}`);
lines.push(`scripts:                 ${report.total}`);
lines.push(`models valid:            ${report.modelsValid}/${report.total}`);
lines.push(`render files present:    ${report.renderPresent}/${report.total}`);
lines.push(`screenshots present:     ${report.screenshots.length}`);
lines.push(`scripts w/ expr curves:  ${report.withExpressionCurves}`);
if (report.modelsInvalid.length) {
  lines.push(`INVALID MODELS (${report.modelsInvalid.length}):`);
  for (const m of report.modelsInvalid) lines.push(`  - ${m.name}: ${m.errors.join('; ')}`);
}
if (report.renderInvalid.length) {
  lines.push(`INVALID RENDER (${report.renderInvalid.length}):`);
  for (const r of report.renderInvalid) lines.push(`  - ${r.name}: ${r.errors.join('; ')}`);
}
lines.push(`screenshot dimensions:`);
for (const s of report.screenshots) {
  lines.push(`  - ${s.name}: ${s.width ?? '?'}x${s.height ?? '?'}`);
}
lines.push(`missing UI capture (non-HEADLESS, no png) [${report.missingUiCapture.length}]:`);
lines.push(report.missingUiCapture.length ? `  ${report.missingUiCapture.join(', ')}` : '  (none)');
lines.push(`empty expressions (model.expressions == []) [${report.emptyExpressions.length}]:`);
lines.push(report.emptyExpressions.length ? `  ${report.emptyExpressions.join(', ')}` : '  (none)');

console.log(lines.join('\n'));
