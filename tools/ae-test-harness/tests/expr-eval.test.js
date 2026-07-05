/**
 * Tests for src/expr-eval/index.mjs — the portable AE expression evaluator.
 *
 * Covers:
 *   - linear / ease / clamp correctness
 *   - wiggle + random DETERMINISM (same seed/time -> same output, in-process)
 *   - a slider-driven sample sweep (variable: 'controlValue')
 *   - a time-driven sample sweep (variable: 'time')
 *   - multi-dimensional output component selection
 *   - error handling (never throws; returns error markers)
 */

import { describe, it, expect } from 'vitest';
import {
  evaluate,
  sample,
  toCurveSamples,
  isExprError,
  buildRuntime
} from '../src/expr-eval/index.mjs';

describe('evaluate — core AE globals', () => {
  it('exposes time and value as bare identifiers', () => {
    expect(evaluate('value + time', { value: 10, time: 2 })).toBe(12);
  });

  it('linear(t, tMin, tMax, v1, v2) interpolates and clamps at the ends', () => {
    expect(evaluate('linear(50, 0, 100, 0, 200)', {})).toBe(100);
    expect(evaluate('linear(-10, 0, 100, 0, 200)', {})).toBe(0); // clamp low
    expect(evaluate('linear(999, 0, 100, 0, 200)', {})).toBe(200); // clamp high
  });

  it('linear 3-arg form maps [0,1] -> [v1,v2]', () => {
    expect(evaluate('linear(0.25, 10, 50)', {})).toBe(20);
  });

  it('linear works on vector endpoints', () => {
    expect(evaluate('linear(0.5, [0,0], [100,200])', {})).toEqual([50, 100]);
  });

  it('clamp(value, min, max) clamps scalars and vectors', () => {
    expect(evaluate('clamp(150, 0, 100)', {})).toBe(100);
    expect(evaluate('clamp(-5, 0, 100)', {})).toBe(0);
    expect(evaluate('clamp([150, -5, 50], 0, 100)', {})).toEqual([100, 0, 50]);
  });

  it('ease/easeIn/easeOut land exactly on endpoints', () => {
    expect(evaluate('ease(0, 0, 1, 10, 20)', {})).toBe(10);
    expect(evaluate('ease(1, 0, 1, 10, 20)', {})).toBe(20);
    expect(evaluate('easeIn(0, 0, 1, 10, 20)', {})).toBe(10);
    expect(evaluate('easeOut(1, 0, 1, 10, 20)', {})).toBe(20);
  });

  it('ease(0.5) sits between the endpoints (eased, monotonic)', () => {
    const mid = evaluate('ease(0.5, 0, 1, 0, 100)', {});
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    expect(mid).toBeCloseTo(50, 5); // smoothstep is symmetric at 0.5
  });

  it('degreesToRadians / radiansToDegrees round-trip', () => {
    expect(evaluate('radiansToDegrees(degreesToRadians(90))', {})).toBeCloseTo(90, 9);
  });

  it('length() computes magnitude and distance', () => {
    expect(evaluate('length([3, 4])', {})).toBe(5);
    expect(evaluate('length([0,0], [3,4])', {})).toBe(5);
  });

  it('lookAt returns a 3-component orientation', () => {
    const r = evaluate('lookAt([0,0,0], [0,0,100])', {});
    expect(Array.isArray(r)).toBe(true);
    expect(r.length).toBe(3);
  });
});

