/**
 * host/sandbox — sandboxed script execution via node:vm.
 *
 * Owns the lowest layer of the simulated AE host: it builds a vm context seeded
 * with the supplied globals (app, alert, prompt, File, Folder, $, the ExtendScript
 * class constructors, and a curated set of JS intrinsics) and runs untrusted
 * script code inside it with a wall-clock timeout. Thrown errors are captured and
 * returned rather than allowed to crash the harness.
 *
 * It also exports the shared OperationLog helper (`createLog`) that the rest of
 * the host composes around. All operation kinds are validated against the frozen
 * OPERATION_KINDS list from the contracts module.
 */

import vm from 'node:vm';
import { OPERATION_KINDS } from '../../contracts/index.js';

/** @typedef {import('../../contracts/index.js').Operation} Operation */

const OPERATION_KIND_SET = new Set(OPERATION_KINDS);

/**
 * Shared operation log used across host modules.
 *
 * Every host mutation is recorded by pushing an Operation. `push` normalizes the
 * incoming record into the frozen Operation shape and validates its `kind`
 * against OPERATION_KINDS — an unknown kind is a programming error and throws so
 * it surfaces during development rather than silently corrupting the log.
 *
 * @returns {{ push: (op: Operation) => Operation, entries: Operation[] }}
 */
export function createLog() {
  /** @type {Operation[]} */
  const entries = [];

  /**
   * @param {Operation} op
   * @returns {Operation}
   */
  function push(op) {
    if (op == null || typeof op !== 'object') {
      throw new TypeError('createLog().push requires an Operation object');
    }
    if (!OPERATION_KIND_SET.has(op.kind)) {
      throw new Error(
        `Unknown operation kind "${String(op.kind)}"; ` +
          `expected one of ${OPERATION_KINDS.join('|')}`
      );
    }
    /** @type {Operation} */
    const record = { kind: op.kind };
    if ('target' in op && op.target != null) record.target = op.target;
    if ('value' in op) record.value = op.value;
    if ('meta' in op && op.meta != null) record.meta = op.meta;
    entries.push(record);
    return record;
  }

  return { push, entries };
}

/**
 * The JS intrinsics we expose to scripts under test. ExtendScript scripts assume
 * these exist as globals. We bind them from the host realm so behavior is
 * consistent and so scripts cannot reach host-only globals (process, require…).
 */
const INTRINSIC_GLOBALS = {
  Math,
  parseFloat,
  parseInt,
  isNaN,
  isFinite,
  String,
  Number,
  Boolean,
  Array,
  Object,
  Date,
  RegExp,
  JSON,
  Error,
  TypeError,
  RangeError,
  encodeURIComponent,
  decodeURIComponent
};

/**
 * Run script `code` inside an isolated vm context seeded with `globals`.
 *
 * The provided `globals` (app, alert, prompt, confirm, File, Folder, $,
 * CompItem, AVLayer, ShapeLayer, TextLayer, …) are merged over a base set of JS
 * intrinsics and injected as the context's globalThis. The script runs with a
 * wall-clock `timeoutMs`. Any thrown error (including timeout/`ERR_SCRIPT_EXECUTION_TIMEOUT`)
 * is captured and returned as `error` instead of propagating.
 *
 * Return shape satisfies both the frozen subsystem contract (`{ error, log }`)
 * and the requested `{ error, returnValue }` — it is a superset of both.
 *
 * @param {string} code               Script source to execute.
 * @param {Object} [globals]          Host globals to inject (app, alert, File, …).
 *                                     If `globals.__log` is an Operation[], it is
 *                                     reused; otherwise a fresh log is created.
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {{ error: Error|null, returnValue: *, log: Operation[] }}
 */
export function runScript(code, globals = {}, opts = {}) {
  const { timeoutMs = 5000 } = opts;

  // Reuse a caller-supplied operation log if present (host modules thread one
  // through via globals.__log); otherwise stand up an isolated one so the
  // sandbox is fully usable in isolation.
  const log = Array.isArray(globals && globals.__log)
    ? globals.__log
    : createLog().entries;

  const sandbox = Object.assign(
    Object.create(null),
    INTRINSIC_GLOBALS,
    globals || {}
  );
  sandbox.__log = log;
  // Make `globalThis`/`global`/`self` resolve to the sandbox for scripts that
  // probe for an environment.
  sandbox.globalThis = sandbox;
  sandbox.global = sandbox;
  sandbox.self = sandbox;

  const context = vm.createContext(sandbox);

  let error = null;
  let returnValue;

  if (typeof code !== 'string') {
    return {
      error: new TypeError('runScript(code): code must be a string'),
      returnValue: undefined,
      log
    };
  }

  try {
    const script = new vm.Script(code, { filename: 'script-under-test.jsx' });
    returnValue = script.runInContext(context, {
      timeout: timeoutMs,
      displayErrors: true
    });
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err));
  }

  return { error, returnValue, log };
}

export default { runScript, createLog };
