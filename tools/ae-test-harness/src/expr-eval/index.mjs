/**
 * src/expr-eval/index.mjs — AE expression evaluator (portable ESM).
 *
 * Runs identically in Node and the browser. NO Node-only APIs, NO `node:` imports,
 * NO runtime dependencies. The dashboard imports this module directly to drive
 * LIVE slider -> curve interactivity.
 *
 * Public surface:
 *   - evaluate(exprSource, ctx) -> value | { __exprError: string }
 *       Evaluate an After Effects expression string (JS-dialect) against an
 *       AE-like context. Builds the AE runtime surface (time, value, thisComp,
 *       thisLayer, thisProperty, effect(), and the AE global functions:
 *       linear/ease/easeIn/easeOut, clamp, wiggle (DETERMINISTIC seeded value
 *       noise), seedRandom/random, degreesToRadians/radiansToDegrees, length,
 *       lookAt, valueAtTime, velocityAtTime, ...). Errors are caught and returned
 *       as an `{ __exprError }` marker rather than thrown.
 *
 *   - sample(exprSource, baseCtx, plan) -> [{ x, y, dim }]
 *       Sweep one variable ('controlValue' | 'time') over [min,max] in `steps`
 *       points, returning output points. Multi-dimensional outputs (e.g. [x,y]
 *       position) collapse to a chosen component (default 0); the chosen
 *       dimension index is exposed on each point as `dim`.
 *
 * The shapes mirror the FROZEN capability contract (see CAPABILITY.md):
 * an expression's sim plan is `{ variable, range:[min,max], steps }`, and the
 * sample output feeds RenderArtifacts.expressionCurves[].samples (= {x,y}).
 */

// ---------------------------------------------------------------------------
// Error marker
// ---------------------------------------------------------------------------

/**
 * Whether a value is the evaluation error marker returned by `evaluate`.
 * @param {*} v
 * @returns {boolean}
 */
export function isExprError(v) {
  return v !== null && typeof v === 'object' && typeof v.__exprError === 'string';
}

function exprError(message) {
  return { __exprError: String(message) };
}

// ---------------------------------------------------------------------------
// Deterministic seeded noise (NO Math.random)
// ---------------------------------------------------------------------------
//
// AE's wiggle()/random() are deterministic per layer/seed within a render.
// We must NOT use the nondeterministic JS RNG. Everything below derives purely
// from numeric seeds, so the same inputs always yield the same outputs in both
// Node and the browser.

/**
 * Mix a 32-bit integer hash (deterministic, no float drift across engines).
 * @param {number} n
 * @returns {number} unsigned 32-bit integer
 */
