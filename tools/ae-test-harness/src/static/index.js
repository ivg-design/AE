/**
 * Static analysis subsystem.
 *
 * Pure, side-effect-free analyzers over ExtendScript (.jsx) source text:
 *   - parseECMA3(code)         -> { ok, errors[] }   ECMA3 parse gate (acorn ecmaVersion:3)
 *   - scanModernAPI(code)      -> { findings[] }      flag non-ES3 syntax/API with line numbers
 *   - validateFrontmatter(code)-> { fields, findings[] } parse the leading /** ... *\/ doc block
 *   - scanIncludes(code)       -> { includes[], blocked } detect file-inclusion directives
 *
 * Every "operation"-style log we emit references OPERATION_KINDS from the frozen contracts
 * module so downstream report/risk code can correlate static findings with host operations.
 *
 * This module is importable in isolation: it imports only acorn, acorn-walk, and the contracts
 * barrel. None of its exports throw for malformed input — they return structured results.
 */

import { parse as acornParse } from 'acorn';
import * as walk from 'acorn-walk';
import { OPERATION_KINDS } from '../contracts/index.js';

/**
 * Subset of OPERATION_KINDS that static findings may reference when a modern-API usage maps to a
 * host operation (e.g. a JSON.stringify feeding a fileWrite). Used only for tagging/logging so the
 * static layer never invents kinds outside the frozen set.
 * @type {Set<string>}
 */
const KNOWN_OPERATION_KINDS = new Set(OPERATION_KINDS);

/**
 * Tag a finding with a contract operation kind when one applies, otherwise null.
 * Guarantees we never emit a kind outside the frozen OPERATION_KINDS set.
 * @param {string|null|undefined} kind
 * @returns {string|null}
 */
function operationKind(kind) {
  return kind && KNOWN_OPERATION_KINDS.has(kind) ? kind : null;
}

/* ------------------------------------------------------------------------------------------------
 * parseECMA3
 * ---------------------------------------------------------------------------------------------- */

/**
 * Parse source under strict ECMAScript 3 rules. ExtendScript targets ES3, so anything that fails
 * here is, at minimum, a portability concern.
 *
 * Never throws: acorn's SyntaxError is caught and normalized into an error string carrying the
 * 1-based line/column reported by acorn (locations:true is enabled).
 *
 * @param {string} code
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function parseECMA3(code) {
  const errors = [];
  if (typeof code !== 'string') {
    return { ok: false, errors: ['code must be a string'] };
  }
  try {
    acornParse(code, {
      ecmaVersion: 3,
      allowReturnOutsideFunction: true,
      locations: true,
      // ExtendScript files are scripts, never modules.
      sourceType: 'script'
    });
  } catch (err) {
    const loc = err && err.loc;
    if (loc && typeof loc.line === 'number') {
      errors.push(`${err.message} (line ${loc.line}:${loc.column})`);
    } else {
      errors.push(err && err.message ? err.message : String(err));
    }
  }
  return { ok: errors.length === 0, errors };
}

/* ------------------------------------------------------------------------------------------------
 * scanModernAPI
 * ---------------------------------------------------------------------------------------------- */

/**
 * @typedef {Object} ModernApiFinding
 * @property {string} rule        Stable identifier for the rule that fired.
 * @property {string} feature     Human-readable feature label.
 * @property {string} category    'syntax' | 'method' | 'global'
 * @property {number} line        1-based line number.
 * @property {number} column      0-based column (acorn convention).
 * @property {string} detail      Short description.
 * @property {string|null} operationKind  Related OPERATION_KINDS entry, when applicable.
 */

const ARRAY_PROTO_METHODS = new Set([
  'map',
  'forEach',
  'filter',
  'reduce',
  'reduceRight',
  'some',
  'every',
  'indexOf',
  'lastIndexOf'
]);

// ES5+ globals not present in the ES3/ExtendScript runtime.
const MODERN_GLOBALS = new Set(['JSON']);

