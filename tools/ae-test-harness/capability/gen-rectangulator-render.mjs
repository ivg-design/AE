/**
 * Generates Rectangulator.render.json by evaluating expression curves.
 *
 * ESM script — run with: node gen-rectangulator-render.mjs
 *
 * The original AE expressions use bare (var-less) assignments that rely on
 * AE's sloppy global scope. The expr-eval runtime uses "use strict", so bare
 * assignments throw ReferenceError and fall into the catch block (returning the
 * fallback createPath). We therefore use clean adapter expressions that
 * faithfully reproduce the output logic using explicit var declarations.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const harnessRoot = resolve(__dirname, '..');

const { sample, toCurveSamples } = await import(join(harnessRoot, 'src/expr-eval/index.mjs'));
const { validateRenderArtifacts } = await import(join(harnessRoot, 'src/capability/schema.js'));

const modelPath = join(__dirname, 'Rectangulator.model.json');
const model = JSON.parse(readFileSync(modelPath, 'utf8'));

// ---------------------------------------------------------------------------
// Expression 0: ADBE Vector Shape bezier path
// Sweeps Rectangle Width 0–1000 px (height=200, all corners=0%, anchor=Center).
// Output: first vertex x coordinate = -width/2 (top-left corner of the rect).
// Original expression uses bare assignments and createPath() (AE-only built-in).
// Adapter reproduces the vertex computation with var declarations.
// ---------------------------------------------------------------------------

const expr0Adapter = `(function() {
  var width = effect("Width")("Slider");
  var h = effect("Height")("Slider") / 2;
  var w = width / 2;
  // With all corner roundness = 0%: tl=0, so tlx1 = -w, tly1 = -h
  // First vertex in the 8-vertex path = top-left corner
  return -w;
})()`;

const ctx0 = {
  effects: {
    'Width': { Slider: 100 },
    'Height': { Slider: 200 },
    'Top Left Roundness %': { Slider: 0 },
    'Top Right Roundness %': { Slider: 0 },
    'Bottom Right Roundness %': { Slider: 0 },
    'Bottom Left Roundness %': { Slider: 0 },
    'Position Offset': { Point: [0, 0] },
    'Anchor Point': { Menu: 5 },
  },
};

const pts0 = sample(expr0Adapter, ctx0, {
  variable: 'controlValue',
  range: [0, 1000],
  steps: 41,
  bindControl: 'Width',
  bindParam: 'Slider',
  component: 0,
});
const samples0 = toCurveSamples(pts0);
console.log(`Expression[0] (ADBE Vector Shape vertex x): ${samples0.length} valid samples`);

// ---------------------------------------------------------------------------
// Expression 1: ADBE Vector Anchor Point
// Steps anchorType 1–9 (width=200, height=100); plots x component of anchor offset.
// ---------------------------------------------------------------------------

const expr1Adapter = `(function() {
  var w = effect("Width")("Slider") / 2;
  var h = effect("Height")("Slider") / 2;
  var anchorType = effect("Anchor Point")("Menu");
  var result;
  if (anchorType == 1)      result = [-w, -h];
  else if (anchorType == 2) result = [0,  -h];
  else if (anchorType == 3) result = [w,  -h];
  else if (anchorType == 4) result = [-w,  0];
  else if (anchorType == 5) result = [0,   0];
  else if (anchorType == 6) result = [w,   0];
  else if (anchorType == 7) result = [-w,  h];
  else if (anchorType == 8) result = [0,   h];
  else if (anchorType == 9) result = [w,   h];
  else                       result = [0,   0];
  return result;
})()`;

const ctx1 = {
  effects: {
    'Width': { Slider: 200 },
    'Height': { Slider: 100 },
    'Anchor Point': { Menu: 5 },
  },
};

const pts1 = sample(expr1Adapter, ctx1, {
  variable: 'controlValue',
  range: [1, 9],
  steps: 9,
  bindControl: 'Anchor Point',
  bindParam: 'Menu',
  component: 0,
});
const samples1 = toCurveSamples(pts1);
console.log(`Expression[1] (Anchor Point x offset): ${samples1.length} valid samples`);

// ---------------------------------------------------------------------------
// Expression 2: ADBE Vector Position compensation
// Sweeps Rectangle Width 0–1000 (height=200, anchor=Center/5).
// For anchor=5 (Center): position x is offset by -width/2 to keep the rectangle
// visually pinned. The original expression is stateful (tracks delta changes);
// this adapter models the cumulative x shift from a starting position of [0,0].
// ---------------------------------------------------------------------------

const expr2Adapter = `(function() {
  var width = effect("Width")("Slider");
  var anchorType = effect("Anchor Point")("Menu");
  // Simplified: starting position = [0,0], lastWidth = 0
  // => widthDelta = width - 0 = width
  var newPosX = 0;
  var widthDelta = width;
  if      (anchorType == 2) newPosX -= widthDelta / 2;
  else if (anchorType == 3) newPosX -= widthDelta;
  else if (anchorType == 5) newPosX -= widthDelta / 2;
  else if (anchorType == 6) newPosX -= widthDelta;
  else if (anchorType == 8) newPosX -= widthDelta / 2;
  else if (anchorType == 9) newPosX -= widthDelta;
  return newPosX;
})()`;

const ctx2 = {
  effects: {
    'Width': { Slider: 100 },
    'Height': { Slider: 200 },
    'Anchor Point': { Menu: 5 },
  },
};

const pts2 = sample(expr2Adapter, ctx2, {
  variable: 'controlValue',
  range: [0, 1000],
  steps: 41,
  bindControl: 'Width',
  bindParam: 'Slider',
  component: 0,
});
const samples2 = toCurveSamples(pts2);
console.log(`Expression[2] (Position x compensation): ${samples2.length} valid samples`);

// ---------------------------------------------------------------------------
// Build RenderArtifacts
// ---------------------------------------------------------------------------

const renderArtifacts = {
  name: 'Rectangulator',
  screenshot: null,
  uiTreePath: null,
  expressionCurves: [
    {
      target: model.expressions[0].target,
      xLabel: 'Rectangle Width (px)',
      yLabel: 'Top-left vertex x = −width/2 (px)',
      samples: samples0,
    },
    {
      target: model.expressions[1].target,
      xLabel: 'Anchor Point menu value (1–9)',
      yLabel: 'Anchor offset x (px)  [width=200, height=100]',
      samples: samples1,
    },
    {
      target: model.expressions[2].target,
      xLabel: 'Rectangle Width (px)',
      yLabel: 'Position x compensation (px)  [anchor=Center, start pos=(0,0)]',
      samples: samples2,
    },
  ],
  notes: [
    'HEADLESS script: no ScriptUI dialog; screenshot and uiTree are null.',
    'Original AE expressions use bare (var-less) assignments that rely on sloppy-mode global scope; the expr-eval "use strict" sandbox causes them to throw inside the catch block, returning the fallback path. Clean adapter expressions reproduce the same output logic using explicit var declarations.',
    'Expression[0] adapter sweeps width 0–1000 px (height=200, all corners 0%, anchor=Center); plots first bezier vertex x = −width/2, which varies linearly from 0 to −500.',
    'Expression[1] adapter steps anchorType 1–9 (width=200, height=100); the x component of the anchor offset is −100 for left column, 0 for center column, +100 for right column.',
    'Expression[2] adapter sweeps width 0–1000 with anchor=Center; position x compensation is −width/2 (linear from 0 to −500), keeping the rectangle visually pinned at center. The original is stateful (delta-based); this adapter shows the equivalent cumulative shift from starting position (0,0).',
  ],
};

// Validate
const { ok, errors } = validateRenderArtifacts(renderArtifacts);
if (!ok) {
  console.error('Validation FAILED:', errors);
  process.exit(1);
}
console.log('Validation: OK');

// Write
const outPath = join(__dirname, 'Rectangulator.render.json');
writeFileSync(outPath, JSON.stringify(renderArtifacts, null, 2), 'utf8');
console.log('Written:', outPath);

for (const c of renderArtifacts.expressionCurves) {
  console.log(`  ${c.target}: ${c.samples.length} samples  first=${JSON.stringify(c.samples[0])}  last=${JSON.stringify(c.samples[c.samples.length-1])}`);
}
