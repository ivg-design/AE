/**
 * src/ae-smoke — optional live After Effects smoke harness.
 *
 * This subsystem NEVER requires a real After Effects install. It exists to:
 *
 *  1. `runAeSmoke()` — gate any live smoke run behind `process.env.AE_SMOKE_CONFIG`.
 *     When the env var is unset, unreadable, or not valid JSON, it returns a clean
 *     `{ skipped: true, reason }` so CI stays green without AE present.
 *
 *  2. `importJsonLog(path)` — parse an AE-side JSON log file (produced by a script
 *     running inside a real AE session) into a normalized `Operation[]`, mapping
 *     AE event names onto the frozen `OPERATION_KINDS` from the contracts module.
 *
 * All operation logging uses `OPERATION_KINDS` from `../contracts/index.js`. The
 * module is importable in isolation (no top-level side effects, no AE require).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { OPERATION_KINDS, validateOperation } from '../contracts/index.js';

/**
 * @typedef {import('../contracts/index.js').Operation} Operation
 */

/**
 * Fast membership set for the frozen operation kinds.
 * @type {Set<string>}
 */
const KIND_SET = new Set(OPERATION_KINDS);

/**
 * Map of AE-side event names (and common aliases) onto the frozen OPERATION_KINDS.
 *
 * The left side is what an AE-side logger might emit; the right side must always
 * be a member of OPERATION_KINDS. Keys are matched case-insensitively.
 *
 * @type {Record<string, string>}
 */
const AE_EVENT_TO_KIND = {
  // layer lifecycle
  createlayer: 'createLayer',
  addlayer: 'createLayer',
  layeradded: 'createLayer',
  newlayer: 'createLayer',
  deletelayer: 'deleteLayer',
  removelayer: 'deleteLayer',
  layerremoved: 'deleteLayer',

  // property values
  setvalue: 'setValue',
  setvalueattime: 'setValueAtTime',
  setvalueattimes: 'setValueAtTime',
  setexpression: 'setExpression',
  expressionset: 'setExpression',
  addkeyframe: 'addKeyframe',
  setkeyframe: 'addKeyframe',
  keyframeadded: 'addKeyframe',
  setmarker: 'setMarker',
  markeradded: 'setMarker',

  // dialogs
  alert: 'alert',
  prompt: 'prompt',
  confirm: 'confirm',

  // undo groups
  beginundogroup: 'beginUndoGroup',
  beginundo: 'beginUndoGroup',
  endundogroup: 'endUndoGroup',
  endundo: 'endUndoGroup',

  // io / effects / commands
  filewrite: 'fileWrite',
  writefile: 'fileWrite',
  applypreset: 'applyPreset',
  presetapplied: 'applyPreset',
  executecommand: 'executeCommand',
  docommand: 'executeCommand',

  // hierarchy
  setparent: 'setParent',
  parented: 'setParent',
  reorder: 'reorder',
  movelayer: 'reorder',
  reorderlayer: 'reorder'
};

/**
 * Normalize an AE event name to a frozen OPERATION_KIND, or null if unknown.
 * @param {*} name
 * @returns {string|null}
 */
export function mapAeEventToKind(name) {
  if (typeof name !== 'string') return null;
  // Already a canonical kind (exact match)?
  if (KIND_SET.has(name)) return name;
  const key = name.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(AE_EVENT_TO_KIND, key)) {
    return AE_EVENT_TO_KIND[key];
  }
  return null;
}

/**
 * Coerce a single raw AE log entry into an Operation, or null if it cannot be
 * mapped to a frozen OPERATION_KIND.
 *
 * Accepts a variety of field spellings an AE-side logger might use:
 *   - kind / event / type / name  -> mapped to Operation.kind
 *   - target / path / matchName   -> Operation.target
 *   - value                       -> Operation.value
 *   - meta / data / details       -> Operation.meta
 *
 * @param {*} entry
 * @returns {Operation|null}
 */
export function entryToOperation(entry) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const rawName =
    entry.kind ?? entry.event ?? entry.type ?? entry.name ?? entry.op ?? null;
  const kind = mapAeEventToKind(rawName);
  if (!kind) return null;

  /** @type {Operation} */
  const op = { kind };

  const target = entry.target ?? entry.path ?? entry.matchName ?? entry.layer;
  if (typeof target === 'string') {
    op.target = target;
  }

  if ('value' in entry) {
    op.value = entry.value;
  }

  const meta = entry.meta ?? entry.data ?? entry.details;
  if (meta !== null && typeof meta === 'object' && !Array.isArray(meta)) {
    op.meta = meta;
  }

  return op;
}

