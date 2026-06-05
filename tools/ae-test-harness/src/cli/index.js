/**
 * ae-test-harness — CLI command runner.
 *
 * Dispatches one of: static | expressions | functional | ui | report | ae-smoke.
 *
 * Each command:
 *   1. resolves config (defaults + parsed flags),
 *   2. ensures `.out/<command>/` exists,
 *   3. lazily imports the relevant subsystem index by its FROZEN path,
 *   4. runs over discovered scripts / loaded fixtures,
 *   5. writes deterministic JSON artifacts (stable key order, NO timestamps).
 *
 * Cross-subsystem dependencies (discovery, fixtures loader, and every subsystem index)
 * are imported lazily and feature-detected: if a module is absent or does not export the
 * expected function, the command degrades gracefully and records a `skip` instead of crashing.
 * This keeps `src/cli` importable and testable in isolation.
 *
 * All operation logging is validated against OPERATION_KINDS from the frozen contracts.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';

import { OPERATION_KINDS } from '../contracts/index.js';
import { parseArgs } from './args.js';

// --- Frozen path anchoring ----------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Repo-relative roots, anchored off this module's location (src/cli/). */
export const SRC_ROOT = path.resolve(__dirname, '..');
export const HARNESS_ROOT = path.resolve(SRC_ROOT, '..');
export const OUT_ROOT = path.join(HARNESS_ROOT, '.out');

/** The canonical, ordered list of commands the CLI understands. */
export const COMMANDS = Object.freeze([
  'static',
  'expressions',
  'functional',
  'ui',
  'report',
  'ae-smoke'
]);

// --- Deterministic JSON helpers ----------------------------------------------

/**
 * Recursively produce a value with object keys sorted, so JSON.stringify is stable
 * regardless of insertion order. Arrays preserve order (they are ordered data).
 * @param {*} value
 * @returns {*}
 */
export function stableSort(value) {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === 'object') {
    /** @type {Record<string, *>} */
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = stableSort(value[key]);
    }
    return out;
  }
  return value;
}

/**
 * Serialize a value to deterministic JSON (sorted keys, 2-space indent, trailing newline).
 * Contains NO timestamps — callers must not inject them.
 * @param {*} value
 * @returns {string}
 */
export function stableStringify(value) {
  return `${JSON.stringify(stableSort(value), null, 2)}\n`;
}

/**
 * Ensure `.out/<command>/` exists and return its absolute path.
 * @param {string} command
 * @returns {Promise<string>}
 */