function hash32(n) {
  // Force to uint32, then run an integer avalanche (variant of MurmurHash3 finalizer).
  let h = n >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Hash two integers into one (order-sensitive), deterministically.
 * @param {number} a
 * @param {number} b
 * @returns {number} unsigned 32-bit integer
 */
function hash2(a, b) {
  return hash32((hash32(a) ^ Math.imul(b >>> 0, 0x9e3779b1)) >>> 0);
}

/**
 * Deterministic float in [0,1) from a 32-bit integer seed.
 * @param {number} n
 * @returns {number}
 */
function unitFromInt(n) {
  return (hash32(n) >>> 8) / 0x01000000; // 24 bits of mantissa
}

/**
 * Deterministic float in [0,1) from two integer seeds.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function unitFromInt2(a, b) {
  return (hash2(a, b) >>> 8) / 0x01000000;
}

/** Smoothstep interpolation weight. */
function smooth(t) {
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic 1-D value noise sampled at coordinate `x` for a given `seed`.
 * Hashes the integer lattice points and smoothly interpolates -> continuous in
 * [0,1). This is the deterministic substitute for AE's internal wiggle noise.
 * @param {number} x
 * @param {number} seed
 * @returns {number} value in [0,1)
 */
function valueNoise1D(x, seed) {
  const xi = Math.floor(x);
  const xf = x - xi;
  const a = unitFromInt2(seed, xi);
  const b = unitFromInt2(seed, xi + 1);
  return a + (b - a) * smooth(xf);
}

/**
 * Fractal (multi-octave) deterministic noise centered at 0, range ~[-1, 1].
 * @param {number} x
 * @param {number} seed
 * @param {number} octaves
 * @returns {number}
 */
function fractalNoise(x, seed, octaves) {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let norm = 0;
  const oct = Math.max(1, Math.floor(octaves));
  for (let i = 0; i < oct; i++) {
    sum += (valueNoise1D(x * freq, (seed + i * 1013) | 0) * 2 - 1) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return norm > 0 ? sum / norm : 0;
}

// ---------------------------------------------------------------------------
// Vector helpers (AE expressions operate on numbers OR number arrays)
// ---------------------------------------------------------------------------

const isArr = Array.isArray;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Coerce to array form for element-wise ops. */
function toVec(v) {
  return isArr(v) ? v : [v];
}

/** Apply a binary op element-wise, broadcasting scalars across vectors. */
function vecBinary(a, b, op) {
  const av = isArr(a) ? a : null;
  const bv = isArr(b) ? b : null;
  if (av && bv) {
    const n = Math.max(av.length, bv.length);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = op(av[i] ?? 0, bv[i] ?? 0);
    return out;
  }
  if (av) return av.map((x) => op(x, b));
  if (bv) return bv.map((x) => op(a, x));
  return op(a, b);
}

/** Euclidean length / distance — AE `length(vec)` or `length(p1, p2)`. */
function aeLength(a, b) {
  if (b === undefined) {
    const v = toVec(a);
    let s = 0;
    for (const x of v) s += x * x;
    return Math.sqrt(s);
  }
  const va = toVec(a);
  const vb = toVec(b);
  const n = Math.max(va.length, vb.length);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = (va[i] ?? 0) - (vb[i] ?? 0);
    s += d * d;
  }
  return Math.sqrt(s);
}

// ---------------------------------------------------------------------------
// AE interpolation primitives
// ---------------------------------------------------------------------------

/**
 * AE `linear()` — two forms:
 *   linear(t, value1, value2)
 *   linear(t, tMin, tMax, value1, value2)
 * Clamps to the endpoints outside [tMin, tMax]. value1/value2 may be vectors.
 */
function ae_linear(...args) {
  let t, tMin, tMax, v1, v2;
  if (args.length === 3) {
    t = args[0];
    tMin = 0;
    tMax = 1;
    v1 = args[1];
    v2 = args[2];
  } else {
    t = args[0];
    tMin = args[1];
    tMax = args[2];
    v1 = args[3];
    v2 = args[4];
  }
  let f;
  if (tMax === tMin) {
    f = t <= tMin ? 0 : 1;
  } else {
    f = (t - tMin) / (tMax - tMin);
    if (f < 0) f = 0;
    else if (f > 1) f = 1;
  }
  return vecBinary(v1, v2, (a, b) => a + (b - a) * f);
}

/** Hermite-style ease curve weight on a clamped [0,1] fraction. */
function easeWeight(f, mode) {
  if (f <= 0) return 0;
  if (f >= 1) return 1;
  // AE ease() ~ smooth in/out; easeIn/easeOut bias one side. We approximate with
  // the standard cubic Hermite family which matches AE's qualitative shape.
  if (mode === 'in') {
    // slow start, linear-ish end
    return f * f;
  }
  if (mode === 'out') {
    // fast start, slow end
    return 1 - (1 - f) * (1 - f);
  }
  // both
  return f * f * (3 - 2 * f);
}

function makeEase(mode) {
  return function (...args) {
    let t, tMin, tMax, v1, v2;
    if (args.length === 3) {
      t = args[0];
      tMin = 0;
      tMax = 1;
      v1 = args[1];
      v2 = args[2];
    } else {
      t = args[0];
      tMin = args[1];
      tMax = args[2];
      v1 = args[3];
      v2 = args[4];
    }
    let f;
    if (tMax === tMin) {
      f = t <= tMin ? 0 : 1;
    } else {
      f = (t - tMin) / (tMax - tMin);
      if (f < 0) f = 0;
      else if (f > 1) f = 1;
    }
    const w = easeWeight(f, mode);
    return vecBinary(v1, v2, (a, b) => a + (b - a) * w);
  };
}

/** AE `clamp(value, min, max)` — element-wise for vectors. */
function ae_clamp(value, min, max) {
  const clampScalar = (x) => {
    if (x < min) return min;
    if (x > max) return max;
    return x;
  };
  if (isArr(value)) return value.map(clampScalar);
  return clampScalar(value);
}

// ---------------------------------------------------------------------------
// Context normalization + AE runtime surface
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} EvalCtx
 * AE-like evaluation context. Every field is optional; sensible defaults apply.
 * @property {number} [time]            Current comp time (seconds).
 * @property {*} [value]                The property's pre-expression value.
 * @property {number} [seed]            Deterministic seed for wiggle/random.
 * @property {Object} [thisComp]        { width, height, duration, frameDuration, layer(name) }.
 * @property {Object} [thisLayer]       Layer surface (index, name, transform...).
 * @property {Object} [thisProperty]    The property surface (numKeys, valueAtTime...).
 * @property {Object<string,Object>} [effects]  Map of effect name -> { param: value } used by effect().
 * @property {function} [effect]        Custom effect(name) resolver (overrides `effects`).
 * @property {function} [valueAtTime]   Custom property valueAtTime(t).
 * @property {Object} [globals]         Extra globals injected verbatim.
 */

/** Default comp surface. */
function defaultComp(ctx) {
  return {
    width: 1920,
    height: 1080,
    duration: 10,
    frameRate: 24,
    frameDuration: 1 / 24,
    displayStartTime: 0,
    pixelAspect: 1,
    name: 'Comp 1',
    numLayers: 1,
    layer(_name) {
      return ctx.thisLayer;
    }
  };
}

/**
 * Build an effect() resolver that returns an object whose `(param)` call and
 * indexed access both yield the bound parameter value. AE allows:
 *   effect("Slider Control")("Slider")
 *   effect("Slider Control")(1)
 * We support a flexible effects map: { "Slider Control": { Slider: 50 } } or
 * { "Slider Control": 50 } (single-param shorthand).
 */
function makeEffectResolver(effects) {
  const map = effects && typeof effects === 'object' ? effects : {};
  return function effect(name) {
    const entry = map[name];
    // A callable proxy: effect("X")("param") OR effect("X")(index)
    const accessor = function (param) {
      let val;
      if (entry && typeof entry === 'object' && !isArr(entry)) {
        if (param in entry) val = entry[param];
        else {
          // index form or single-param shorthand: take first own value
          const keys = Object.keys(entry);
          if (typeof param === 'number' && keys[param - 1] !== undefined) {
            val = entry[keys[param - 1]];
          } else if (keys.length === 1) {
            val = entry[keys[0]];
          } else {
            val = undefined;
          }
        }
      } else {
        // shorthand: entry is the value itself
        val = entry;
      }
      // Return a property-like object exposing .value (AE: effect(...)(...) .value)
      return wrapPropertyValue(val);
    };
    // Allow `.value`-less direct numeric coercion too.
    accessor.numProperties = entry && typeof entry === 'object' ? Object.keys(entry).length : 1;
    return accessor;
  };
}

/**
 * Wrap a raw value as a minimal property-like object: it both *is* the value
 * (via valueOf for numeric contexts) and exposes `.value`, `.valueAtTime()`.
 */
function wrapPropertyValue(val) {
  // For arrays/objects we can't override valueOf usefully for arithmetic, so we
  // return an object with .value plus passthrough. Most AE scripts read .value
  // or use the result directly in arithmetic for scalars.
  if (isNum(val)) {
    // Number objects let `effect(...)("Slider") * 2` work via valueOf.
    const obj = Object.create(Number.prototype);
    // Can't subclass Number cheaply; use a plain object with valueOf instead.
    const wrapper = {
      value: val,
      valueAtTime: () => val,
      valueOf: () => val
    };
    return wrapper;
  }
  return {
    value: val,
    valueAtTime: () => val,
    valueOf: () => (isArr(val) ? val : val)
  };
}

/**
 * Normalize a user-supplied context into a complete EvalCtx with defaults.
 * @param {EvalCtx} ctx
 * @returns {EvalCtx}
 */
export function normalizeCtx(ctx) {
  const c = ctx && typeof ctx === 'object' ? { ...ctx } : {};
  if (!isNum(c.time)) c.time = 0;
  if (c.value === undefined) c.value = 0;
  if (!isNum(c.seed)) c.seed = 0;
  return c;
}

/**
 * Build the AE global runtime surface for an expression, bound to `ctx`.
 * Returns an object whose keys are injected as locals into the evaluated fn.
 * @param {EvalCtx} ctx
 * @returns {Object<string, *>}
 */
export function buildRuntime(ctx) {
  const c = normalizeCtx(ctx);

  // Deterministic seeded random state. seedRandom(seed, timeless) reseeds.
  const seedState = { base: (c.seed | 0) >>> 0, counter: 0, timeless: false };

  const seedRandom = (seed, timeless) => {
    seedState.base = (Number(seed) | 0) >>> 0;
    seedState.counter = 0;
    seedState.timeless = !!timeless;
  };

  // random()/random(max)/random(min,max)/random(arrayMax)/random(arrMin,arrMax)
  const nextUnit = () => {
    // Mix base seed, a per-call counter, and (unless timeless) the frame index.
    const frame = seedState.timeless ? 0 : Math.round(c.time / (c.thisComp?.frameDuration || 1 / 24));
    const u = unitFromInt2(
      hash2(seedState.base, frame),
      seedState.counter++
    );
    return u;
  };
  function random(a, b) {
    if (a === undefined) return nextUnit();
    if (b === undefined) {
      if (isArr(a)) return a.map((mx) => nextUnit() * mx);
      return nextUnit() * a;
    }
    if (isArr(a) || isArr(b)) {
      const va = toVec(a);
      const vb = toVec(b);
      const n = Math.max(va.length, vb.length);
      const out = new Array(n);
      for (let i = 0; i < n; i++) {
        const lo = va[i] ?? 0;
        const hi = vb[i] ?? 0;
        out[i] = lo + nextUnit() * (hi - lo);
      }
      return out;
    }
    return a + nextUnit() * (b - a);
  }
  // gaussRandom — deterministic approximation via summed uniforms (CLT).
  function gaussRandom(a, b) {
    const g = () => {
      let s = 0;
      for (let i = 0; i < 6; i++) s += nextUnit();
      return (s - 3) / 1.732; // ~N(0,1)
    };
    if (a === undefined) return g() * 0.5 + 0.5;
    if (b === undefined) return (g() * 0.5 + 0.5) * a;
    const mid = (a + b) / 2;
    const half = (b - a) / 2;
    return mid + g() * half;
  }

  /**
   * Deterministic seeded value-noise wiggle.
   * wiggle(freq, amp, octaves?, ampMult?, t?) -> value (scalar or vector).
   * Replaces AE's stochastic wiggle with reproducible fractal value noise driven
   * by (seed, channel, time*freq). NEVER uses Math.random.
   */
  function wiggle(freq, amp, octaves = 1, ampMult = 0.5, t = c.time) {
    const baseVal = c.value;
    const dims = isArr(baseVal) ? baseVal.length : 1;
    const seed = (c.seed | 0) >>> 0;
    const sampleChannel = (ch) => {
      // Per-channel phase so x/y/z wiggle independently but deterministically.
      const chSeed = hash2(seed, ch + 1) >>> 0;
      // Drive noise coordinate by time * freq. octaves/ampMult shape the fractal.
      let sum = 0;
      let a = 1;
      let f = freq;
      let norm = 0;
      const oct = Math.max(1, Math.floor(octaves));
      for (let i = 0; i < oct; i++) {
        const n = valueNoise1D(t * f, (chSeed + i * 7919) | 0) * 2 - 1;
        sum += n * a;
        norm += a;
        a *= ampMult;
        f *= 2;
      }
      const offset = norm > 0 ? (sum / norm) * amp : 0;
      return offset;
    };
    if (dims === 1) {
      const base = isNum(baseVal) ? baseVal : 0;
      return base + sampleChannel(0);
    }
    const out = new Array(dims);
    for (let i = 0; i < dims; i++) out[i] = (baseVal[i] ?? 0) + sampleChannel(i);
    return out;
  }

  // temporalWiggle is similar; alias with same deterministic engine.
  const temporalWiggle = (freq, amp, octaves = 1, ampMult = 0.5, t = c.time) =>
    wiggle(freq, amp, octaves, ampMult, t);

  // noise() — AE noise(valOrArray) -> value in [-1,1], deterministic.
  function noise(v) {
    if (isArr(v)) {
      // Combine coords into one deterministic stream.
      let acc = (c.seed | 0) >>> 0;
      for (let i = 0; i < v.length; i++) {
        acc = hash2(acc, Math.round(v[i] * 1000)) >>> 0;
      }
      return unitFromInt(acc) * 2 - 1;
    }
    return fractalNoise(v, (c.seed | 0) >>> 0, 1);
  }

  // valueAtTime / velocityAtTime — operate on thisProperty if provided.
  const propValueAtTime = (t) => {
    if (typeof c.valueAtTime === 'function') return c.valueAtTime(t);
    if (c.thisProperty && typeof c.thisProperty.valueAtTime === 'function') {
      return c.thisProperty.valueAtTime(t);
    }
    return c.value;
  };
  const velocityAtTime = (t) => {
    const dt = (c.thisComp && c.thisComp.frameDuration) || 1 / 24;
    const a = propValueAtTime(t - dt / 2);
    const b = propValueAtTime(t + dt / 2);
    return vecBinary(b, a, (x, y) => (x - y) / dt);
  };
  const speedAtTime = (t) => {
    const v = velocityAtTime(t);
    return isArr(v) ? aeLength(v) : Math.abs(v);
  };

  // lookAt(fromPoint, atPoint) -> [x,y,z] orientation (AE 3D helper).
  function lookAt(from, at) {
    const f = toVec(from);
    const a = toVec(at);
    const dx = (a[0] ?? 0) - (f[0] ?? 0);
    const dy = (a[1] ?? 0) - (f[1] ?? 0);
    const dz = (a[2] ?? 0) - (f[2] ?? 0);
    const yaw = radiansToDegrees(Math.atan2(dx, dz));
    const pitch = radiansToDegrees(Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)));
    return [pitch, yaw, 0];
  }

  function degreesToRadians(d) {
    return (d * Math.PI) / 180;
  }
  function radiansToDegrees(r) {
    return (r * 180) / Math.PI;
  }

  // dot / cross / normalize / add / sub / mul / div — AE vector math globals.
  const dot = (a, b) => {
    const va = toVec(a);
    const vb = toVec(b);
    let s = 0;
    for (let i = 0; i < Math.max(va.length, vb.length); i++) s += (va[i] ?? 0) * (vb[i] ?? 0);
    return s;
  };
  const cross = (a, b) => {
    const va = toVec(a);
    const vb = toVec(b);
    return [
      (va[1] ?? 0) * (vb[2] ?? 0) - (va[2] ?? 0) * (vb[1] ?? 0),
      (va[2] ?? 0) * (vb[0] ?? 0) - (va[0] ?? 0) * (vb[2] ?? 0),
      (va[0] ?? 0) * (vb[1] ?? 0) - (va[1] ?? 0) * (vb[0] ?? 0)
    ];
  };
  const normalize = (a) => {
    const len = aeLength(a);
    if (len === 0) return toVec(a).map(() => 0);
    return toVec(a).map((x) => x / len);
  };
  const add = (a, b) => vecBinary(a, b, (x, y) => x + y);
  const sub = (a, b) => vecBinary(a, b, (x, y) => x - y);
  const mul = (a, b) => vecBinary(a, b, (x, y) => x * y);
  const div = (a, b) => vecBinary(a, b, (x, y) => x / y);

  // thisComp / thisLayer / thisProperty surfaces (filled with defaults).
  const thisComp = c.thisComp || defaultComp(c);
  if (typeof thisComp.layer !== 'function') {
    thisComp.layer = (_n) => c.thisLayer;
  }
  if (!isNum(thisComp.frameDuration)) {
    thisComp.frameDuration = 1 / (thisComp.frameRate || 24);
  }

  const thisProperty = c.thisProperty || {
    value: c.value,
    numKeys: 0,
    valueAtTime: propValueAtTime,
    velocityAtTime,
    speedAtTime
  };
  if (typeof thisProperty.valueAtTime !== 'function') thisProperty.valueAtTime = propValueAtTime;
  if (typeof thisProperty.velocityAtTime !== 'function') thisProperty.velocityAtTime = velocityAtTime;

  const thisLayer = c.thisLayer || {
    index: 1,
    name: 'Layer 1',
    startTime: 0,
    inPoint: 0,
    outPoint: thisComp.duration,
    hasParent: false,
    width: thisComp.width,
    height: thisComp.height,
    effect: makeEffectResolver(c.effects),
    transform: {},
    toComp: (p) => p,
    fromComp: (p) => p,
    sourceRectAtTime: () => ({ top: 0, left: 0, width: 0, height: 0 })
  };
  // Always provide effect() on the layer too.
  const effectResolver = typeof c.effect === 'function' ? c.effect : makeEffectResolver(c.effects);
  if (typeof thisLayer.effect !== 'function') thisLayer.effect = effectResolver;

  const runtime = {
    // Core variables
    time: c.time,
    value: c.value,
    thisComp,
    thisLayer,
    thisProperty,
    thisProject: c.thisProject || { name: 'Project' },
    comp: (name) => (typeof c.comp === 'function' ? c.comp(name) : thisComp),
    footage: (name) => (typeof c.footage === 'function' ? c.footage(name) : null),

    // effect() at top level (AE binds layer's effect into scope)
    effect: effectResolver,

    // Interpolation
    linear: ae_linear,
    ease: makeEase('both'),
    easeIn: makeEase('in'),
    easeOut: makeEase('out'),
    clamp: ae_clamp,

    // Randomness / noise (deterministic)
    wiggle,
    temporalWiggle,
    smartWiggle: wiggle,
    seedRandom,
    random,
    gaussRandom,
    noise,

    // Vector / math
    length: aeLength,
    lookAt,
    dot,
    cross,
    normalize,
    add,
    sub,
    mul,
    div,
    degreesToRadians,
    radiansToDegrees,
    radians: degreesToRadians,
    degrees: radiansToDegrees,

    // Property time sampling
    valueAtTime: propValueAtTime,
    velocityAtTime,
    speedAtTime,

    // Common AE helpers used inside expressions
    timeToFrames: (t = c.time, fps = thisComp.frameRate || 24, isDuration = false) =>
      Math[isDuration ? 'floor' : 'round'](t * fps),
    framesToTime: (frames, fps = thisComp.frameRate || 24) => frames / fps,
    posterizeTime: () => c.time,
    clampDummy: undefined
  };

  // Merge any explicit globals overrides last (caller wins).
  if (c.globals && typeof c.globals === 'object') {
    Object.assign(runtime, c.globals);
  }
  delete runtime.clampDummy;
  return runtime;
}

