import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  parseECMA3,
  scanModernAPI,
  validateFrontmatter,
  scanIncludes
} from '../src/static/index.js';

const SCRIPTS_ROOT =
  '/Users/ivg/github/ae-script-catalog/ae/packages/ae-scripts/src';

/** A couple of real catalog scripts to exercise the ECMA3 gate against. */
const REAL_SCRIPTS = [
  resolve(SCRIPTS_ROOT, 'animation/Linearizer.jsx'),
  resolve(SCRIPTS_ROOT, 'animation/PathMaster.jsx')
];

function read(p) {
  return readFileSync(p, 'utf8');
}

describe('parseECMA3', () => {
  it('returns the { ok, errors[] } shape', () => {
    const res = parseECMA3('var x = 1;');
    expect(res).toHaveProperty('ok');
    expect(res).toHaveProperty('errors');
    expect(typeof res.ok).toBe('boolean');
    expect(Array.isArray(res.errors)).toBe(true);
  });

  it('accepts valid ES3 source', () => {
    const res = parseECMA3('function f(a){ return a + 1; } var y = f(2);');
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('allows return outside a function (ExtendScript pattern)', () => {
    const res = parseECMA3('if (!app) { return; }\nvar z = 1;');
    expect(res.ok).toBe(true);
  });

  it('rejects ES6 syntax (let/arrow) under ES3 with a located error', () => {
    const res = parseECMA3('const add = (a, b) => a + b;');
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0]).toMatch(/line \d+:\d+/);
  });

  it('never throws on garbage input', () => {
    expect(() => parseECMA3('function (')).not.toThrow();
    expect(parseECMA3('function (').ok).toBe(false);
    expect(parseECMA3(null).ok).toBe(false);
  });

  for (const file of REAL_SCRIPTS) {
    it(`runs over real script ${file.split('/').pop()} and returns shape`, () => {
      const code = read(file);
      const res = parseECMA3(code);
      expect(res).toHaveProperty('ok');
      expect(Array.isArray(res.errors)).toBe(true);
      // Whatever the verdict, errors[] entries must be strings.
      for (const e of res.errors) {
        expect(typeof e).toBe('string');
      }
    });
  }
});

describe('scanModernAPI', () => {
  it('flags let/const/arrow/template/array methods/JSON with line numbers', () => {
    const code = [
      'const a = 1;',
      'let b = 2;',
      'var f = (x) => x;',
      'var s = `hi ${a}`;',
      'var m = [1,2].map(function(n){ return n; });',
      'var t = JSON.stringify({});'
    ].join('\n');
    const { findings } = scanModernAPI(code);
    const rules = new Set(findings.map((f) => f.rule));
    expect(rules.has('modern-const')).toBe(true);
    expect(rules.has('modern-let')).toBe(true);
    expect(rules.has('modern-arrow')).toBe(true);
    expect(rules.has('modern-template-literal')).toBe(true);
    expect(rules.has('modern-array-map')).toBe(true);
    expect(rules.has('modern-json')).toBe(true);
    for (const f of findings) {
      expect(typeof f.line).toBe('number');
      expect(f.line).toBeGreaterThan(0);
    }
  });

  it('returns empty findings for clean ES3', () => {
    const { findings } = scanModernAPI('var x = 1; function g(){ return x; }');
    expect(findings).toEqual([]);
  });

  it('does not flag JSON used as a property key', () => {
    const { findings } = scanModernAPI('var o = { JSON: 1 }; var p = o.JSON;');
    expect(findings.find((f) => f.rule === 'modern-json')).toBeUndefined();
  });

  it('never throws', () => {
    expect(() => scanModernAPI(null)).not.toThrow();
  });
});

describe('validateFrontmatter', () => {
  it('parses a real script frontmatter into fields', () => {
    const code = read(REAL_SCRIPTS[0]);
    const { fields, findings } = validateFrontmatter(code);
    expect(fields.name).toBeTruthy();
    expect(fields.version).toBeTruthy();
    expect(fields.ui).toBeTruthy();
    expect(Array.isArray(fields.changelog)).toBe(true);
    expect(Array.isArray(findings)).toBe(true);
  });

  it('reports missing tags', () => {
    const { fields, findings } = validateFrontmatter('/** @name Foo */\nvar x=1;');
    expect(fields.name).toBe('Foo');
    expect(findings.some((f) => f.field === 'version')).toBe(true);
    expect(findings.some((f) => f.field === 'author')).toBe(true);
  });

  it('reports when no frontmatter block exists', () => {
    const { findings } = validateFrontmatter('var x = 1;');
    expect(findings.some((f) => f.field === '*')).toBe(true);
  });

  it('flags non-semver version and non-ISO date', () => {
    const code = '/**\n * @name N\n * @author A\n * @version 1.2\n * @date June 2026\n * @ui DIALOG\n * @description D\n */';
    const { fields, findings } = validateFrontmatter(code);
    expect(fields.version).toBe('1.2');
    expect(findings.some((f) => f.field === 'version' && /semver/.test(f.message))).toBe(true);
    expect(findings.some((f) => f.field === 'date')).toBe(true);
  });

  it('never throws', () => {
    expect(() => validateFrontmatter(null)).not.toThrow();
  });
});

describe('scanIncludes', () => {
  it('detects //@include and blocks', () => {
    const { includes, blocked } = scanIncludes('//@include "lib/util.jsx"\nvar x=1;');
    expect(blocked).toBe(true);
    expect(includes[0].kind).toBe('@include');
    expect(includes[0].target).toBe('lib/util.jsx');
    expect(includes[0].line).toBe(1);
  });

  it('detects #include and $.evalFile', () => {
    const code = '#include "a.jsx"\n$.evalFile("b.jsx");';
    const { includes, blocked } = scanIncludes(code);
    expect(blocked).toBe(true);
    expect(includes.map((i) => i.kind)).toEqual(
      expect.arrayContaining(['#include', '$.evalFile'])
    );
  });

  it('returns blocked:false when no includes present', () => {
    const { includes, blocked } = scanIncludes('var x = 1;');
    expect(includes).toEqual([]);
    expect(blocked).toBe(false);
  });

  it('never throws', () => {
    expect(() => scanIncludes(null)).not.toThrow();
  });
});