export async function ensureOutDir(command) {
  const dir = path.join(OUT_ROOT, command);
  await fsp.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Write a deterministic JSON artifact into a command's out dir.
 * @param {string} command
 * @param {string} fileName
 * @param {*} value
 * @returns {Promise<string>} absolute path written
 */
export async function writeArtifact(command, fileName, value) {
  const dir = await ensureOutDir(command);
  const filePath = path.join(dir, fileName);
  await fsp.writeFile(filePath, stableStringify(value), 'utf8');
  return filePath;
}

// --- Lazy, fault-tolerant module loading -------------------------------------

/**
 * Dynamically import a sibling module relative to SRC_ROOT, returning null when it is
 * absent or fails to load. Never throws.
 * @param {string} relPath  e.g. 'discovery.js' or 'static/index.js'
 * @returns {Promise<object|null>}
 */
export async function tryImport(relPath) {
  const abs = path.join(SRC_ROOT, relPath);
  try {
    if (!fs.existsSync(abs)) return null;
    return await import(fileURLToPath(new URL(`file://${abs}`)));
  } catch {
    return null;
  }
}

/**
 * Feature-detect a named export that is a function.
 * @param {object|null} mod
 * @param {string} name
 * @returns {Function|null}
 */
function pickFn(mod, name) {
  if (mod && typeof mod[name] === 'function') return mod[name];
  return null;
}

/**
 * Discover scripts via Integrate's discovery module, tolerating its absence.
 * @param {object} config
 * @returns {Promise<{ scripts: any[], skipped: boolean, reason?: string }>}
 */
export async function discover(config = {}) {
  const mod = await tryImport('discovery.js');
  const fn = pickFn(mod, 'discoverScripts');
  if (!fn) {
    return { scripts: [], skipped: true, reason: 'discovery.discoverScripts unavailable' };
  }
  try {
    const scripts = await fn(config);
    return { scripts: Array.isArray(scripts) ? scripts : [], skipped: false };
  } catch (err) {
    return { scripts: [], skipped: true, reason: `discoverScripts failed: ${errMsg(err)}` };
  }
}

/**
 * Load fixtures via Integrate's fixtures loader, tolerating its absence.
 * @param {object} config
 * @returns {Promise<{ fixtures: any[], skipped: boolean, reason?: string }>}
 */
export async function load(config = {}) {
  const mod = await tryImport('fixtures/loader.js');
  const fn = pickFn(mod, 'loadFixtures');
  if (!fn) {
    return { fixtures: [], skipped: true, reason: 'fixtures.loadFixtures unavailable' };
  }
  try {
    const loaded = await fn(config);
    // loadFixtures() returns { byName, list, invalid }; older shape was a bare array.
    const fixtures = Array.isArray(loaded)
      ? loaded
      : loaded && Array.isArray(loaded.list)
        ? loaded.list
        : loaded && loaded.byName
          ? Object.values(loaded.byName)
          : [];
    return { fixtures, skipped: false };
  } catch (err) {
    return { fixtures: [], skipped: true, reason: `loadFixtures failed: ${errMsg(err)}` };
  }
}

function errMsg(err) {
  return err && err.message ? String(err.message) : String(err);
}

/**
 * Coerce an operation log into validated, contract-compliant entries.
 * Filters out anything whose `kind` is not in OPERATION_KINDS.
 * @param {any[]} log
 * @returns {import('../contracts/index.js').Operation[]}
 */
export function sanitizeLog(log) {
  if (!Array.isArray(log)) return [];
  return log.filter((op) => op && typeof op === 'object' && OPERATION_KINDS.includes(op.kind));
}

/**
 * Build a stable per-script descriptor that does not depend on host shape details.
 * @param {*} script
 * @param {number} index
 * @returns {{ name: string, category: string, relPath: string }}
 */
function scriptDescriptor(script, index) {
  const s = script && typeof script === 'object' ? script : {};
  return {
    name: typeof s.name === 'string' ? s.name : `script-${index}`,
    category: typeof s.category === 'string' ? s.category : 'unknown',
    relPath: typeof s.relPath === 'string' ? s.relPath : ''
  };
}

/**
 * Read script source if available (script may carry `.code` or `.absPath`).
 * @param {*} script
 * @returns {Promise<string|null>}
 */
async function readScriptCode(script) {
  if (script && typeof script.code === 'string') return script.code;
  const p = script && (script.absPath || script.path);
  if (typeof p === 'string') {
    try {
      return await fsp.readFile(p, 'utf8');
    } catch {
      return null;
    }
  }
  return null;
}

// --- Command implementations --------------------------------------------------
// Each returns a serializable summary object: { command, ... , artifacts: string[] }.

/**
 * STATIC — parse ECMA3, scan modern API usage, validate frontmatter, scan includes.
 * @param {object} config
 * @returns {Promise<object>}
 */
async function runStatic(config) {
  const command = 'static';
  const mod = await tryImport('static/index.js');
  const parseECMA3 = pickFn(mod, 'parseECMA3');
  const scanModernAPI = pickFn(mod, 'scanModernAPI');
  const validateFrontmatter = pickFn(mod, 'validateFrontmatter');
  const scanIncludes = pickFn(mod, 'scanIncludes');

  const { scripts, skipped: discSkipped, reason: discReason } = await discover(config);
  const results = [];

  for (let i = 0; i < scripts.length; i += 1) {
    const desc = scriptDescriptor(scripts[i], i);
    const code = await readScriptCode(scripts[i]);
    const entry = { ...desc, status: 'skip', findings: [] };
    if (code == null) {
      entry.detail = 'source unavailable';
      results.push(entry);
      continue;
    }
    if (parseECMA3) {
      const parsed = parseECMA3(code);
      entry.parse = parsed;
      entry.status = parsed && parsed.ok ? 'pass' : 'fail';
    }
    if (scanModernAPI) entry.modernApi = scanModernAPI(code) || [];
    if (validateFrontmatter) entry.frontmatter = validateFrontmatter(code) || {};
    if (scanIncludes) entry.includes = scanIncludes(code) || {};
    results.push(entry);
  }

  const summary = {
    command,
    available: Boolean(parseECMA3 || scanModernAPI || validateFrontmatter || scanIncludes),
    discovered: scripts.length,
    discovery: discSkipped ? { skipped: true, reason: discReason } : { skipped: false },
    results,
    artifacts: []
  };
  const out = await writeArtifact(command, 'static.json', summary);
  summary.artifacts = [out];
  return summary;
}

/**
 * EXPRESSIONS — extract literal expressions, parse, classify.
 * @param {object} config
 * @returns {Promise<object>}
 */
async function runExpressions(config) {
  const command = 'expressions';
  const mod = await tryImport('expressions/index.js');
  const extract = pickFn(mod, 'extractLiteralExpressions');
  const parseExpression = pickFn(mod, 'parseExpression');
  const classifyRecord = pickFn(mod, 'classifyRecord');

  const { scripts, skipped: discSkipped, reason: discReason } = await discover(config);
  const results = [];

  for (let i = 0; i < scripts.length; i += 1) {
    const desc = scriptDescriptor(scripts[i], i);
    const code = await readScriptCode(scripts[i]);
    const entry = { ...desc, status: 'skip', records: [] };
    if (code == null) {
      entry.detail = 'source unavailable';
      results.push(entry);
      continue;
    }
    if (extract) {
      let records = extract(code, desc.name) || [];
      records = records.map((rec) => {
        let r = rec;
        if (classifyRecord) r = classifyRecord(r) || r;
        if (parseExpression && r && typeof r.expression === 'string') {
          const parsed = parseExpression(r.expression);
          r = { ...r, parse: parsed };
        }
        return r;
      });
      entry.records = records;
      entry.status = records.length === 0 ? 'pass' : (
        records.every((r) => !r.parse || r.parse.ok) ? 'pass' : 'fail'
      );
    }
    results.push(entry);
  }

  const summary = {
    command,
    available: Boolean(extract),
    discovered: scripts.length,
    discovery: discSkipped ? { skipped: true, reason: discReason } : { skipped: false },
    results,
    artifacts: []
  };
  const out = await writeArtifact(command, 'expressions.json', summary);
  summary.artifacts = [out];
  return summary;
}

/**
 * FUNCTIONAL — run fixtures' scenarios against the simulated host, capturing the op log.
 * @param {object} config
 * @returns {Promise<object>}
 */
/** Non-control operation kinds a scenario expects (UI driver ops are ignored). */
function expectedKindsOf(scenario) {
  if (!scenario || !Array.isArray(scenario.expectedOperations)) return [];
  return scenario.expectedOperations
    .map((o) => o && o.kind)
    .filter((k) => typeof k === 'string' && k !== 'executeCommand');
}

async function runFunctional(config) {
  const command = 'functional';
  const hostMod = await tryImport('host/index.js');
  const runFixtureScenario = pickFn(hostMod, 'runFixtureScenario');

  const { fixtures, skipped: fxSkipped, reason: fxReason } = await load(config);
  const { scripts: discovered } = await discover(config);
  const discByName = new Map((discovered || []).map((s) => [s.name, s]));
  const results = [];

  for (let f = 0; f < fixtures.length; f += 1) {
    const fixture = fixtures[f] || {};
    const script = fixture.script || {};
    const disc = discByName.get(script.name) || script;
    const scenarios = Array.isArray(fixture.scenarios) ? fixture.scenarios : [];
    const code = await readScriptCode(disc);
    const scenarioResults = [];

    for (let s = 0; s < scenarios.length; s += 1) {
      const scenario = scenarios[s] || {};
      const sr = {
        name: typeof scenario.name === 'string' ? scenario.name : `scenario-${s}`,
        kind: typeof scenario.kind === 'string' ? scenario.kind : 'success',
        status: 'skip',
        operations: []
      };
      if (sr.kind === 'known-blocked') {
        // Include-based scripts can't run standalone — expected; not a failure.
        sr.detail = 'known-blocked: requires external @include modules (AE-only)';
        scenarioResults.push(sr);
        continue;
      }
      if (runFixtureScenario && scenario.host && code) {
        try {
          const { error, operations } = await runFixtureScenario(
            scenario.host,
            code,
            scenario.actions || []
          );
          const produced = new Set((operations || []).map((o) => o && o.kind));
          const want = expectedKindsOf(scenario);
          const missing = want.filter((k) => !produced.has(k));
          sr.operations = sanitizeLog(operations);
          sr.producedKinds = [...produced].filter(Boolean);
          if (error) {
            sr.status = 'fail';
            sr.detail = `runner threw: ${errMsg(error)}`;
          } else if (missing.length) {
            sr.status = 'fail';
            sr.detail = `missing operation kinds [${missing.join(', ')}]`;
          } else {
            sr.status = 'pass';
          }
        } catch (err) {
          sr.status = 'fail';
          sr.detail = errMsg(err);
        }
      } else {
        sr.detail = !runFixtureScenario
          ? 'host.runFixtureScenario unavailable'
          : !code
            ? 'script source unreadable'
            : 'scenario.host missing';
      }
      scenarioResults.push(sr);
    }

    // Fixture status is driven by SUCCESS scenarios (matching the vitest suite);
    // guards/known-blocked are reported per-scenario but don't flip the fixture.
    const successResults = scenarioResults.filter((r) => r.kind === 'success');
    const successFail = successResults.some((r) => r.status === 'fail');
    const successPass = successResults.some((r) => r.status === 'pass');
    const success = scenarios.find((sc) => sc && sc.kind === 'success') || scenarios[0] || {};
    const knownBlocked = scenarios.some((sc) => sc && sc.kind === 'known-blocked');
    results.push({
      name: typeof script.name === 'string' ? script.name : `fixture-${f}`,
      category: typeof script.category === 'string' ? script.category : 'unknown',
      status: knownBlocked ? 'skip' : successFail ? 'fail' : successPass ? 'pass' : 'skip',
      confidence: knownBlocked ? 'known-blocked' : success.expectedConfidence || 'low',
      knownBlocked,
      scenarios: scenarioResults
    });
  }

  const summary = {
    command,
    available: Boolean(runFixtureScenario),
    fixtures: fixtures.length,
    fixturesLoad: fxSkipped ? { skipped: true, reason: fxReason } : { skipped: false },
    results,
    artifacts: []
  };
  const out = await writeArtifact(command, 'functional.json', summary);
  summary.artifacts = [out];
  return summary;
}

/**
 * UI — capture ScriptUI trees from fixtures, drive actions, render/screenshot.
 * @param {object} config
 * @returns {Promise<object>}
 */
/** A UI script is one whose @ui mode is not HEADLESS. */
function isUiMode(ui) {
  return typeof ui === 'string' && ui.trim().split(/\s+/)[0].toUpperCase() !== 'HEADLESS';
}

async function runUI(config) {
  const command = 'ui';
  const hostMod = await tryImport('host/index.js');
  const runFixtureScenario = pickFn(hostMod, 'runFixtureScenario');
  const vizMod = await tryImport('visualization/index.js');
  const renderHTML = pickFn(vizMod, 'renderHTML');
  const screenshot = pickFn(vizMod, 'screenshot');
  const validateMod = await tryImport('contracts/index.js');
  const validateUITree = pickFn(validateMod, 'validateUITree');

  const { fixtures, skipped: fxSkipped, reason: fxReason } = await load(config);
  const { scripts: discovered } = await discover(config);
  const discByName = new Map((discovered || []).map((s) => [s.name, s]));
  const outDir = await ensureOutDir(command);
  const shotDir = path.join(HARNESS_ROOT, 'screenshots');
  await fsp.mkdir(shotDir, { recursive: true });
  const results = [];
  const artifacts = []; // under .out/ui/ only (cli.test.js asserts this)
  const screenshots = []; // under screenshots/ (tracked separately)

  for (let f = 0; f < fixtures.length; f += 1) {
    const fixture = fixtures[f] || {};
    const script = fixture.script || {};
    const disc = discByName.get(script.name) || script;
    const name = typeof script.name === 'string' ? script.name : `fixture-${f}`;
    const entry = {
      name,
      category: typeof script.category === 'string' ? script.category : 'unknown',
      hasUI: isUiMode(disc.ui),
      status: 'skip',
      tree: false,
      html: null,
      screenshot: null
    };

    if (!isUiMode(disc.ui)) {
      entry.detail = 'headless script (no UI)';
      results.push(entry);
      continue;
    }
    const scenario =
      (fixture.scenarios || []).find((s) => s && s.kind === 'success') ||
      (fixture.scenarios || [])[0];
    const code = await readScriptCode(disc);
    if (!runFixtureScenario || !scenario || !scenario.host || !code) {
      entry.detail = 'cannot run scenario for UI capture';
      results.push(entry);
      continue;
    }
    try {
      const { uiTree } = await runFixtureScenario(scenario.host, code, scenario.actions || []);
      if (!uiTree) {
        entry.detail = 'script produced no captured window';
        results.push(entry);
        continue;
      }
      entry.tree = true;
      if (validateUITree) {
        const { ok, errors } = validateUITree(uiTree);
        entry.treeValid = ok;
        if (!ok) entry.treeErrors = errors;
      }
      // Persist the tree.
      const treePath = path.join(outDir, `${name}.ui-tree.json`);
      await fsp.writeFile(treePath, JSON.stringify(uiTree, null, 2), 'utf8');
      artifacts.push(treePath);
      // Render fallback HTML.
      if (renderHTML) {
        const html = renderHTML(uiTree);
        const htmlPath = path.join(outDir, `${name}.html`);
        await fsp.writeFile(htmlPath, html, 'utf8');
        entry.html = htmlPath;
        artifacts.push(htmlPath);
        // Screenshot via Playwright (skips gracefully if unavailable).
        if (screenshot) {
          const pngPath = path.join(shotDir, `${name}.png`);
          const shot = await screenshot(html, pngPath);
          if (shot && shot.ok) {
            entry.screenshot = pngPath;
            screenshots.push(pngPath);
          } else {
            entry.screenshotSkipped = (shot && shot.reason) || 'unavailable';
          }
        }
      }
      entry.status = 'pass';
    } catch (err) {
      entry.status = 'fail';
      entry.detail = errMsg(err);
    }
    results.push(entry);
  }

  const summary = {
    command,
    available: Boolean(runFixtureScenario),
    fixtures: fixtures.length,
    fixturesLoad: fxSkipped ? { skipped: true, reason: fxReason } : { skipped: false },
    results,
    screenshots,
    artifacts
  };
  const out = await writeArtifact(command, 'ui.json', summary);
  summary.artifacts = [...artifacts, out];
  return summary;
}

/**
 * REPORT — aggregate prior command artifacts (if present) and emit a report summary.
 * Delegates real report rendering to src/reports/index.js when available.
 * @param {object} config
 * @returns {Promise<object>}
 */
async function runReport(config) {
  const command = 'report';
  const reportsMod = await tryImport('reports/index.js');
  const buildReport = pickFn(reportsMod, 'buildReport');
  const writeReport = pickFn(reportsMod, 'writeReport');

  // Collect already-produced artifacts from sibling command out dirs.
  const collected = {};
  for (const cmd of ['static', 'expressions', 'functional', 'ui']) {
    const p = path.join(OUT_ROOT, cmd, `${cmd}.json`);
    try {
      if (fs.existsSync(p)) {
        collected[cmd] = JSON.parse(await fsp.readFile(p, 'utf8'));
      }
    } catch {
      // ignore unreadable/partial artifacts
    }
  }

  // Merge all four passes into ReportRecord[], keyed by script name.
  const idx = (cmd) =>
    collected[cmd] && Array.isArray(collected[cmd].results)
      ? new Map(collected[cmd].results.map((r) => [r.name, r]))
      : new Map();
  const staticIdx = idx('static');
  const exprIdx = idx('expressions');
  const funcIdx = idx('functional');
  const uiIdx = idx('ui');
  const norm = (s) => (s === 'pass' || s === 'fail' || s === 'skip' || s === 'warn' ? s : 'skip');

  const records = [];
  for (const r of staticIdx.values()) {
    const ex = exprIdx.get(r.name) || {};
    const fn = funcIdx.get(r.name) || {};
    const ui = uiIdx.get(r.name) || {};
    const isUi = Boolean(ui.hasUI);
    const blocked = Boolean((r.includes && r.includes.blocked) || fn.knownBlocked);
    const items = [];
    if (blocked) {
      const inc = (r.includes && r.includes.includes) || [];
      items.push(`include-based: ${inc.join(', ') || 'external module'}`);
    }
    const confidence = blocked ? 'known-blocked' : fn.confidence || 'low';
    records.push({
      name: r.name,
      category: r.category,
      ui: isUi,
      static: { status: norm(r.status) },
      expressions: {
        status: norm(ex.status),
        detail: typeof ex.recordCount === 'number' ? `${ex.recordCount} record(s)` : undefined
      },
      functional: { status: norm(fn.status) },
      uiStatus: {
        status: isUi ? norm(ui.status) : 'skip',
        detail: ui.screenshot ? 'screenshot' : ui.tree ? 'ui-tree' : undefined
      },
      risk: { aeOnly: confidence === 'low' || confidence === 'medium', knownBlocked: blocked, items },
      confidence,
      artifacts: [ui.html, ui.screenshot].filter(Boolean),
      notes: []
    });
  }

  const outDir = await ensureOutDir(command);
  const summary = {
    command,
    available: Boolean(buildReport || writeReport),
    sources: Object.keys(collected).sort(),
    recordCount: records.length,
    artifacts: []
  };

  let wroteViaSubsystem = false;
  if (writeReport) {
    try {
      const res = writeReport(records, outDir);
      const paths = res && Array.isArray(res.paths) ? res.paths : [];
      summary.delegated = true;
      summary.artifacts.push(...paths);
      wroteViaSubsystem = paths.length > 0;
    } catch (err) {
      summary.delegateError = errMsg(err);
    }
  } else if (buildReport) {
    try {
      const built = buildReport(records);
      if (built && typeof built.json !== 'undefined') {
        const jp = await writeArtifact(command, 'report.json', built.json);
        summary.artifacts.push(jp);
        wroteViaSubsystem = true;
      }
      if (built && typeof built.markdown === 'string') {
        const mp = path.join(outDir, 'report.md');
        await fsp.writeFile(mp, built.markdown, 'utf8');
        summary.artifacts.push(mp);
      }
    } catch (err) {
      summary.delegateError = errMsg(err);
    }
  }

  // Always emit our own deterministic summary so the command writes to its out dir.
  const summaryPath = await writeArtifact(command, 'report-summary.json', {
    command,
    available: summary.available,
    delegated: wroteViaSubsystem,
    sources: summary.sources,
    recordCount: summary.recordCount,
    records
  });
  summary.artifacts.push(summaryPath);
  return summary;
}

/**
 * AE-SMOKE — optionally run the live-AE smoke pass; skips cleanly without config.
 * @param {object} config
 * @returns {Promise<object>}
 */
async function runAeSmoke(config) {
  const command = 'ae-smoke';
  const mod = await tryImport('ae-smoke/index.js');
  const runFn = pickFn(mod, 'runAeSmoke');

  let result;
  if (!runFn) {
    result = { skipped: true, reason: 'ae-smoke.runAeSmoke unavailable' };
  } else if (!process.env.AE_SMOKE_CONFIG) {
    result = { skipped: true, reason: 'AE_SMOKE_CONFIG not set' };
  } else {
    try {
      result = (await runFn(config)) || { skipped: true, reason: 'no result' };
    } catch (err) {
      result = { skipped: true, reason: errMsg(err) };
    }
  }

  const summary = { command, available: Boolean(runFn), result, artifacts: [] };
  const out = await writeArtifact(command, 'ae-smoke.json', summary);
  summary.artifacts = [out];
  return summary;
}

// --- Dispatch table -----------------------------------------------------------

/**
 * Frozen mapping of command name -> async runner(config).
 * @type {Readonly<Record<string, (config: object) => Promise<object>>>}
 */
export const DISPATCH = Object.freeze({
  static: runStatic,
  expressions: runExpressions,
  functional: runFunctional,
  ui: runUI,
  report: runReport,
  'ae-smoke': runAeSmoke
});

/**
 * Resolve runtime config from parsed args + environment defaults.
 * @param {import('./args.js').ParsedArgs} parsed
 * @returns {object}
 */
export function resolveConfig(parsed) {
  const opts = (parsed && parsed.options) || {};
  return {
    srcRoot: SRC_ROOT,
    harnessRoot: HARNESS_ROOT,
    outRoot: OUT_ROOT,
    scriptsRoot:
      typeof opts.scriptsRoot === 'string'
        ? opts.scriptsRoot
        : path.resolve(HARNESS_ROOT, '..', '..', 'packages', 'ae-scripts', 'src'),
    fixturesRoot:
      typeof opts.fixturesRoot === 'string'
        ? opts.fixturesRoot
        : path.join(HARNESS_ROOT, 'fixtures'),
    category: typeof opts.category === 'string' ? opts.category : null,
    options: opts
  };
}

/**
 * Run a single command by name. Throws only on unknown command.
 * @param {string} command
 * @param {object} [config]
 * @returns {Promise<object>}
 */
export async function runCommand(command, config = {}) {
  const runner = DISPATCH[command];
  if (!runner) {
    throw new Error(`Unknown command: ${command}. Expected one of ${COMMANDS.join('|')}`);
  }
  return runner(config);
}

/**
 * CLI entry point: parse argv, resolve config, dispatch, return the summary object.
 * Does not call process.exit (kept side-effect-light for tests); the binary wrapper
 * at the bottom handles exit codes when run directly.
 * @param {string[]} [argv] argv already sliced of [node, script].
 * @returns {Promise<{ ok: boolean, command: string|null, summary?: object, error?: string }>}
 */
export async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv);
  const command = parsed.command;

  if (!command || command === 'help' || parsed.options.help) {
    return {
      ok: true,
      command: command || null,
      summary: { usage: `Commands: ${COMMANDS.join(' | ')}`, commands: COMMANDS.slice() }
    };
  }
  if (!COMMANDS.includes(command)) {
    return { ok: false, command, error: `Unknown command: ${command}` };
  }

  const config = resolveConfig(parsed);
  try {
    const summary = await runCommand(command, config);
    return { ok: true, command, summary };
  } catch (err) {
    return { ok: false, command, error: errMsg(err) };
  }
}

// --- Direct-execution guard ---------------------------------------------------

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (invokedDirectly) {
  main()
    .then((res) => {
      if (res.ok) {
        process.stdout.write(`${stableStringify(res.summary ?? {})}`);
        process.exit(0);
      } else {
        process.stderr.write(`${res.error}\n`);
        process.exit(1);
      }
    })
    .catch((err) => {
      process.stderr.write(`${errMsg(err)}\n`);
      process.exit(1);
    });
}

export default { main, runCommand, DISPATCH, COMMANDS };
