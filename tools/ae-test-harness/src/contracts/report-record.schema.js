/**
 * FROZEN CONTRACT — report record schema.
 *
 * A ReportRecord is the per-script aggregate produced by the reporting subsystem, combining the
 * outcomes of every check (static / expressions / functional / ui), risk, confidence, artifacts,
 * and notes.
 *
 * Validators NEVER throw. They return { ok: boolean, errors: string[] }.
 */

/**
 * @typedef {Object} CheckStatus
 * @property {'pass'|'fail'|'skip'|'warn'} status
 * @property {string} [detail]
 * @property {*} [evidence]
 */

/**
 * @typedef {Object} RiskStatus
 * @property {boolean} aeOnly        True when the risk only manifests inside live After Effects.
 * @property {boolean} knownBlocked  True when functionality is known to be blocked in simulation.
 * @property {string[]} items
 */

/**
 * @typedef {Object} ReportRecord
 * @property {string} name
 * @property {string} category
 * @property {boolean} ui
 * @property {CheckStatus} static
 * @property {CheckStatus} expressions
 * @property {CheckStatus} functional
 * @property {CheckStatus} uiStatus
 * @property {RiskStatus} risk
 * @property {'high'|'medium'|'low'|'known-blocked'} confidence
 * @property {string[]} artifacts
 * @property {string[]} notes
 */

const CHECK_STATUS_VALUES = ['pass', 'fail', 'skip', 'warn'];

/**
 * The complete, frozen set of confidence levels.
 * @type {string[]}
 */
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low', 'known-blocked'];

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isStr(v) {
  return typeof v === 'string';
}
function isBool(v) {
  return typeof v === 'boolean';
}

/**
 * Validate a CheckStatus. Never throws.
 * @param {*} cs
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCheckStatus(cs) {
  const errors = [];
  if (!isObj(cs)) {
    return { ok: false, errors: ['CheckStatus must be an object'] };
  }
  if (!CHECK_STATUS_VALUES.includes(cs.status)) {
    errors.push(`status must be one of ${CHECK_STATUS_VALUES.join('|')}`);
  }
  if ('detail' in cs && cs.detail != null && !isStr(cs.detail)) {
    errors.push('detail must be a string when present');
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {*} cs
 * @param {string} where
 * @param {string[]} errors
 */
function checkNestedCheckStatus(cs, where, errors) {
  const res = validateCheckStatus(cs);
  if (!res.ok) res.errors.forEach((e) => errors.push(`${where}.${e}`));
}

/**
 * Validate a ReportRecord. Never throws.
 * @param {*} rec
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateReportRecord(rec) {
  const errors = [];
  if (!isObj(rec)) {
    return { ok: false, errors: ['ReportRecord must be an object'] };
  }
  if (!isStr(rec.name)) errors.push('name must be a string');
  if (!isStr(rec.category)) errors.push('category must be a string');
  if (!isBool(rec.ui)) errors.push('ui must be a boolean');

  checkNestedCheckStatus(rec.static, 'static', errors);
  checkNestedCheckStatus(rec.expressions, 'expressions', errors);
  checkNestedCheckStatus(rec.functional, 'functional', errors);
  checkNestedCheckStatus(rec.uiStatus, 'uiStatus', errors);

  if (!isObj(rec.risk)) {
    errors.push('risk must be an object');
  } else {
    if (!isBool(rec.risk.aeOnly)) errors.push('risk.aeOnly must be a boolean');
    if (!isBool(rec.risk.knownBlocked)) errors.push('risk.knownBlocked must be a boolean');
    if (!Array.isArray(rec.risk.items) || !rec.risk.items.every(isStr)) {
      errors.push('risk.items must be an array of strings');
    }
  }

  if (!CONFIDENCE_LEVELS.includes(rec.confidence)) {
    errors.push(`confidence must be one of ${CONFIDENCE_LEVELS.join('|')}`);
  }
  if (!Array.isArray(rec.artifacts) || !rec.artifacts.every(isStr)) {
    errors.push('artifacts must be an array of strings');
  }
  if (!Array.isArray(rec.notes) || !rec.notes.every(isStr)) {
    errors.push('notes must be an array of strings');
  }

  return { ok: errors.length === 0, errors };
}

export { CHECK_STATUS_VALUES };
