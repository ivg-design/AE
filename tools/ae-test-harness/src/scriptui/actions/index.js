/**
 * src/scriptui/actions/index.js
 *
 * Drives a sequence of Actions against a captured ScriptUI Window produced by the
 * scriptui runtime (src/scriptui/index.js createScriptUIRuntime().Window).
 *
 * Supported Action types (see contracts Action typedef / ACTION_TYPES):
 *   - click            : resolve a control by name/text, invoke its onClick handler.
 *   - change           : set value/text on a control, invoke its onChange handler.
 *   - select           : set selection / checked state, invoke onChange.
 *   - type             : set edittext text, invoke onChange.
 *   - selectLayers     : mutate host selection (layerIds) when a host ctx is provided.
 *   - selectProperties : mutate host selection (propertyPaths) when a host ctx is provided.
 *   - run              : no-op at the UI level (script body already executed); recorded.
 *
 * Every action appends an Operation to a returned log. All operation `kind` values come
 * from OPERATION_KINDS in the frozen contracts module — UI-level interactions are logged
 * with kind 'executeCommand' (with descriptive meta), while host-selection mutations use
 * 'setValue'. The module is importable in isolation and never throws on tolerant lookups;
 * unresolved targets are recorded as no-op operations with meta.resolved === false.
 *
 * ESM only. Importable in isolation.
 */

import { OPERATION_KINDS } from '../../contracts/index.js';

// Pull the exact frozen kinds we rely on (fail loudly at import if the contract drifts).
const KIND_EXECUTE = 'executeCommand';
const KIND_SET_VALUE = 'setValue';
for (const k of [KIND_EXECUTE, KIND_SET_VALUE]) {
  if (!OPERATION_KINDS.includes(k)) {
    throw new Error(`actions: required operation kind "${k}" missing from OPERATION_KINDS`);
  }
}

/**
 * @typedef {import('../../contracts/index.js').Action} Action
 * @typedef {import('../../contracts/index.js').Operation} Operation
 */

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function lc(v) {
  return typeof v === 'string' ? v.toLowerCase() : v;
}

/**
 * Resolve the captured Window from whatever the caller passed.
 * Accepts a Window instance directly, or a { win } / { window } wrapper.
 * @param {*} win
 * @returns {object|null}
 */
function resolveWindow(win) {
  if (!isObj(win)) return null;
  if (Array.isArray(win.children)) return win;
  if (isObj(win.win) && Array.isArray(win.win.children)) return win.win;
  if (isObj(win.window) && Array.isArray(win.window.children)) return win.window;
  return null;
}

/**
 * Collect every descendant control of a window/container into a flat list.
 * Containers (panel/group/tabbedpanel/tab) expose a `children` array.
 * @param {object} root
 * @returns {object[]}
 */
function flattenControls(root) {
  const out = [];
  const stack = [];
  if (root && Array.isArray(root.children)) {
    for (const c of root.children) stack.push(c);
  }
  while (stack.length) {
    const node = stack.pop();
    if (!isObj(node)) continue;
    out.push(node);
    if (Array.isArray(node.children)) {
      for (const c of node.children) stack.push(c);
    }
  }
  return out;
}

/**
 * Tolerant control lookup by name or visible text/title.
 * Matching is case-insensitive and tries, in order:
 *   exact name, exact text, exact title, then case-insensitive variants,
 *   then substring on text/name.
 * @param {object} win  resolved window
 * @param {string|undefined} target
 * @returns {object|null}
 */
function findControl(win, target) {
  if (target == null) return null;
  const controls = flattenControls(win);
  const t = String(target);
  const tl = lc(t);

  const matchers = [
    (c) => c.name === t,
    (c) => c.text === t,
    (c) => c.title === t,
    (c) => c.label === t,
    (c) => lc(c.name) === tl,
    (c) => lc(c.text) === tl,
    (c) => lc(c.title) === tl,
    (c) => lc(c.label) === tl,
    (c) => typeof c.text === 'string' && lc(c.text).indexOf(tl) !== -1,
    (c) => typeof c.name === 'string' && lc(c.name).indexOf(tl) !== -1
  ];

  for (const m of matchers) {
    for (const c of controls) {
      try {
        if (m(c)) return c;
      } catch {
        /* tolerant: ignore individual matcher errors */
      }
    }
  }
  return null;
}

