/**
 * Capability model schema — the FROZEN shared contract for the interactive
 * per-script dashboard.
 *
 * This module defines:
 *   - JSDoc typedefs for the CapabilityModel (produced by analyzers) and
 *     RenderArtifacts (produced later by RenderEval).
 *   - Lightweight, NEVER-THROWING validators that return
 *     `{ ok: boolean, errors: string[] }`.
 *
 * Every other agent (SDB capture, expr-eval, RenderEval, dashboard assembler)
 * builds against the shapes below. Do not change them without re-freezing
 * CAPABILITY.md in lockstep.
 *
 * ESM only. No runtime dependencies.
 */

// ---------------------------------------------------------------------------
// Constants (enumerations referenced by the validators + typedefs)
// ---------------------------------------------------------------------------

/** UI modes a script may declare in frontmatter (`@ui`). */
export const UI_MODES = ['DIALOG', 'PANEL', 'PALETTE', 'HEADLESS'];

/** Allowed members of `consumes.selection`. */
export const SELECTION_KINDS = [
  'layers',
  'keyframes',
  'properties',
  'comp',
  'masks',
  'text',
  'none'
];

/**
 * Operation kinds usable inside `scriptSim.operations[].kind`. Mirrors the
 * harness OPERATION_KINDS from CONTRACT.md so a capability model can reuse the
 * functional simulation vocabulary, but is validated leniently (any non-empty
 * string is accepted — this is a documentation-grade field, not an assertion).
 */
export const OPERATION_KINDS = [
  'createLayer',
  'deleteLayer',
  'setValue',
  'setValueAtTime',
  'setExpression',
  'addKeyframe',
  'setMarker',
  'alert',
  'prompt',
  'confirm',
  'beginUndoGroup',
  'endUndoGroup',
  'fileWrite',
  'applyPreset',
  'executeCommand',
  'setParent',
  'reorder'
];

/** Control surface types the dashboard knows how to render. */
export const CONTROL_TYPES = [
  'slider',
  'number',
  'text',
  'checkbox',
  'dropdown',
  'radio',
  'color',
  'button',
  'listbox',
  'group',
  'static'
];

/** Sim driving-variable kinds for an expression curve. */
export const SIM_VARIABLES = ['controlValue', 'time'];

// ---------------------------------------------------------------------------
// Typedefs — CapabilityModel (written by analyzers → capability/<name>.model.json)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ConsumesSpec
 * What the script reads from the host before it acts.
 * @property {string[]} selection  Subset of SELECTION_KINDS.
 * @property {string}   minimum    Human-readable minimum precondition
 *                                  (e.g. "1 comp + 1 selected layer").
 * @property {string}   description Free-form description of consumed inputs.
 */

/**
 * @typedef {Object} ControlSpec
 * A single UI control surface the script exposes.
 * @property {string} name                The control's label / identifier.
 * @property {string} type                One of CONTROL_TYPES.
 * @property {string} role                What the control does (verb phrase),
 *                                        e.g. "sets seed", "toggles 3D".
 * @property {*}      default             Default value (string|number|boolean|null).
 * @property {[number, number]} [range]   [min, max] for numeric controls.
 * @property {string[]} [options]         Option labels for dropdown/radio/listbox.
 */

/**
 * @typedef {Object} SimOperation
 * One operation the success scenario is expected to perform.
 * @property {string} kind     Operation kind (see OPERATION_KINDS).
 * @property {string} target   Property path / layer name / file the op targets.
 * @property {*}      [value]  Optional concrete or sample value.
 */

/**
 * @typedef {Object} ScriptSim
 * A distilled view of the fixture's SUCCESS scenario.
 * @property {string} scenario           The success scenario's name.
 * @property {string} inputs             Summary of the host inputs it runs on.
 * @property {SimOperation[]} operations The sequence of operations it produces.
 */

/**
 * @typedef {Object} ControlBinding
 * Links an expression to the UI control that drives it.
 * @property {string} control            The driving control's name.
 * @property {string} param              The expression effect-param / variable
 *                                       the control feeds (e.g. "Slider").
 * @property {[number, number]} range    [min, max] of that param.
 */

/**
 * @typedef {Object} ExprSim
 * Sampling plan to plot an expression curve.
 * @property {'controlValue'|'time'} variable  Independent variable being swept.
 * @property {[number, number]} range          [min, max] of the swept variable.
 * @property {number} steps                     Number of sample points (>= 2).
 * @property {string} note                      Note about what the curve shows.
 */

/**
 * @typedef {Object} ExpressionSpec
 * Describes one AE expression the script WRITES onto a property.
 * @property {string} target                       Property path the expression
 *                                                  is applied to.
 * @property {ControlBinding|null} controlBinding  UI control driving it, or null.
 * @property {string} expression                   The AE expression source, with
 *                                                  any templated strings resolved
 *                                                  to a concrete sample.
 * @property {ExprSim} sim                          Sampling plan for the curve.
 */

