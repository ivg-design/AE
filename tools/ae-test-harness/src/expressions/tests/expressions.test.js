/**
 * Tests for src/expressions/index.js
 *
 * Exercises extraction against real catalog scripts that write `.expression`, plus targeted
 * unit cases for parseExpression and classifyRecord.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  extractLiteralExpressions,
  parseExpression,
  classifyRecord
} from '../index.js';
import {
  validateExpressionRecord,
  validateOperation,
  OPERATION_KINDS
} from '../../contracts/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = resolve(
  __dirname,
  '../../../../../packages/ae-scripts/src'
);

const LINEARIZER = resolve(SCRIPTS_DIR, 'animation/Linearizer.jsx');
const VERTEX_MASTER = resolve(SCRIPTS_DIR, 'paths/VertexMaster.jsx');

function readScript(p) {
  return readFileSync(p, 'utf8');
}

describe('parseExpression', () => {
  it('parses valid ES2018 expression text as ok', () => {
    const r = parseExpression('var x = thisComp.layer("L").position; x;');
    expect(r.ok).toBe(true);
    expect(r.error).toBeUndefined();
  });

  it('parses ES2018-only syntax (spread / template) as ok', () => {
    const r = parseExpression('var a = [1, 2]; var b = [...a, 3]; `${b.length}`;');
    expect(r.ok).toBe(true);
  });

  it('reports a parse error for malformed expression text', () => {
    const r = parseExpression('var = = ;');
    expect(r.ok).toBe(false);
    expect(typeof r.error).toBe('string');
    expect(r.error.length).toBeGreaterThan(0);
  });

  it('never throws on non-string input', () => {
    expect(() => parseExpression(null)).not.toThrow();
    const r = parseExpression(42);
    expect(r.ok).toBe(false);
  });
});

describe('classifyRecord', () => {
  it('marks dynamic (non-static) records as dynamic-unresolved', () => {
    const rec = classifyRecord({
      script: 's',
      targetPath: 'p/expression',
      source: 'literal',
      expression: 'someIdentifier',
      _static: false
    });
    expect(rec.parseStatus).toBe('dynamic-unresolved');
  });

  it('marks static valid expressions as ok', () => {
    const rec = classifyRecord({
      script: 's',
      targetPath: 'p',
      source: 'literal',
      expression: 'thisComp.layer("L").position;',
      _static: true
    });
    expect(rec.parseStatus).toBe('ok');
  });

  it('marks static but unparseable expressions as error', () => {
    const rec = classifyRecord({
      script: 's',
      targetPath: 'p',
      source: 'literal',
      expression: 'function (',
      _static: true
    });
    expect(rec.parseStatus).toBe('error');
    expect(typeof rec.error).toBe('string');
  });

  it('produces records that pass the contract validator', () => {
    const rec = classifyRecord({
      script: 's',
      targetPath: 'p',
      source: 'literal',
      expression: 'value;',
      _static: true
    });
    expect(validateExpressionRecord(rec).ok).toBe(true);
  });
});

describe('extractLiteralExpressions — static cases', () => {
  it('extracts a static string-literal expression as ok', () => {
    const code = 'layer.position.expression = "wiggle(2, 30);";';
    const recs = extractLiteralExpressions(code, 'inline.jsx');
    expect(recs.length).toBe(1);
    expect(recs[0].targetPath).toBe('layer/position');
    expect(recs[0].source).toBe('literal');
    expect(recs[0].parseStatus).toBe('ok');
    expect(recs[0].expression).toBe('wiggle(2, 30);');
  });

  it('folds [...].join("\\n") of static strings into one ok expression', () => {
    const code = [
      'p.expression = [',
      '  "var v = value;",',
      '  "v;"',
      '].join("\\n");'
    ].join('\n');
    const recs = extractLiteralExpressions(code, 'join.jsx');
    expect(recs.length).toBe(1);
    expect(recs[0].parseStatus).toBe('ok');
    expect(recs[0].expression).toContain('var v = value;');
    expect(recs[0].expression).toContain('v;');
  });

  it('classifies runtime concatenation as dynamic-unresolved', () => {
    const code = 'p.expression = "thisComp.layer(\\"" + name + "\\").position;";';
    const recs = extractLiteralExpressions(code, 'concat.jsx');
    expect(recs.length).toBe(1);
    expect(recs[0].parseStatus).toBe('dynamic-unresolved');
  });

  it('classifies a bare identifier RHS as dynamic-unresolved', () => {
    const code = 'targetProperty.expression = expression;';
    const recs = extractLiteralExpressions(code, 'ident.jsx');
    expect(recs.length).toBe(1);
    expect(recs[0].parseStatus).toBe('dynamic-unresolved');
    expect(recs[0].expression).toBe('expression');
  });

  it('handles computed-member targets (a[i].expression) without throwing', () => {
    const code = 'props[i].expression = exprs[i];';
    const recs = extractLiteralExpressions(code, 'computed.jsx');
    expect(recs.length).toBe(1);
    expect(recs[0].parseStatus).toBe('dynamic-unresolved');
  });

  it('returns [] for unparseable script source (never throws)', () => {
    expect(() => extractLiteralExpressions('function (((', 'bad.jsx')).not.toThrow();
    expect(extractLiteralExpressions('function (((', 'bad.jsx')).toEqual([]);
  });

  it('returns [] for empty / non-string code', () => {
    expect(extractLiteralExpressions('', 's')).toEqual([]);
    expect(extractLiteralExpressions(null, 's')).toEqual([]);
  });
});

describe('extractLiteralExpressions — real catalog scripts', () => {
  let linRecs;
  let vmRecs;

  beforeAll(() => {
    linRecs = extractLiteralExpressions(readScript(LINEARIZER), 'Linearizer.jsx');
    vmRecs = extractLiteralExpressions(readScript(VERTEX_MASTER), 'VertexMaster.jsx');
  });

  it('produces records from Linearizer.jsx', () => {
    expect(Array.isArray(linRecs)).toBe(true);
    expect(linRecs.length).toBeGreaterThan(0);
  });

  it('produces records from VertexMaster.jsx', () => {
    expect(Array.isArray(vmRecs)).toBe(true);
    expect(vmRecs.length).toBeGreaterThan(0);
  });

  it('every record from real scripts passes the contract validator', () => {
    for (const rec of [...linRecs, ...vmRecs]) {
      const v = validateExpressionRecord(rec);
      expect(v.ok, `${rec.script} ${rec.targetPath}: ${v.errors.join(', ')}`).toBe(true);
      expect(rec.script).toBeTruthy();
      expect(['ok', 'error', 'dynamic-unresolved']).toContain(rec.parseStatus);
    }
  });

  it('Linearizer assigns identifier-built expressions => dynamic-unresolved present', () => {
    // Linearizer does `targetProperty.expression = expression;` and
    // `selectedProperty.expression = testExpressions[i];`
    const dyn = linRecs.filter((r) => r.parseStatus === 'dynamic-unresolved');
    expect(dyn.length).toBeGreaterThan(0);
  });

  it('VertexMaster assigns dynamic expressions => dynamic-unresolved present', () => {
    const dyn = vmRecs.filter((r) => r.parseStatus === 'dynamic-unresolved');
    expect(dyn.length).toBeGreaterThan(0);
  });
});

describe('extractLiteralExpressions — operation logging', () => {
  it('logs setExpression operations using OPERATION_KINDS', () => {
    const log = [];
    const code = 'layer.opacity.expression = "value;";';
    const recs = extractLiteralExpressions(code, 'log.jsx', { log });
    expect(recs.length).toBe(1);
    expect(log.length).toBe(1);
    expect(log[0].kind).toBe('setExpression');
    expect(OPERATION_KINDS).toContain(log[0].kind);
    expect(validateOperation(log[0]).ok).toBe(true);
    expect(log[0].target).toBe('layer/opacity');
  });
});
