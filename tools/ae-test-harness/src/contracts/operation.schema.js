/**
 * FROZEN CONTRACT — host operation log schema.
 *
 * Every mutation performed by a script against the simulated host is recorded as an Operation
 * and pushed to the host __log. Fixtures assert against Partial<Operation> shapes.
 *
 * Validators NEVER throw. They return { ok: boolean, errors: string[] }.
 */

/**
 * @typedef {Object} Operation
 * @property {string} kind     One of OPERATION_KINDS.
 * @property {string} [target] Slash-separated path or identifier the operation targeted.
 * @property {*} [value]
 * @property {Object} [meta]
 */

/**
 * The complete, frozen set of operation kinds the host may emit.
 * @type {string[]}
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

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isStr(v) {
  return typeof v === 'string';
}

/**
 * Validate an Operation. Never throws.
 * @param {*} op
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateOperation(op) {
  const errors = [];
  if (!isObj(op)) {
    return { ok: false, errors: ['Operation must be an object'] };
  }
  if (!isStr(op.kind)) {
    errors.push('kind must be a string');
  } else if (!OPERATION_KINDS.includes(op.kind)) {
    errors.push(`kind must be one of ${OPERATION_KINDS.join('|')}`);
  }
  if ('target' in op && op.target != null && !isStr(op.target)) {
    errors.push('target must be a string when present');
  }
  if ('meta' in op && op.meta != null && !isObj(op.meta)) {
    errors.push('meta must be an object when present');
  }
  return { ok: errors.length === 0, errors };
}
