/**
 * FROZEN CONTRACT — extracted AE expression record schema.
 *
 * An ExpressionRecord describes a single AE expression string that a script assigns to a
 * property's `.expression`, captured either statically (source:'literal') or while running
 * in the host (source:'runtime'), with its parse status.
 *
 * Validators NEVER throw. They return { ok: boolean, errors: string[] }.
 */

/**
 * @typedef {Object} ExpressionRecord
 * @property {string} script                              Script name the expression came from.
 * @property {string} targetPath                          Property path the expression targets.
 * @property {'literal'|'runtime'} source
 * @property {string} expression                          The expression text.
 * @property {'ok'|'error'|'dynamic-unresolved'} parseStatus
 * @property {string} [error]                             Parse/extraction error, when parseStatus==='error'.
 */

const SOURCES = ['literal', 'runtime'];
const PARSE_STATUSES = ['ok', 'error', 'dynamic-unresolved'];

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isStr(v) {
  return typeof v === 'string';
}

/**
 * Validate an ExpressionRecord. Never throws.
 * @param {*} rec
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateExpressionRecord(rec) {
  const errors = [];
  if (!isObj(rec)) {
    return { ok: false, errors: ['ExpressionRecord must be an object'] };
  }
  if (!isStr(rec.script)) errors.push('script must be a string');
  if (!isStr(rec.targetPath)) errors.push('targetPath must be a string');
  if (!SOURCES.includes(rec.source)) errors.push(`source must be one of ${SOURCES.join('|')}`);
  if (!isStr(rec.expression)) errors.push('expression must be a string');
  if (!PARSE_STATUSES.includes(rec.parseStatus)) {
    errors.push(`parseStatus must be one of ${PARSE_STATUSES.join('|')}`);
  }
  if ('error' in rec && rec.error != null && !isStr(rec.error)) {
    errors.push('error must be a string when present');
  }
  return { ok: errors.length === 0, errors };
}

export { SOURCES as EXPRESSION_SOURCES, PARSE_STATUSES as EXPRESSION_PARSE_STATUSES };