// ---------------------------------------------------------------------------
// evaluate
// ---------------------------------------------------------------------------

/**
 * Evaluate an After Effects expression string against an AE-like context.
 *
 * The expression is run inside a `new Function` whose parameters are the AE
 * runtime globals (so `time`, `value`, `wiggle`, `linear`, ... resolve as bare
 * identifiers). Execution is wrapped in try/catch; on any error (parse or
 * runtime) it returns an `{ __exprError }` marker instead of throwing.
 *
 * AE expressions are an *expression-or-statement-list* dialect: the value of
 * the last statement is the result. We emulate this by transforming the source
 * so the final expression is returned, falling back to evaluating the whole
 * body when that transform is not applicable.
 *
 * @param {string} exprSource
 * @param {EvalCtx} ctx
 * @returns {*} the evaluated value, or { __exprError: string }
 */
export function evaluate(exprSource, ctx) {
  if (typeof exprSource !== 'string') {
    return exprError('expression must be a string');
  }
  const src = exprSource.trim();
  if (src.length === 0) return exprError('empty expression');

  const runtime = buildRuntime(ctx);
  const names = Object.keys(runtime);
  const values = names.map((n) => runtime[n]);

  // AE returns the value of the LAST statement. Build a body that captures it.
  // Strategy: try to `return (<source>)` as a single expression first (covers
  // the overwhelmingly common single-expression case like `wiggle(2,30)` or
  // `linear(...)`). If that fails to compile, fall back to executing the body
  // and returning the value of the final non-empty, non-control statement by
  // assigning it to a sentinel.
  let fn;
  let mode = 'expr';
  try {
    // eslint-disable-next-line no-new-func
    fn = new Function(...names, `"use strict";\nreturn (\n${src}\n);`);
  } catch {
    mode = 'body';
  }

  if (mode === 'body') {
    const wrapped = buildLastStatementBody(src);
    try {
      // eslint-disable-next-line no-new-func
      fn = new Function(...names, `"use strict";\n${wrapped}`);
    } catch (err) {
      return exprError(err && err.message ? String(err.message) : String(err));
    }
  }

  try {
    let out = fn(...values);
    // Unwrap property-like wrappers (e.g. effect(...)(...) results).
    out = unwrapResult(out);
    if (out === undefined) return exprError('expression produced no value');
    if (typeof out === 'number' && !Number.isFinite(out)) {
      return exprError('expression produced a non-finite number');
    }
    return out;
  } catch (err) {
    return exprError(err && err.message ? String(err.message) : String(err));
  }
}