/**
 * Scan source for syntax and API features that are unavailable in the ES3 ExtendScript runtime.
 *
 * Detects (each finding carries a 1-based line number):
 *   - `let` / `const` declarations
 *   - arrow functions  (`=>`)
 *   - template literals (and tagged templates)
 *   - Array.prototype iteration methods: map/forEach/filter (+ related higher-order methods)
 *   - JSON global usage (JSON.parse / JSON.stringify)
 *
 * Strategy: parse permissively at a modern ecmaVersion so the AST is available even when ES3
 * parsing would fail (that's exactly the case we want to report on). If even modern parsing fails,
 * fall back to a line-based regex scan so we still surface findings instead of throwing.
 *
 * @param {string} code
 * @returns {{ findings: ModernApiFinding[] }}
 */
export function scanModernAPI(code) {
  if (typeof code !== 'string') {
    return { findings: [] };
  }

  /** @type {ModernApiFinding[]} */
  const findings = [];
  const push = (rule, feature, category, node, detail, opKind) => {
    const loc = node && node.loc && node.loc.start;
    findings.push({
      rule,
      feature,
      category,
      line: loc ? loc.line : 0,
      column: loc ? loc.column : 0,
      detail,
      operationKind: operationKind(opKind)
    });
  };

  let ast = null;
  try {
    ast = acornParse(code, {
      ecmaVersion: 2018,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      locations: true,
      sourceType: 'script'
    });
  } catch {
    // Permissive parse failed; degrade to a regex line scan below.
    ast = null;
  }

  if (ast) {
    walk.ancestor(ast, {
      VariableDeclaration(node) {
        if (node.kind === 'let' || node.kind === 'const') {
          push(
            `modern-${node.kind}`,
            `${node.kind} declaration`,
            'syntax',
            node,
            `'${node.kind}' is ES6 and unavailable in ES3/ExtendScript; use 'var'.`,
            null
          );
        }
      },
      ArrowFunctionExpression(node) {
        push(
          'modern-arrow',
          'arrow function',
          'syntax',
          node,
          'Arrow functions (=>) are ES6; use a function expression.',
          null
        );
      },
      TemplateLiteral(node) {
        push(
          'modern-template-literal',
          'template literal',
          'syntax',
          node,
          'Template literals (`...`) are ES6; use string concatenation.',
          null
        );
      },
      TaggedTemplateExpression(node) {
        push(
          'modern-tagged-template',
          'tagged template literal',
          'syntax',
          node,
          'Tagged template literals are ES6.',
          null
        );
      },
      MemberExpression(node) {
        // Array iteration methods: foo.map(...), foo.filter(...), foo.forEach(...), etc.
        const prop = memberPropertyName(node);
        if (prop && ARRAY_PROTO_METHODS.has(prop) && !node.computed) {
          push(
            `modern-array-${prop}`,
            `Array.prototype.${prop}`,
            'method',
            node.property || node,
            `Array.prototype.${prop} is ES5+; not available in ES3.`,
            null
          );
        }
      },
      Identifier(node, _state, ancestors) {
        // JSON global usage. Only flag when used as a value/object, not as a property key
        // or a declared local binding shadow.
        if (node.name === 'JSON' && isGlobalReference(node, ancestors)) {
          push(
            'modern-json',
            'JSON global',
            'global',
            node,
            'JSON.parse/JSON.stringify are ES5+; polyfill required in ES3.',
            null
          );
        }
      }
    });
  } else {
    regexLineScan(code, findings);
  }

  // Deterministic ordering: by line, then column, then rule.
  findings.sort(
    (a, b) => a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule)
  );
  return { findings };
}

/**
 * Resolve a static member property name (non-computed), or null.
 * @param {any} node MemberExpression
 * @returns {string|null}
 */
function memberPropertyName(node) {
  if (!node || node.type !== 'MemberExpression') return null;
  if (node.computed) {
    return node.property && node.property.type === 'Literal' &&
      typeof node.property.value === 'string'
      ? node.property.value
      : null;
  }
  return node.property && node.property.type === 'Identifier' ? node.property.name : null;
}

/**
 * Decide whether an Identifier node is a *reference* to a global (vs a property key, label, or a
 * declared binding). Conservative: treats it as a global reference unless it is clearly a key.
 * @param {any} node
 * @param {any[]} ancestors  acorn-walk ancestor chain (node is last element)
 * @returns {boolean}
 */