/**
 * @typedef {Object} CapabilityModel
 * The full per-script capability model.
 * @property {string} name                 Script name (no extension).
 * @property {string} category             Catalog category (folder name).
 * @property {string} ui                   UI mode from frontmatter (UI_MODES).
 * @property {ConsumesSpec} consumes       What the script consumes.
 * @property {ControlSpec[]} controls      UI control surfaces.
 * @property {string[]} functions          Short verb phrases of what it does.
 * @property {ScriptSim} scriptSim         Distilled success-scenario simulation.
 * @property {ExpressionSpec[]} expressions Expressions the script writes (may be []).
 * @property {string[]} notes              Caveats, AE-only behaviour, etc.
 */

// ---------------------------------------------------------------------------
// Typedefs — RenderArtifacts (written later by RenderEval → capability/<name>.render.json)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CurveSample
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} ExpressionCurve
 * @property {string} target                Property path the curve plots.
 * @property {string} xLabel
 * @property {string} yLabel
 * @property {CurveSample[]} samples        Evaluated (x, y) points.
 */

/**
 * @typedef {Object} RenderArtifacts
 * Render-side outputs merged into the dashboard alongside CapabilityModel.
 * @property {string} name                  Script name (must match the model).
 * @property {string|null} screenshot       Path to a captured ScriptUI PNG,
 *                                          or null when none.
 * @property {string|null} uiTreePath       Path to a captured UITree JSON,
 *                                          or null when none.
 * @property {ExpressionCurve[]} expressionCurves Evaluated expression curves.
 * @property {string[]} notes               Render-side notes.
 */

// ---------------------------------------------------------------------------
// Validation helpers (internal, never throw)
// ---------------------------------------------------------------------------

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string';
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isArr = Array.isArray;

/**
 * @param {*} v
 * @param {string} where
 * @param {string[]} errors
 * @returns {boolean} true when v is a [number, number] tuple.
 */
function checkRange(v, where, errors) {
  if (!isArr(v) || v.length !== 2 || !isNum(v[0]) || !isNum(v[1])) {
    errors.push(`${where}: expected [min, max] number tuple`);
    return false;
  }
  return true;
}

/**
 * @param {*} arr
 * @param {string} where
 * @param {string[]} errors
 * @returns {boolean} true when arr is an array of non-empty strings.
 */
function checkStringArray(arr, where, errors) {
  if (!isArr(arr)) {
    errors.push(`${where}: expected an array`);
    return false;
  }
  let ok = true;
  arr.forEach((s, i) => {
    if (!isStr(s) || s.length === 0) {
      errors.push(`${where}[${i}]: expected a non-empty string`);
      ok = false;
    }
  });
  return ok;
}

// ---------------------------------------------------------------------------
// validateCapabilityModel
// ---------------------------------------------------------------------------