/** Unwrap a property-like wrapper to its underlying value. */
function unwrapResult(out) {
  if (out !== null && typeof out === 'object' && !isArr(out) && 'value' in out && typeof out.valueOf === 'function') {
    const vo = out.valueOf();
    // valueOf may return the same object for non-numeric wrappers; prefer .value.
    if (vo === out) return out.value;
    return vo;
  }
  return out;
}

/**
 * Wrap a multi-statement AE expression body so the value of the final
 * expression-statement is returned. We append a capture of the last statement.
 *
 * This is a pragmatic transform: it appends `return value;` if the body already
 * sets `value`-style results, otherwise tries to capture the last line. AE
 * scripts in this catalog overwhelmingly end with a bare expression (e.g. the
 * last line is `result;` or `value;`), so we wrap that final line in a return.
 *
 * @param {string} src
 * @returns {string}
 */
function buildLastStatementBody(src) {
  // Find the last top-level statement by splitting on semicolons/newlines is
  // unsafe in general, so we use a heuristic: try returning the source as-is
  // first inside a function; if the final token looks like a bare expression,
  // prefix it with `return`. We attempt progressively.
  //
  // Heuristic: locate the last non-empty line; if it does not start with a
  // control keyword and is not a block close, wrap it with `return`.
  // Split the source into top-level statements on `;` and newlines, ignoring
  // separators inside (), [], {}, strings, template literals and comments. The
  // final non-empty statement that is a bare expression gets a `return`.
  const stmts = splitTopLevelStatements(src);
  for (let i = stmts.length - 1; i >= 0; i--) {
    const trimmed = stmts[i].trim();
    if (trimmed === '') continue;
    if (/^(if|for|while|switch|function|var|let|const|return|else|try|catch|finally|do|throw)\b/.test(trimmed)) {
      // Final meaningful statement is a control/declaration we cannot return.
      // Re-join everything and let it run (result will be undefined => marker).
      return stmts.join(';\n');
    }
    // Re-assemble: all prior statements, then `return (<last>)`.
    const head = stmts.slice(0, i).filter((s) => s.trim() !== '');
    const body = head.length ? head.join(';\n') + ';\n' : '';
    return `${body}return (${trimmed});`;
  }
  return src;
}