/**
 * Parse an AE-side JSON log file into a normalized Operation[].
 *
 * The file may be either:
 *   - a JSON array of raw log entries, or
 *   - a JSON object with an `operations` / `events` / `log` array.
 *
 * Each entry is mapped through {@link entryToOperation}. Entries whose event
 * name does not map to a frozen OPERATION_KIND are dropped. Every emitted
 * Operation is validated against the contracts validator; invalid ops are
 * skipped (never thrown).
 *
 * @param {string} path Absolute or relative path to the JSON log file.
 * @returns {Operation[]}
 */
export function importJsonLog(path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('importJsonLog: path must be a non-empty string');
  }

  const abs = resolve(path);
  const raw = readFileSync(abs, 'utf8');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new SyntaxError(
      `importJsonLog: failed to parse JSON at ${abs}: ${err.message}`
    );
  }

  let entries;
  if (Array.isArray(parsed)) {
    entries = parsed;
  } else if (parsed !== null && typeof parsed === 'object') {
    entries =
      parsed.operations ?? parsed.events ?? parsed.log ?? parsed.entries ?? [];
  } else {
    entries = [];
  }

  if (!Array.isArray(entries)) entries = [];

  /** @type {Operation[]} */
  const ops = [];
  for (const entry of entries) {
    const op = entryToOperation(entry);
    if (!op) continue;
    const { ok } = validateOperation(op);
    if (ok) ops.push(op);
  }

  return ops;
}

/**
 * Attempt to read + parse the smoke config referenced by AE_SMOKE_CONFIG.
 * Never throws — returns null on any failure.
 *
 * @param {string|undefined} configPath
 * @returns {{ path: string, config: object }|null}
 */
function loadSmokeConfig(configPath) {
  if (typeof configPath !== 'string' || configPath.trim().length === 0) {
    return null;
  }
  const abs = resolve(configPath.trim());
  let raw;
  try {
    raw = readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    return null;
  }
  if (config === null || typeof config !== 'object') {
    return null;
  }
  return { path: abs, config };
}

/**
 * Run the optional live AE smoke harness.
 *
 * This NEVER requires a real After Effects. It only does real work when
 * `process.env.AE_SMOKE_CONFIG` resolves to a readable JSON config that points
 * at an AE-side log file. In that case it imports the log into Operation[] and
 * returns the parsed operations. In every other case it skips cleanly.
 *
 * @param {{ env?: Record<string,string|undefined> }} [opts]
 * @returns {{ skipped: true, reason: string } | { skipped: false, configPath: string, operations: Operation[], operationCount: number }}
 */
export function runAeSmoke(opts = {}) {
  const env = opts.env ?? process.env;
  const configPath = env.AE_SMOKE_CONFIG;

  if (typeof configPath !== 'string' || configPath.trim().length === 0) {
    return { skipped: true, reason: 'AE_SMOKE_CONFIG is not set' };
  }

  const loaded = loadSmokeConfig(configPath);
  if (!loaded) {
    return {
      skipped: true,
      reason: `AE_SMOKE_CONFIG (${configPath}) is not a readable JSON config`
    };
  }

  // The config may point at an AE-side JSON log to import. We never launch AE.
  const logPath = loaded.config.logPath ?? loaded.config.log ?? null;
  if (typeof logPath !== 'string' || logPath.trim().length === 0) {
    return {
      skipped: true,
      reason: 'AE_SMOKE_CONFIG has no logPath; nothing to import without a real AE'
    };
  }

  // Resolve logPath relative to the config file's directory when relative.
  const resolvedLogPath = resolve(loaded.path, '..', logPath);

  let operations;
  try {
    operations = importJsonLog(resolvedLogPath);
  } catch (err) {
    return {
      skipped: true,
      reason: `failed to import AE log at ${resolvedLogPath}: ${err.message}`
    };
  }

  return {
    skipped: false,
    configPath: loaded.path,
    operations,
    operationCount: operations.length
  };
}

export { OPERATION_KINDS };