/**
 * Invoke a handler stored on a control, tolerant of arity / errors.
 * Handlers may live directly on the control (onClick/onChange) or in a
 * map (control._handlers / control.handlers when it is an object).
 * @param {object} ctrl
 * @param {string} handlerName  e.g. 'onClick' | 'onChange'
 * @returns {{ invoked: boolean, error: (Error|null) }}
 */
function invokeHandler(ctrl, handlerName) {
  let fn = null;
  if (typeof ctrl[handlerName] === 'function') {
    fn = ctrl[handlerName];
  } else if (isObj(ctrl._handlers) && typeof ctrl._handlers[handlerName] === 'function') {
    fn = ctrl._handlers[handlerName];
  } else if (isObj(ctrl.handlers) && typeof ctrl.handlers[handlerName] === 'function') {
    fn = ctrl.handlers[handlerName];
  }
  if (!fn) return { invoked: false, error: null };
  try {
    // ScriptUI handlers are invoked with the control as `this` and no required args.
    fn.call(ctrl, {});
    return { invoked: true, error: null };
  } catch (err) {
    return { invoked: true, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Push a UI-level operation onto the log.
 * @param {Operation[]} log
 * @param {string} command
 * @param {object} meta
 * @param {string|undefined} target
 */
function logExecute(log, command, meta, target) {
  /** @type {Operation} */
  const op = { kind: KIND_EXECUTE, meta: { command, ...meta } };
  if (target != null) op.target = String(target);
  log.push(op);
}

/**
 * Locate a host context object from the runtime/ctx for selection mutations.
 * Accepts an explicit ctx (with .selection or .host.selection or app.project...).
 * @param {*} ctx
 * @returns {{ layerIds: string[], propertyPaths: string[] }|null}
 */
function resolveHostSelection(ctx) {
  if (!isObj(ctx)) return null;
  // direct selection object
  if (isObj(ctx.selection) && Array.isArray(ctx.selection.layerIds)) {
    return ctx.selection;
  }
  // wrapped host
  if (isObj(ctx.host) && isObj(ctx.host.selection)) {
    return ctx.host.selection;
  }
  // snapshot-style host
  if (isObj(ctx.snapshot) && isObj(ctx.snapshot.selection)) {
    return ctx.snapshot.selection;
  }
  return null;
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v.slice() : [v];
}

/**
 * Apply a single action against the window.
 * @param {object|null} win
 * @param {*} hostCtx
 * @param {Action} action
 * @param {Operation[]} log
 */
function applyAction(win, hostCtx, action, log) {
  if (!isObj(action) || typeof action.type !== 'string') {
    logExecute(log, 'invalidAction', { resolved: false, reason: 'action must be an object with a string type' }, undefined);
    return;
  }
  const { type, target } = action;
  const value = action.value;

  switch (type) {
    case 'click': {
      const ctrl = findControl(win, target);
      if (!ctrl) {
        logExecute(log, 'click', { resolved: false, controlType: null }, target);
        return;
      }
      const res = invokeHandler(ctrl, 'onClick');
      logExecute(
        log,
        'click',
        { resolved: true, controlType: ctrl.type || null, handlerInvoked: res.invoked, handlerError: res.error ? res.error.message : null },
        target
      );
      return;
    }

    case 'type': {
      let ctrl = findControl(win, target);
      if (!ctrl) {
        // Single-field dialogs use an unnamed empty edittext; if exactly one
        // edittext exists, target it rather than dropping the action.
        const edits = flattenControls(win).filter((c) => c && c.type === 'edittext');
        if (edits.length === 1) ctrl = edits[0];
      }
      if (!ctrl) {
        logExecute(log, 'type', { resolved: false, value }, target);
        return;
      }
      // edittext-style: set .text (and keep .value in sync if present)
      ctrl.text = value == null ? '' : String(value);
      if ('value' in ctrl) ctrl.value = ctrl.text;
      const res = invokeHandler(ctrl, 'onChange');
      logExecute(
        log,
        'type',
        { resolved: true, controlType: ctrl.type || null, value: ctrl.text, handlerInvoked: res.invoked, handlerError: res.error ? res.error.message : null },
        target
      );
      return;
    }

    case 'change': {
      const ctrl = findControl(win, target);
      if (!ctrl) {
        logExecute(log, 'change', { resolved: false, value }, target);
        return;
      }
      // Generic value/text set. Prefer .value; mirror to .text for text-bearing controls.
      if ('value' in ctrl || ctrl.type === 'slider' || ctrl.type === 'progressbar' || ctrl.type === 'checkbox' || ctrl.type === 'radiobutton') {
        ctrl.value = value;
      }
      if (typeof value === 'string' && ('text' in ctrl || ctrl.type === 'edittext' || ctrl.type === 'statictext')) {
        ctrl.text = value;
      } else if ('text' in ctrl && typeof value !== 'object') {
        ctrl.text = value == null ? ctrl.text : String(value);
      }
      const res = invokeHandler(ctrl, 'onChange');
      logExecute(
        log,
        'change',
        { resolved: true, controlType: ctrl.type || null, value, handlerInvoked: res.invoked, handlerError: res.error ? res.error.message : null },
        target
      );
      return;
    }

    case 'select': {
      const ctrl = findControl(win, target);
      if (!ctrl) {
        logExecute(log, 'select', { resolved: false, value }, target);
        return;
      }
      const ctype = ctrl.type;
      if (ctype === 'checkbox' || ctype === 'radiobutton') {
        // checked toggle: explicit boolean value, else default true.
        ctrl.value = typeof value === 'boolean' ? value : value == null ? true : Boolean(value);
      } else if (ctype === 'dropdownlist' || ctype === 'listbox' || Array.isArray(ctrl.items)) {
        // selection by index (number) or by item text/string.
        const items = Array.isArray(ctrl.items) ? ctrl.items : [];
        let idx = -1;
        if (typeof value === 'number') {
          idx = value;
        } else if (value != null) {
          const vl = lc(String(value));
          idx = items.findIndex((it) => {
            if (it == null) return false;
            const itText = typeof it === 'string' ? it : it.text != null ? it.text : it.name;
            return lc(String(itText)) === vl;
          });
        }
        ctrl.selection = idx >= 0 ? idx : value;
      } else {
        // fallback: store selection value directly.
        ctrl.selection = value;
        if ('value' in ctrl && typeof value === 'boolean') ctrl.value = value;
      }
      const res = invokeHandler(ctrl, 'onChange');
      logExecute(
        log,
        'select',
        { resolved: true, controlType: ctype || null, value, selection: ctrl.selection, checked: ctrl.value, handlerInvoked: res.invoked, handlerError: res.error ? res.error.message : null },
        target
      );
      return;
    }

    case 'selectLayers': {
      const sel = resolveHostSelection(hostCtx);
      const ids = asArray(value).map((v) => String(v));
      if (sel) {
        sel.layerIds = ids;
      }
      /** @type {Operation} */
      const op = { kind: KIND_SET_VALUE, target: 'selection/layerIds', value: ids, meta: { command: 'selectLayers', resolved: Boolean(sel) } };
      log.push(op);
      return;
    }

    case 'selectProperties': {
      const sel = resolveHostSelection(hostCtx);
      const paths = asArray(value).map((v) => String(v));
      if (sel) {
        sel.propertyPaths = paths;
      }
      /** @type {Operation} */
      const op = { kind: KIND_SET_VALUE, target: 'selection/propertyPaths', value: paths, meta: { command: 'selectProperties', resolved: Boolean(sel) } };
      log.push(op);
      return;
    }

    case 'run': {
      // The script body already executed when the window was built/captured.
      // Record the intent so functional reports can account for it.
      logExecute(log, 'run', { resolved: true }, target);
      return;
    }

    default: {
      logExecute(log, 'unknownAction', { resolved: false, type }, target);
      return;
    }
  }
}

/**
 * Drive a list of Actions against a captured ScriptUI window.
 *
 * @param {*} runtime  Either the captured Window itself, or an object exposing the window
 *                     via `{ win }` / `{ window }`. May also carry a host selection context
 *                     via `selection` / `host.selection` / `snapshot.selection`, which
 *                     selectLayers/selectProperties will mutate.
 * @param {Action[]} actions
 * @returns {{ log: Operation[], unresolved: string[] }}
 */
export function runActions(runtime, actions) {
  /** @type {Operation[]} */
  const log = [];
  /** @type {string[]} */
  const unresolved = [];

  const win = resolveWindow(runtime);
  const list = Array.isArray(actions) ? actions : [];

  for (const action of list) {
    const before = log.length;
    applyAction(win, runtime, action, log);
    // Track unresolved UI targets for caller convenience.
    for (let i = before; i < log.length; i++) {
      const op = log[i];
      if (op && op.meta && op.meta.resolved === false && action && action.target != null) {
        unresolved.push(String(action.target));
      }
    }
  }

  return { log, unresolved };
}

export default runActions;

// Internal helpers exported for white-box testing and reuse by sibling modules.
export { findControl, flattenControls, invokeHandler, resolveWindow };
