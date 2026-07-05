/**
 * One-shot render runner for Iteratron.
 * Captures UITree via runFixtureScenario, renders PNG via SDB, writes render.json.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const harnessRoot = resolve(__dirname, '..');

// Paths
const scriptPath = resolve(harnessRoot, '../../packages/ae-scripts/src/utilities/Iteratron.jsx');
const fixturePath = resolve(harnessRoot, 'fixtures/utilities/Iteratron.fixture.js');
const outPngPath = resolve(harnessRoot, 'dashboard/assets/ui/Iteratron.png');
const outJsonPath = resolve(harnessRoot, 'capability/Iteratron.render.json');

// Imports
const { runFixtureScenario } = await import(resolve(harnessRoot, 'src/host/index.js'));
const { render } = await import(resolve(harnessRoot, 'src/sdb/render.mjs'));
const { validateRenderArtifacts } = await import(resolve(harnessRoot, 'src/capability/schema.js'));

// Load fixture (dynamic import)
const fixtureModule = await import(fixturePath);
const fixture = fixtureModule.default;

// Find the first success scenario
const successScenario = fixture.scenarios.find(s => s.kind === 'success');
if (!successScenario) {
  console.error('No success scenario found in fixture');
  process.exit(1);
}

console.log('Success scenario:', successScenario.name);

// Load script code
const scriptCode = await readFile(scriptPath, 'utf-8');

// Run the fixture scenario to capture UITree
let uiTree = null;
let uiTreeNote = null;
try {
  const result = await runFixtureScenario(
    successScenario.host,
    scriptCode,
    successScenario.actions || []
  );
  uiTree = result.uiTree || null;
  if (!uiTree) {
    uiTreeNote = 'runFixtureScenario returned no uiTree (ScriptUI runtime may not have captured the palette window)';
    console.warn('No uiTree captured:', uiTreeNote);
  } else {
    console.log('UITree captured:', JSON.stringify(uiTree).slice(0, 120), '...');
  }
} catch (err) {
  uiTreeNote = 'runFixtureScenario threw: ' + (err && err.message ? err.message : String(err));
  console.error('runFixtureScenario error:', uiTreeNote);
}

// Ensure output dirs exist
await mkdir(dirname(outPngPath), { recursive: true });

// Render PNG if uiTree was captured
let screenshotPath = null;
let screenshotNote = null;
let renderResult = null;

if (uiTree) {
  console.log('Rendering PNG via SDB...');
  renderResult = await render(uiTree, outPngPath);
  console.log('Render result:', renderResult);
  if (renderResult.ok) {
    screenshotPath = outPngPath;
    // Verify PNG > 1KB
    try {
      const stat = statSync(outPngPath);
      if (stat.size < 1024) {
        screenshotNote = `PNG rendered but is suspiciously small: ${stat.size} bytes`;
        console.warn(screenshotNote);
      } else {
        console.log(`PNG written: ${outPngPath} (${stat.size} bytes, ${renderResult.width}x${renderResult.height})`);
      }
    } catch (e) {
      screenshotNote = 'Could not stat output PNG: ' + (e && e.message ? e.message : String(e));
    }
  } else {
    screenshotNote = 'SDB render failed: ' + (renderResult.reason || 'unknown reason');
    console.error('Render failed:', screenshotNote);
    screenshotPath = null;
  }
} else {
  screenshotNote = uiTreeNote || 'No uiTree available to render';
}

// Build RenderArtifacts
const notes = [];
if (screenshotNote) notes.push(screenshotNote);
if (renderResult && renderResult.ok && renderResult.width && renderResult.height) {
  notes.push(`PNG dimensions: ${renderResult.width}x${renderResult.height} (device scale factor 2, logical pixels)`);
}
notes.push('expressions[] is empty — no expression curves to compute (script bakes values, writes no AE expressions)');

const renderArtifacts = {
  name: 'Iteratron',
  screenshot: screenshotPath,
  uiTreePath: null,
  expressionCurves: [],
  notes
};

// Validate
const validation = validateRenderArtifacts(renderArtifacts);
if (!validation.ok) {
  console.error('RenderArtifacts validation errors:', validation.errors);
  process.exit(1);
}

// Write
await writeFile(outJsonPath, JSON.stringify(renderArtifacts, null, 2), 'utf-8');
console.log('Written:', outJsonPath);
console.log(JSON.stringify(renderArtifacts, null, 2));
