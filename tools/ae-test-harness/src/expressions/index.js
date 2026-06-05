/**
 * src/expressions/index.js — AE expression extraction & classification.
 *
 * Walks a script's AST (acorn + acorn-walk) to find every place where the script assigns an
 * After Effects expression to a property's `.expression`, captures the source text statically
 * (source:'literal'), parses it as ES2018, and classifies records that cannot be statically
 * resolved (built from runtime concatenation / templates / identifiers) as 'dynamic-unresolved'.
 *
 * Exports:
 *   - extractLiteralExpressions(code, scriptName) -> ExpressionRecord[]
 *   - parseExpression(expr)                       -> { ok:boolean, error?:string }
 *   - classifyRecord(rec)                         -> ExpressionRecord (parseStatus filled in)
 *
 * All operation logging (when a host log is supplied) uses OPERATION_KINDS from the frozen
 * contracts module. This module is importable in isolation.
 */

import { parse } from 'acorn';
import * as walk from 'acorn-walk';
import {
  EXPRESSION_PARSE_STATUSES,
  OPERATION_KINDS,
  validateExpressionRecord
} from '../contracts/index.js';

/** ES2018 parse options for top-level script parsing (lenient like ExtendScript hosting). */
const SCRIPT_PARSE_OPTS = Object.freeze({
  ecmaVersion: 2018,
  sourceType: 'script',
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowHashBang: true
});

/** ES2018 parse options for the embedded AE expression text itself. */
const EXPRESSION_PARSE_OPTS = Object.freeze({
  ecmaVersion: 2018,
  sourceType: 'script',
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true
});

const PARSE_STATUS = Object.freeze({
  OK: EXPRESSION_PARSE_STATUSES[0], // 'ok'
  ERROR: EXPRESSION_PARSE_STATUSES[1], // 'error'
  DYNAMIC: EXPRESSION_PARSE_STATUSES[2] // 'dynamic-unresolved'
});

/**
 * Parse an AE expression string as ES2018. Never throws.
 * @param {string} expr
 * @returns {{ ok: boolean, error?: string }}
 */
export function parseExpression(expr) {
  if (typeof expr !== 'string') {
    return { ok: false, error: 'expression must be a string' };
  }
  try {
    parse(expr, EXPRESSION_PARSE_OPTS);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? String(err.message) : String(err) };
  }
}

/**
 * Whether an AST node is a statically resolvable string value.
 * Plain string literals (and template literals with no substitutions) are static.
 * @param {object} node
 * @returns {boolean}
 */
function isStaticStringNode(node) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'Literal') return typeof node.value === 'string';
  if (node.type === 'TemplateLiteral') return node.expressions.length === 0;
  return false;
}

/**
 * Attempt to fold an AST node into a static string. Returns null when it cannot be
 * resolved without runtime information (identifiers, member access, calls, function output).
 *
 * Handles:
 *   - string Literal
 *   - TemplateLiteral with no expressions
 *   - binary `+` concatenations where BOTH sides fold to static strings/numbers
 *   - parenthesised expressions (acorn already strips these)
 *   - Array#join() of static string elements with a static/absent separator
 *
 * @param {object} node
 * @returns {{ value: string } | null}
 */
function foldStaticString(node) {
  if (!node || typeof node !== 'object') return null;

  switch (node.type) {
    case 'Literal': {
      if (typeof node.value === 'string') return { value: node.value };
      if (typeof node.value === 'number' || typeof node.value === 'boolean') {
        return { value: String(node.value) };
      }
      return null;
    }
    case 'TemplateLiteral': {
      if (node.expressions.length === 0 && node.quasis.length === 1) {
        return { value: node.quasis[0].value.cooked ?? node.quasis[0].value.raw };
      }
      return null;
    }
    case 'BinaryExpression': {
      if (node.operator !== '+') return null;
      const left = foldStaticString(node.left);
      const right = foldStaticString(node.right);
      if (left == null || right == null) return null;
      return { value: left.value + right.value };
    }
    case 'CallExpression': {
      // Only fold `[ ...static strings... ].join(staticSep?)`.
      const callee = node.callee;
      if (
        callee &&
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.property &&
        callee.property.name === 'join' &&
        callee.object &&
        callee.object.type === 'ArrayExpression'
      ) {
        const elements = callee.object.elements;
        const folded = [];
        for (const el of elements) {
          if (el == null) return null; // holes -> not static
          const f = foldStaticString(el);
          if (f == null) return null;
          folded.push(f.value);
        }
        let sep = '\n';
        if (node.arguments.length === 0) {
          sep = ',';
        } else if (node.arguments.length === 1) {
          const sepFold = foldStaticString(node.arguments[0]);
          if (sepFold == null) return null;
          sep = sepFold.value;
        } else {
          return null;
        }
        return { value: folded.join(sep) };
      }
      return null;
    }
    default:
      return null;
  }
}