/**
 * Split a source string into top-level statements, respecting nesting depth,
 * string/template literals, and line/block comments. Statement separators are
 * top-level `;` only (newlines are preserved inside statements).
 * @param {string} src
 * @returns {string[]}
 */
function splitTopLevelStatements(src) {
  const out = [];
  let depth = 0;
  let buf = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    const two = src.slice(i, i + 2);
    // Comments
    if (two === '//') {
      const nl = src.indexOf('\n', i);
      const end = nl === -1 ? n : nl;
      buf += src.slice(i, end);
      i = end;
      continue;
    }
    if (two === '/*') {
      const close = src.indexOf('*/', i + 2);
      const end = close === -1 ? n : close + 2;
      buf += src.slice(i, end);
      i = end;
      continue;
    }
    // String / template literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      let j = i + 1;
      buf += ch;
      while (j < n) {
        const cj = src[j];
        buf += cj;
        if (cj === '\\') {
          if (j + 1 < n) {
            buf += src[j + 1];
            j += 2;
            continue;
          }
        }
        if (cj === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      i = j;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);

    if (ch === ';' && depth === 0) {
      out.push(buf);
      buf = '';
      i += 1;
      continue;
    }
    buf += ch;
    i += 1;
  }
  if (buf.trim() !== '') out.push(buf);
  return out;
}