describe('wiggle — deterministic seeded value noise', () => {
  it('is deterministic: same seed + time + value => identical output', () => {
    const ctx = { value: 100, time: 1.5, seed: 7 };
    const a = evaluate('wiggle(2, 30)', ctx);
    const b = evaluate('wiggle(2, 30)', ctx);
    expect(a).toBe(b);
  });

  it('does NOT use Math.random (stable across repeated independent calls)', () => {
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(evaluate('wiggle(3, 50)', { value: 0, time: 2.25, seed: 42 }));
    }
    expect(new Set(results).size).toBe(1);
  });

  it('different seeds produce different offsets', () => {
    const a = evaluate('wiggle(2, 30)', { value: 0, time: 1, seed: 1 });
    const b = evaluate('wiggle(2, 30)', { value: 0, time: 1, seed: 2 });
    expect(a).not.toBe(b);
  });

  it('wiggle stays within amp of the base value (1 octave)', () => {
    const base = 100;
    const amp = 30;
    for (let t = 0; t < 5; t += 0.13) {
      const v = evaluate('wiggle(2, 30)', { value: base, time: t, seed: 3 });
      expect(Math.abs(v - base)).toBeLessThanOrEqual(amp + 1e-9);
    }
  });

  it('wiggles vector values per-channel and preserves dimensionality', () => {
    const v = evaluate('wiggle(2, 10)', { value: [50, 60, 70], time: 1, seed: 5 });
    expect(Array.isArray(v)).toBe(true);
    expect(v.length).toBe(3);
  });
});

describe('random / seedRandom — deterministic', () => {
  it('seedRandom + random is reproducible for the same seed', () => {
    const a = evaluate('seedRandom(9, true); random()', { time: 0 });
    const b = evaluate('seedRandom(9, true); random()', { time: 0 });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });

  it('random(min, max) stays within range deterministically', () => {
    const v = evaluate('seedRandom(3, true); random(10, 20)', {});
    expect(v).toBeGreaterThanOrEqual(10);
    expect(v).toBeLessThanOrEqual(20);
    const v2 = evaluate('seedRandom(3, true); random(10, 20)', {});
    expect(v2).toBe(v);
  });
});

describe('effect() binding', () => {
  it('reads a bound slider value', () => {
    const ctx = { effects: { 'Slider Control': { Slider: 75 } } };
    expect(evaluate('effect("Slider Control")("Slider").value', ctx)).toBe(75);
  });

  it('slider value participates in arithmetic via valueOf', () => {
    const ctx = { effects: { 'Slider Control': { Slider: 4 } } };
    expect(evaluate('effect("Slider Control")("Slider") * 10', ctx)).toBe(40);
  });
});

describe('multi-statement expressions (last value wins)', () => {
  it('returns the value of the final expression statement', () => {
    const src = 'var amp = 50;\nvar f = 2;\nwiggle(f, amp);';
    const out = evaluate(src, { value: 0, time: 1, seed: 1 });
    expect(typeof out).toBe('number');
  });

  it('returns the last bare expression after declarations', () => {
    const src = 'var a = 3;\nvar b = 4;\na + b;';
    expect(evaluate(src, {})).toBe(7);
  });
});

describe('error handling — never throws', () => {
  it('returns an error marker for non-string input', () => {
    const r = evaluate(null, {});
    expect(isExprError(r)).toBe(true);
  });

  it('returns an error marker for malformed source', () => {
    const r = evaluate('this is ++ not valid (', {});
    expect(isExprError(r)).toBe(true);
    expect(typeof r.__exprError).toBe('string');
  });

  it('returns an error marker for a runtime reference error', () => {
    const r = evaluate('definitelyNotDefinedGlobal()', {});
    expect(isExprError(r)).toBe(true);
  });

  it('returns an error marker for non-finite numeric output', () => {
    const r = evaluate('1 / 0', {});
    expect(isExprError(r)).toBe(true);
  });

  it('never throws regardless of input', () => {
    expect(() => evaluate('}{', {})).not.toThrow();
    expect(() => evaluate('', {})).not.toThrow();
    expect(() => evaluate(undefined, undefined)).not.toThrow();
  });
});