function isGlobalReference(node, ancestors) {
  const parent = ancestors[ancestors.length - 2];
  if (!parent) return true;
  switch (parent.type) {
    case 'MemberExpression':
      // Only the object position counts; `foo.JSON` would be a property access, not the global.
      return parent.object === node;
    case 'Property':
      // `{ JSON: ... }` key, or shorthand — key is not a reference.
      return parent.computed ? parent.key === node : parent.value === node;
    case 'VariableDeclarator':
      return parent.init === node; // id position is a binding, not a reference
    case 'MethodDefinition':
    case 'PropertyDefinition':
    case 'LabeledStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
    case 'FunctionDeclaration':
    case 'FunctionExpression':
      return false;
    default:
      return true;
  }
}

/**
 * Regex fallback used only when even permissive AST parsing fails. Produces approximate findings
 * (line numbers are exact; columns are best-effort) so the scan never silently returns nothing.
 * @param {string} code
 * @param {ModernApiFinding[]} findings
 */
function regexLineScan(code, findings) {
  const lines = code.split(/\r\n|\r|\n/);
  const rules = [
    { rule: 'modern-let', feature: 'let declaration', category: 'syntax', re: /\blet\s+[A-Za-z_$]/ },
    { rule: 'modern-const', feature: 'const declaration', category: 'syntax', re: /\bconst\s+[A-Za-z_$]/ },
    { rule: 'modern-arrow', feature: 'arrow function', category: 'syntax', re: /=>/ },
    { rule: 'modern-template-literal', feature: 'template literal', category: 'syntax', re: /`/ },
    { rule: 'modern-array-map', feature: 'Array.prototype.map', category: 'method', re: /\.map\s*\(/ },
    { rule: 'modern-array-forEach', feature: 'Array.prototype.forEach', category: 'method', re: /\.forEach\s*\(/ },
    { rule: 'modern-array-filter', feature: 'Array.prototype.filter', category: 'method', re: /\.filter\s*\(/ },
    { rule: 'modern-json', feature: 'JSON global', category: 'global', re: /\bJSON\s*\.\s*(parse|stringify)\b/ }
  ];
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    for (const r of rules) {
      const m = r.re.exec(text);
      if (m) {
        findings.push({
          rule: r.rule,
          feature: r.feature,
          category: r.category,
          line: i + 1,
          column: m.index,
          detail: `${r.feature} detected (regex fallback; source did not parse).`,
          operationKind: null
        });
      }
    }
  }
}

/* ------------------------------------------------------------------------------------------------
 * validateFrontmatter
 * ---------------------------------------------------------------------------------------------- */

/**
 * @typedef {Object} FrontmatterFinding
 * @property {'error'|'warn'} severity
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {Object} FrontmatterResult
 * @property {{ name:string|null, author:string|null, version:string|null, date:string|null,
 *             ui:string|null, description:string|null, changelog:string[] }} fields
 * @property {FrontmatterFinding[]} findings
 */

// Tags we expect to be present in a well-formed header block.
const REQUIRED_TAGS = ['name', 'author', 'version', 'date', 'ui', 'description'];

const VERSION_RE = /^\d+\.\d+\.\d+([-+].+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Extract and validate the leading JSDoc-style frontmatter block:
 *
 *   /**
 *    * @name Foo
 *    * @author ...
 *    * @version 1.2.3
 *    * @date 2026-06-02
 *    * @ui DIALOG
 *    * @description ...
 *    * @changelog
 *    * - 2.0.0: ...
 *    *\/
 *
 * Parses @name @author @version @date @ui @description @changelog and returns the resolved fields
 * plus findings for missing tags and format mismatches (version/date/ui shapes). Never throws.
 *
 * @param {string} code
 * @returns {FrontmatterResult}
 */
export function validateFrontmatter(code) {
  /** @type {FrontmatterResult['fields']} */
  const fields = {
    name: null,
    author: null,
    version: null,
    date: null,
    ui: null,
    description: null,
    changelog: []
  };
  /** @type {FrontmatterFinding[]} */
  const findings = [];

  if (typeof code !== 'string') {
    findings.push({ severity: 'error', field: '*', message: 'code must be a string' });
    return { fields, findings };
  }

  const block = extractLeadingBlockComment(code);
  if (block == null) {
    findings.push({
      severity: 'error',
      field: '*',
      message: 'No leading /** ... */ frontmatter block found.'
    });
    return { fields, findings };
  }

  // Normalize the comment body: strip the leading "* " on each line.
  const rawLines = block.split(/\r\n|\r|\n/).map((l) => l.replace(/^\s*\*?\s?/, ''));

  // Walk tags. A tag's value runs until the next @tag line; @changelog collects subsequent
  // "- ..." list items.
  let currentTag = null;
  /** @type {string[]} */
  let currentBuffer = [];
  /** @type {Array<{tag:string, value:string}>} */
  const collected = [];
  const changelog = [];

  const flush = () => {
    if (currentTag) {
      collected.push({ tag: currentTag, value: currentBuffer.join('\n').trim() });
    }
    currentTag = null;
    currentBuffer = [];
  };

  let inChangelog = false;
  for (const line of rawLines) {
    const tagMatch = /^@([A-Za-z][\w-]*)\s*(.*)$/.exec(line);
    if (tagMatch) {
      flush();
      inChangelog = false;
      const tag = tagMatch[1].toLowerCase();
      if (tag === 'changelog') {
        inChangelog = true;
        const inline = tagMatch[2].trim();
        if (inline) changelog.push(inline);
        currentTag = null;
        currentBuffer = [];
        continue;
      }
      currentTag = tag;
      currentBuffer = [tagMatch[2]];
      continue;
    }
    if (inChangelog) {
      const item = line.trim();
      if (item.startsWith('-')) {
        changelog.push(item.replace(/^-\s*/, '').trim());
      } else if (item && changelog.length) {
        // Continuation of the previous changelog entry.
        changelog[changelog.length - 1] += ' ' + item;
      }
      continue;
    }
    if (currentTag) {
      currentBuffer.push(line);
    }
  }
  flush();

  // Assign known single-value tags (first occurrence wins).
  for (const { tag, value } of collected) {
    switch (tag) {
      case 'name':
        if (fields.name == null) fields.name = value;
        break;
      case 'author':
        if (fields.author == null) fields.author = value;
        break;
      case 'version':
        if (fields.version == null) fields.version = value;
        break;
      case 'date':
        if (fields.date == null) fields.date = value;
        break;
      case 'ui':
        if (fields.ui == null) fields.ui = value;
        break;
      case 'description':
        if (fields.description == null) fields.description = value;
        break;
      default:
        break;
    }
  }
  fields.changelog = changelog;

  // Missing-tag findings.
  for (const tag of REQUIRED_TAGS) {
    if (!fields[tag]) {
      findings.push({
        severity: 'error',
        field: tag,
        message: `Missing @${tag} in frontmatter.`
      });
    }
  }
  if (!fields.changelog.length) {
    findings.push({
      severity: 'warn',
      field: 'changelog',
      message: 'Missing or empty @changelog.'
    });
  }

  // Format / mismatch findings.
  if (fields.version && !VERSION_RE.test(fields.version)) {
    findings.push({
      severity: 'warn',
      field: 'version',
      message: `@version "${fields.version}" is not semver (X.Y.Z).`
    });
  }
  if (fields.date && !DATE_RE.test(fields.date)) {
    findings.push({
      severity: 'warn',
      field: 'date',
      message: `@date "${fields.date}" is not ISO (YYYY-MM-DD).`
    });
  }

  // Cross-check: version declared in frontmatter vs. the most recent changelog entry version.
  if (fields.version && fields.changelog.length) {
    const top = fields.changelog[0];
    const vMatch = /(\d+\.\d+\.\d+)/.exec(top);
    if (vMatch && vMatch[1] !== fields.version) {
      findings.push({
        severity: 'warn',
        field: 'version',
        message: `@version "${fields.version}" does not match latest changelog entry "${vMatch[1]}".`
      });
    }
  }

  return { fields, findings };
}

/**
 * Extract the body (without the /** and *\/ delimiters) of the first leading block comment.
 * "Leading" means it appears before any non-whitespace, non-comment code. Returns null if the
 * first meaningful token is not a block comment.
 * @param {string} code
 * @returns {string|null}
 */
function extractLeadingBlockComment(code) {
  let i = 0;
  const n = code.length;
  // Skip a possible shebang / BOM and leading whitespace.
  if (code.charCodeAt(0) === 0xfeff) i = 1;
  while (i < n) {
    const ch = code[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    // Skip leading single-line comments (// ...) — frontmatter may follow them.
    if (ch === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i);
      if (nl === -1) return null;
      i = nl + 1;
      continue;
    }
    break;
  }
  if (code[i] === '/' && code[i + 1] === '*') {
    const end = code.indexOf('*/', i + 2);
    if (end === -1) return null;
    return code.slice(i + 2, end);
  }
  return null;
}

/* ------------------------------------------------------------------------------------------------
 * scanIncludes
 * ---------------------------------------------------------------------------------------------- */

/**
 * @typedef {Object} IncludeRef
 * @property {'@include'|'#include'|'$.evalFile'} kind
 * @property {string} target  The included path/spec as written.
 * @property {number} line    1-based line number.
 */

/**
 * @typedef {Object} ScanIncludesResult
 * @property {IncludeRef[]} includes
 * @property {boolean} blocked   True if ANY include directive is present (these require external
 *                               files the harness cannot resolve in isolation).
 */

// Matches `//@include "path"` or `// @include 'path'` (ExtendScript preprocessor directive).
const INCLUDE_DIRECTIVE_RE = /^\s*\/\/\s*@include\s+(['"])(.*?)\1/;
// Matches `#include "path"` (C-preprocessor style sometimes seen in JSX).
const HASH_INCLUDE_RE = /^\s*#include\s+(['"<])(.*?)(['">])/;
// Matches `$.evalFile("path")` or `$.evalFile(var)` runtime evaluation.
const EVALFILE_RE = /\$\.evalFile\s*\(\s*(?:(['"])(.*?)\1|([^)]+))\)/;

/**
 * Detect file-inclusion directives that the static harness cannot resolve standalone:
 *   - `//@include "..."`  (ExtendScript preprocessor)
 *   - `#include "..."`    (hash-style include)
 *   - `$.evalFile(...)`   (runtime file evaluation)
 *
 * Returns the list of includes and `blocked:true` if any are present. Never throws.
 *
 * @param {string} code
 * @returns {ScanIncludesResult}
 */
export function scanIncludes(code) {
  /** @type {IncludeRef[]} */
  const includes = [];
  if (typeof code !== 'string') {
    return { includes, blocked: false };
  }

  const lines = code.split(/\r\n|\r|\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    const inc = INCLUDE_DIRECTIVE_RE.exec(line);
    if (inc) {
      includes.push({ kind: '@include', target: inc[2], line: lineNo });
    }

    const hash = HASH_INCLUDE_RE.exec(line);
    if (hash) {
      includes.push({ kind: '#include', target: hash[2], line: lineNo });
    }

    // Malformed preprocessor directive: "// @'include ..." etc. AE's
    // preprocessor parses `// @<token>` even though acorn sees a comment,
    // and a quote right after the @ aborts the WHOLE script with
    // "Unable to execute script at line N. Syntax error" (real incident:
    // Centralizer 2.0.2). Treat as include-blocking so it can't ship.
    const mal = /^\s*\/\/\s*@\s*['"]/.exec(line);
    if (mal) {
      includes.push({ kind: 'malformed-directive', target: line.trim(), line: lineNo });
    }

    const ev = EVALFILE_RE.exec(line);
    if (ev) {
      const target = ev[2] != null ? ev[2] : (ev[3] || '').trim();
      includes.push({ kind: '$.evalFile', target, line: lineNo });
    }
  }

  return { includes, blocked: includes.length > 0 };
}

export default {
  parseECMA3,
  scanModernAPI,
  validateFrontmatter,
  scanIncludes
};