// ---------------------------------------------------------------------------
// sample
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SamplePlan
 * @property {'controlValue'|'time'} variable  Independent variable to sweep.
 * @property {[number, number]} range          [min, max] inclusive sweep bounds.
 * @property {number} steps                     Number of points (>= 2).
 * @property {number} [component]               Which output dimension to plot
 *                                              when the result is a vector
 *                                              (default 0).
 * @property {string} [bindControl]             Effect name to set when
 *                                              variable === 'controlValue'.
 * @property {string} [bindParam]               Effect param to set (default:
 *                                              first/only param of the effect).
 */

/**
 * Sweep one variable and return the evaluated output points.
 *
 * For `variable === 'time'`: sets `ctx.time` to each swept value.
 * For `variable === 'controlValue'`: sets the bound effect slider value before
 * each eval. The binding is resolved from `plan.bindControl` / `plan.bindParam`;
 * if omitted, the FIRST effect in `baseCtx.effects` and its first param are
 * used. The slider value is written into a per-step copy of `effects` so the
 * base context is never mutated.
 *
 * Multi-dimensional outputs collapse to `plan.component` (default 0); the chosen
 * dimension index is returned on each point as `dim`. Error markers become
 * `null` y-values (point is still emitted with the same x and `error` flag).
 *
 * @param {string} exprSource
 * @param {EvalCtx} baseCtx
 * @param {SamplePlan} plan
 * @returns {Array<{ x:number, y:(number|null), dim:number, error?:string }>}
 */