/**
 * Build a best-effort textual representation of the right-hand side of an `.expression`
 * assignment for records we cannot statically resolve. We keep the raw source slice so the
 * record's `expression` field carries the dynamic source for downstream reporting.
 * @param {object} node
 * @param {string} code
 * @returns {string}
 */
function sourceSlice(node, code) {
  if (node && typeof node.start === 'number' && typeof node.end === 'number') {
    return code.slice(node.start, node.end);
  }
  return '';
}

/**
 * Resolve the slash/identifier target path for an `.expression` assignment.
 * For `foo.bar.expression = ...` we render `foo.bar`. For computed members
 * (`a[i].expression`) we render the source slice of the object.
 * @param {object} objectNode  The object of the `<obj>.expression` member expression.
 * @param {string} code
 * @returns {string}
 */
function resolveTargetPath(objectNode, code) {
  const parts = [];
  let cur = objectNode;
  let bailed = false;
  while (cur) {
    if (cur.type === 'Identifier') {
      parts.unshift(cur.name);
      break;
    } else if (cur.type === 'ThisExpression') {
      parts.unshift('this');
      break;
    } else if (cur.type === 'MemberExpression') {
      if (cur.computed) {
        // e.g. testExpressions[i] — fall back to source slice for the whole object.
        bailed = true;
        break;
      }
      if (cur.property && cur.property.name) parts.unshift(cur.property.name);
      cur = cur.object;
    } else if (cur.type === 'CallExpression') {
      // e.g. layer.property("Position").expression — represent the call by source.
      bailed = true;
      break;
    } else {
      bailed = true;
      break;
    }
  }
  if (bailed || parts.length === 0) {
    const raw = sourceSlice(objectNode, code);
    return raw || '<unknown>';
  }
  return parts.join('/');
}

/**
 * Determine whether a member-expression node represents a `.expression` target.
 * Matches both `obj.expression` and `obj["expression"]`.
 * @param {object} memberNode
 * @returns {boolean}
 */
function isExpressionMember(memberNode) {
  if (!memberNode || memberNode.type !== 'MemberExpression') return false;
  if (!memberNode.computed) {
    return !!(memberNode.property && memberNode.property.name === 'expression');
  }
  return !!(
    memberNode.property &&
    memberNode.property.type === 'Literal' &&
    memberNode.property.value === 'expression'
  );
}

/**
 * Create a single ExpressionRecord (unclassified — parseStatus filled by classifyRecord).
 * @param {object} params
 * @returns {import('../contracts/index.js').ExpressionRecord}
 */
function makeRecord({ script, targetPath, expression, isStatic }) {
  return {
    script,
    targetPath,
    source: 'literal',
    expression,
    // Provisional status; classifyRecord refines it.
    parseStatus: isStatic ? PARSE_STATUS.OK : PARSE_STATUS.DYNAMIC,
    _static: isStatic
  };
}

/**
 * Classify (or re-classify) an ExpressionRecord by parsing its expression text as ES2018.
 *
 *  - Non-static (dynamic) right-hand sides  -> 'dynamic-unresolved'
 *  - Static text that parses cleanly        -> 'ok'
 *  - Static text that fails to parse        -> 'error' (with `.error`)
 *
 * The internal `_static` hint (set during extraction) is honoured when present; otherwise the
 * record's existing parseStatus is used to infer staticness.
 * @param {import('../contracts/index.js').ExpressionRecord} rec
 * @returns {import('../contracts/index.js').ExpressionRecord}
 */