describe('sample — slider-driven sweep (controlValue)', () => {
  it('sweeps a bound slider and maps it through a linear expression', () => {
    const baseCtx = {
      effects: { 'Slider Control': { Slider: 0 } }
    };
    // Output rotation = linear(slider, 0, 100, 0, 360)
    const expr = 'linear(effect("Slider Control")("Slider"), 0, 100, 0, 360)';
    const pts = sample(expr, baseCtx, {
      variable: 'controlValue',
      range: [0, 100],
      steps: 5,
      bindControl: 'Slider Control',
      bindParam: 'Slider'
    });
    expect(pts.length).toBe(5);
    expect(pts[0]).toMatchObject({ x: 0, y: 0 });
    expect(pts[4]).toMatchObject({ x: 100, y: 360 });
    // monotonic increasing
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].y).toBeGreaterThan(pts[i - 1].y);
    }
  });

  it('auto-resolves the binding from the first effect when not specified', () => {
    const baseCtx = { effects: { 'Slider Control': { Slider: 0 } } };
    const pts = sample('effect("Slider Control")("Slider") * 2', baseCtx, {
      variable: 'controlValue',
      range: [0, 10],
      steps: 3
    });
    expect(pts.map((p) => p.y)).toEqual([0, 10, 20]);
  });

  it('does not mutate the base context effects', () => {
    const baseCtx = { effects: { 'Slider Control': { Slider: 0 } } };
    sample('effect("Slider Control")("Slider")', baseCtx, {
      variable: 'controlValue',
      range: [0, 100],
      steps: 4
    });
    expect(baseCtx.effects['Slider Control'].Slider).toBe(0);
  });
});

describe('sample — time-driven sweep', () => {
  it('sweeps time and produces deterministic wiggle samples', () => {
    const expr = 'wiggle(2, 30)';
    const baseCtx = { value: 0, seed: 11 };
    const a = sample(expr, baseCtx, { variable: 'time', range: [0, 4], steps: 9 });
    const b = sample(expr, baseCtx, { variable: 'time', range: [0, 4], steps: 9 });
    expect(a.length).toBe(9);
    expect(a).toEqual(b); // determinism across whole sweep
    expect(a[0].x).toBe(0);
    expect(a[8].x).toBe(4);
  });
});

describe('sample — multi-dimensional output', () => {
  it('selects the chosen component and exposes its dim', () => {
    const expr = '[value + time, value - time]';
    const ctx = { value: 100 };
    const comp0 = sample(expr, ctx, { variable: 'time', range: [0, 2], steps: 3, component: 0 });
    const comp1 = sample(expr, ctx, { variable: 'time', range: [0, 2], steps: 3, component: 1 });
    expect(comp0.map((p) => p.y)).toEqual([100, 101, 102]);
    expect(comp0[0].dim).toBe(0);
    expect(comp1.map((p) => p.y)).toEqual([100, 99, 98]);
    expect(comp1[0].dim).toBe(1);
  });
});

describe('sample — error handling', () => {
  it('emits null y with an error flag for failing points, never throws', () => {
    const pts = sample('definitelyUndefined()', {}, {
      variable: 'time',
      range: [0, 1],
      steps: 2
    });
    expect(pts.length).toBe(2);
    expect(pts[0].y).toBe(null);
    expect(typeof pts[0].error).toBe('string');
  });

  it('toCurveSamples drops null-y points and yields {x,y} only', () => {
    const pts = [
      { x: 0, y: 1, dim: 0 },
      { x: 1, y: null, dim: 0, error: 'boom' },
      { x: 2, y: 3, dim: 0 }
    ];
    expect(toCurveSamples(pts)).toEqual([
      { x: 0, y: 1 },
      { x: 2, y: 3 }
    ]);
  });
});

describe('buildRuntime', () => {
  it('exposes the documented AE surface as bare identifiers', () => {
    const rt = buildRuntime({ time: 1, value: 5 });
    for (const name of [
      'time', 'value', 'thisComp', 'thisLayer', 'thisProperty', 'effect',
      'linear', 'ease', 'easeIn', 'easeOut', 'clamp', 'wiggle', 'random',
      'seedRandom', 'degreesToRadians', 'radiansToDegrees', 'length',
      'lookAt', 'valueAtTime', 'velocityAtTime'
    ]) {
      expect(name in rt, `runtime should expose ${name}`).toBe(true);
    }
  });
});