export function sample(exprSource, baseCtx, plan) {
  const out = [];
  if (!plan || typeof plan !== 'object') return out;

  const variable = plan.variable === 'time' ? 'time' : 'controlValue';
  const range = isArr(plan.range) && plan.range.length === 2 ? plan.range : [0, 1];
  let steps = Number(plan.steps);
  if (!Number.isFinite(steps) || steps < 2) steps = 2;
  steps = Math.floor(steps);
  const component = Number.isInteger(plan.component) && plan.component >= 0 ? plan.component : 0;

  const [min, max] = range;
  const span = max - min;

  // Resolve the controlValue binding once.
  let bindControl = plan.bindControl;
  let bindParam = plan.bindParam;
  if (variable === 'controlValue') {
    const effects = (baseCtx && baseCtx.effects) || {};
    if (bindControl === undefined) {
      bindControl = Object.keys(effects)[0];
    }
    if (bindControl !== undefined && bindParam === undefined) {
      const entry = effects[bindControl];
      if (entry && typeof entry === 'object' && !isArr(entry)) {
        bindParam = Object.keys(entry)[0];
      }
    }
  }

  for (let i = 0; i < steps; i++) {
    const x = steps === 1 ? min : min + (span * i) / (steps - 1);
    // Build a per-step context (never mutate baseCtx).
    const ctx = { ...(baseCtx && typeof baseCtx === 'object' ? baseCtx : {}) };

    if (variable === 'time') {
      ctx.time = x;
    } else {
      // controlValue: write x into the bound effect param.
      const srcEffects = (baseCtx && baseCtx.effects) || {};
      const effects = {};
      for (const k of Object.keys(srcEffects)) {
        const v = srcEffects[k];
        effects[k] = v && typeof v === 'object' && !isArr(v) ? { ...v } : v;
      }
      if (bindControl !== undefined) {
        const entry = effects[bindControl];
        if (entry && typeof entry === 'object' && !isArr(entry)) {
          const param = bindParam !== undefined ? bindParam : Object.keys(entry)[0] || 'value';
          entry[param] = x;
        } else {
          // shorthand effect (value directly) — replace with x.
          effects[bindControl] = x;
        }
      } else {
        // No effect at all: expose x as a synthetic "controlValue" effect AND as a global.
        effects['__control'] = { value: x };
        ctx.globals = { ...(ctx.globals || {}), controlValue: x };
      }
      ctx.effects = effects;
    }

    const result = evaluate(exprSource, ctx);

    if (isExprError(result)) {
      out.push({ x, y: null, dim: component, error: result.__exprError });
      continue;
    }

    let y;
    let dim = component;
    if (isArr(result)) {
      dim = component < result.length ? component : 0;
      y = result[dim];
    } else {
      dim = 0;
      y = result;
    }
    if (!isNum(y)) {
      out.push({ x, y: null, dim, error: 'non-numeric output' });
    } else {
      out.push({ x, y, dim });
    }
  }

  return out;
}

/**
 * Convenience: strip a sample sweep down to the frozen {x,y} curve-sample shape
 * used by RenderArtifacts.expressionCurves[].samples. Points with a null y are
 * dropped (they cannot be plotted).
 * @param {Array<{x:number,y:(number|null)}>} points
 * @returns {Array<{x:number,y:number}>}
 */
export function toCurveSamples(points) {
  const out = [];
  if (!isArr(points)) return out;
  for (const p of points) {
    if (p && isNum(p.x) && isNum(p.y)) out.push({ x: p.x, y: p.y });
  }
  return out;
}

export default { evaluate, sample, toCurveSamples, isExprError, buildRuntime, normalizeCtx };