/**
 * Validate a CapabilityModel. Never throws.
 * @param {*} m
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCapabilityModel(m) {
  const errors = [];

  if (!isObj(m)) {
    return { ok: false, errors: ['model: expected an object'] };
  }

  // --- scalar identity fields ---------------------------------------------
  if (!isStr(m.name) || m.name.length === 0) {
    errors.push('name: expected a non-empty string');
  }
  if (!isStr(m.category) || m.category.length === 0) {
    errors.push('category: expected a non-empty string');
  }
  if (!isStr(m.ui)) {
    errors.push('ui: expected a string');
  } else if (!UI_MODES.includes(m.ui)) {
    errors.push(`ui: "${m.ui}" not one of ${UI_MODES.join('|')}`);
  }

  // --- consumes ------------------------------------------------------------
  if (!isObj(m.consumes)) {
    errors.push('consumes: expected an object');
  } else {
    const c = m.consumes;
    if (!isArr(c.selection)) {
      errors.push('consumes.selection: expected an array');
    } else {
      c.selection.forEach((s, i) => {
        if (!SELECTION_KINDS.includes(s)) {
          errors.push(
            `consumes.selection[${i}]: "${s}" not one of ${SELECTION_KINDS.join('|')}`
          );
        }
      });
    }
    if (!isStr(c.minimum)) errors.push('consumes.minimum: expected a string');
    if (!isStr(c.description)) errors.push('consumes.description: expected a string');
  }

  // --- controls ------------------------------------------------------------
  if (!isArr(m.controls)) {
    errors.push('controls: expected an array');
  } else {
    m.controls.forEach((ctrl, i) => {
      const w = `controls[${i}]`;
      if (!isObj(ctrl)) {
        errors.push(`${w}: expected an object`);
        return;
      }
      if (!isStr(ctrl.name) || ctrl.name.length === 0) {
        errors.push(`${w}.name: expected a non-empty string`);
      }
      if (!isStr(ctrl.type)) {
        errors.push(`${w}.type: expected a string`);
      } else if (!CONTROL_TYPES.includes(ctrl.type)) {
        errors.push(`${w}.type: "${ctrl.type}" not one of ${CONTROL_TYPES.join('|')}`);
      }
      if (!isStr(ctrl.role)) errors.push(`${w}.role: expected a string`);
      if (!('default' in ctrl)) errors.push(`${w}.default: missing (use null if none)`);
      if ('range' in ctrl) checkRange(ctrl.range, `${w}.range`, errors);
      if ('options' in ctrl) checkStringArray(ctrl.options, `${w}.options`, errors);
    });
  }

  // --- functions -----------------------------------------------------------
  checkStringArray(m.functions, 'functions', errors);

  // --- scriptSim -----------------------------------------------------------
  if (!isObj(m.scriptSim)) {
    errors.push('scriptSim: expected an object');
  } else {
    const s = m.scriptSim;
    if (!isStr(s.scenario)) errors.push('scriptSim.scenario: expected a string');
    if (!isStr(s.inputs)) errors.push('scriptSim.inputs: expected a string');
    if (!isArr(s.operations)) {
      errors.push('scriptSim.operations: expected an array');
    } else {
      s.operations.forEach((op, i) => {
        const w = `scriptSim.operations[${i}]`;
        if (!isObj(op)) {
          errors.push(`${w}: expected an object`);
          return;
        }
        if (!isStr(op.kind) || op.kind.length === 0) {
          errors.push(`${w}.kind: expected a non-empty string`);
        }
        if (!isStr(op.target)) errors.push(`${w}.target: expected a string`);
        // value is optional and untyped.
      });
    }
  }

  // --- expressions ---------------------------------------------------------
  if (!isArr(m.expressions)) {
    errors.push('expressions: expected an array');
  } else {
    m.expressions.forEach((e, i) => {
      const w = `expressions[${i}]`;
      if (!isObj(e)) {
        errors.push(`${w}: expected an object`);
        return;
      }
      if (!isStr(e.target) || e.target.length === 0) {
        errors.push(`${w}.target: expected a non-empty string`);
      }
      if (!isStr(e.expression)) errors.push(`${w}.expression: expected a string`);

      // controlBinding may be null or a ControlBinding object.
      if (e.controlBinding === null || e.controlBinding === undefined) {
        if (!('controlBinding' in e)) {
          errors.push(`${w}.controlBinding: missing (use null if none)`);
        }
      } else if (!isObj(e.controlBinding)) {
        errors.push(`${w}.controlBinding: expected an object or null`);
      } else {
        const b = e.controlBinding;
        if (!isStr(b.control)) errors.push(`${w}.controlBinding.control: expected a string`);
        if (!isStr(b.param)) errors.push(`${w}.controlBinding.param: expected a string`);
        checkRange(b.range, `${w}.controlBinding.range`, errors);
      }

      // sim
      if (!isObj(e.sim)) {
        errors.push(`${w}.sim: expected an object`);
      } else {
        const sim = e.sim;
        if (!SIM_VARIABLES.includes(sim.variable)) {
          errors.push(
            `${w}.sim.variable: "${sim.variable}" not one of ${SIM_VARIABLES.join('|')}`
          );
        }
        checkRange(sim.range, `${w}.sim.range`, errors);
        if (!isNum(sim.steps) || sim.steps < 2) {
          errors.push(`${w}.sim.steps: expected a number >= 2`);
        }
        if (!isStr(sim.note)) errors.push(`${w}.sim.note: expected a string`);
      }
    });
  }

  // --- notes ---------------------------------------------------------------
  checkStringArray(m.notes, 'notes', errors);

  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// validateRenderArtifacts
// ---------------------------------------------------------------------------

/**
 * Validate a RenderArtifacts record. Never throws.
 * @param {*} r
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRenderArtifacts(r) {
  const errors = [];

  if (!isObj(r)) {
    return { ok: false, errors: ['artifacts: expected an object'] };
  }

  if (!isStr(r.name) || r.name.length === 0) {
    errors.push('name: expected a non-empty string');
  }

  if (r.screenshot !== null && !isStr(r.screenshot)) {
    errors.push('screenshot: expected a string path or null');
  }
  if (r.uiTreePath !== null && !isStr(r.uiTreePath)) {
    errors.push('uiTreePath: expected a string path or null');
  }

  if (!isArr(r.expressionCurves)) {
    errors.push('expressionCurves: expected an array');
  } else {
    r.expressionCurves.forEach((curve, i) => {
      const w = `expressionCurves[${i}]`;
      if (!isObj(curve)) {
        errors.push(`${w}: expected an object`);
        return;
      }
      if (!isStr(curve.target) || curve.target.length === 0) {
        errors.push(`${w}.target: expected a non-empty string`);
      }
      if (!isStr(curve.xLabel)) errors.push(`${w}.xLabel: expected a string`);
      if (!isStr(curve.yLabel)) errors.push(`${w}.yLabel: expected a string`);
      if (!isArr(curve.samples)) {
        errors.push(`${w}.samples: expected an array`);
      } else {
        curve.samples.forEach((pt, j) => {
          const pw = `${w}.samples[${j}]`;
          if (!isObj(pt) || !isNum(pt.x) || !isNum(pt.y)) {
            errors.push(`${pw}: expected { x:number, y:number }`);
          }
        });
      }
    });
  }

  checkStringArray(r.notes, 'notes', errors);

  return { ok: errors.length === 0, errors };
}