export function classifyRecord(rec) {
  const out = {
    script: rec.script,
    targetPath: rec.targetPath,
    source: rec.source === 'runtime' ? 'runtime' : 'literal',
    expression: typeof rec.expression === 'string' ? rec.expression : String(rec.expression ?? '')
  };

  const isStatic =
    typeof rec._static === 'boolean'
      ? rec._static
      : rec.parseStatus !== PARSE_STATUS.DYNAMIC;

  if (!isStatic) {
    out.parseStatus = PARSE_STATUS.DYNAMIC;
    return out;
  }

  const parsed = parseExpression(out.expression);
  if (parsed.ok) {
    out.parseStatus = PARSE_STATUS.OK;
  } else {
    out.parseStatus = PARSE_STATUS.ERROR;
    out.error = parsed.error;
  }
  return out;
}

/**
 * Optionally record an extraction as a host Operation (setExpression) onto a provided log.
 * Uses OPERATION_KINDS from the frozen contract so logging stays contract-aligned.
 * @param {import('../contracts/index.js').Operation[]|undefined} log
 * @param {import('../contracts/index.js').ExpressionRecord} rec
 */
function logSetExpression(log, rec) {
  if (!Array.isArray(log)) return;
  log.push({
    kind: OPERATION_KINDS[4], // 'setExpression'
    target: rec.targetPath,
    value: rec.expression,
    meta: { source: rec.source, parseStatus: rec.parseStatus }
  });
}

/**
 * Extract every literal/static AE expression assignment from a script's source code.
 *
 * Recognised patterns:
 *   - `<anything>.expression = <rhs>`                         (assignment to .expression)
 *   - `<anything>["expression"] = <rhs>`                      (computed form)
 *   - `prop.setExpression(<rhs>)` / `prop.essentialProperty.setExpression(<rhs>)`
 *
 * The right-hand side is statically folded when possible (string literals, no-substitution
 * template literals, `+` concatenations of static parts, and `[...].join(sep)` of static
 * strings). Non-foldable right-hand sides (identifiers, member access, calls, dynamic
 * concatenation/templates) are emitted as 'dynamic-unresolved'.
 *
 * Never throws: if the script itself fails to parse, returns an empty array.
 *
 * @param {string} code         Full script source.
 * @param {string} scriptName   Name recorded on each ExpressionRecord.
 * @param {object} [opts]
 * @param {import('../contracts/index.js').Operation[]} [opts.log]  Optional host op log.
 * @returns {import('../contracts/index.js').ExpressionRecord[]}
 */
export function extractLiteralExpressions(code, scriptName, opts = {}) {
  const records = [];
  if (typeof code !== 'string' || code.length === 0) return records;
  const script = typeof scriptName === 'string' && scriptName ? scriptName : 'unknown';
  const log = opts && opts.log;

  let ast;
  try {
    ast = parse(code, SCRIPT_PARSE_OPTS);
  } catch {
    return records;
  }

  const seen = new Set();

  const pushRecord = (targetPath, rhsNode) => {
    const folded = foldStaticString(rhsNode);
    const isStatic = folded != null;
    const expression = isStatic ? folded.value : sourceSlice(rhsNode, code);
    const dedupeKey = `${targetPath} ${expression} ${isStatic}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    let rec = makeRecord({ script, targetPath, expression, isStatic });
    rec = classifyRecord(rec);

    const valid = validateExpressionRecord(rec);
    if (!valid.ok) {
      // Should not happen given our construction, but never emit invalid records.
      return;
    }
    records.push(rec);
    logSetExpression(log, rec);
  };

  walk.simple(ast, {
    AssignmentExpression(node) {
      if (node.operator !== '=') return;
      const left = node.left;
      if (!isExpressionMember(left)) return;
      const targetPath = resolveTargetPath(left.object, code);
      pushRecord(targetPath, node.right);
    },
    CallExpression(node) {
      const callee = node.callee;
      if (
        callee &&
        callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.property &&
        callee.property.name === 'setExpression' &&
        node.arguments.length >= 1
      ) {
        const targetPath = resolveTargetPath(callee.object, code);
        pushRecord(targetPath, node.arguments[0]);
      }
    }
  });

  return records;
}

export { PARSE_STATUS as EXPRESSION_PARSE_STATUS };
