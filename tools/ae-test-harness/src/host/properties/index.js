/**
 * host/properties — PropertyGroup / Property tree builder.
 *
 * Builds a recursive tree of Property and PropertyGroup objects from an array of
 * PropertyDef (see contracts host-snapshot schema). Mirrors the After Effects
 * scripting Property API surface used by scripts under test:
 *
 *   - .property(nameOrMatchNameOrIndex)  traversal (1-based index, AE-style)
 *   - .name, .matchName, .propertyValueType, .value
 *   - .numProperties, .numKeys
 *   - .setValue(v)             -> logs OPERATION_KINDS.setValue
 *   - .setValueAtTime(t, v)    -> logs setValueAtTime + addKeyframe
 *   - .expression = '...'      -> logs setExpression
 *   - .canSetExpression, .selected, .keyTime/.keyValue stubs
 *
 * Every mutation pushes an Operation onto ctx.log (the host __log).
 *
 * @typedef {import('../../contracts/index.js').PropertyDef} PropertyDef
 * @typedef {import('../../contracts/index.js').Operation} Operation
 * @typedef {import('../../contracts/index.js').Keyframe} Keyframe
 */

import { OPERATION_KINDS } from '../../contracts/index.js';

/**
 * PropertyValueType — exposed AE-style on the host. After Effects scripts read
 * `property.propertyValueType` as a NUMBER and compare it against either the
 * named enum members (`PropertyValueType.TwoD`) OR raw AE integer codes
 * (KeyBot: `=== 6416`). To satisfy both, the enum is NUMERIC (the real AE codes)
 * and carries every spelling scripts use (`TwoD`/`TWO_D`, `COLOR`/`Color`, etc.).
 * The fixtures/contracts keep STRING value types in the snapshot; the property
 * builder maps each string to its numeric code via `valueTypeCode()` so what a
 * script sees is the numeric code (consistent with the named enum members).
 */
export const PropertyValueType = Object.freeze({
  // Canonical AE integer codes.
  NO_VALUE: 6412,
  ThreeD_SPATIAL: 6413,
  ThreeD: 6414,
  TwoD_SPATIAL: 6415,
  TwoD: 6416,
  OneD: 6417,
  COLOR: 6418,
  CUSTOM_VALUE: 6419,
  MARKER: 6420,
  LAYER_INDEX: 6421,
  MASK_INDEX: 6422,
  SHAPE: 6423,
  TEXT_DOCUMENT: 6424,
  // Aliases for the snake/upper spellings some scripts (and the contract's
  // string vocabulary) use, all pointing at the same numeric codes.
  NoValue: 6412,
  ONE_D: 6417,
  TWO_D: 6416,
  THREE_D: 6414,
  Color: 6418,
  Shape: 6423,
  CustomValue: 6419
});

/**
 * Map a snapshot/contract string value type (e.g. 'TwoD', 'OneD', 'Shape') to
 * the numeric AE PropertyValueType code that scripts compare against. Falls back
 * to NO_VALUE for unknown/absent types. Accepts an already-numeric value
 * unchanged (so dynamic/media nodes can pass codes directly).
 * @param {string|number|undefined} t
 * @returns {number}
 */
export function valueTypeCode(t) {
  if (typeof t === 'number') return t;
  switch (t) {
    case 'OneD':
      return PropertyValueType.OneD;
    case 'TwoD':
      return PropertyValueType.TwoD;
    case 'ThreeD':
      return PropertyValueType.ThreeD;
    case 'Color':
      return PropertyValueType.COLOR;
    case 'Shape':
      return PropertyValueType.SHAPE;
    case 'CustomValue':
      return PropertyValueType.CUSTOM_VALUE;
    case 'NoValue':
    default:
      return PropertyValueType.NO_VALUE;
  }
}

function interpolationTypeCode(t) {
  if (typeof t === 'number') return t;
  switch (String(t || '').toUpperCase()) {
    case 'BEZIER':
      return 6613;
    case 'HOLD':
      return 6614;
    case 'LINEAR':
    default:
      return 6612;
  }
}

/** PropertyType-ish discriminator. */
export const PropertyType = Object.freeze({
  PROPERTY: 'Property',
  INDEXED_GROUP: 'IndexedGroup',
  NAMED_GROUP: 'NamedGroup'
});

function noop() {}

/**
 * Push an operation onto the shared log. Supports both ctx.log-as-array (the
 * historical contract) and ctx.pushOp(op) (host-level validated sink). Both
 * point at the same underlying __log when wired by the integrator.
 */
function safeLog(ctx, op) {
  if (ctx && Array.isArray(ctx.log)) {
    ctx.log.push(op);
    return;
  }
  if (ctx && typeof ctx.pushOp === 'function') {
    ctx.pushOp(op);
  }
}

/**
 * Record the side-effect of renaming a dynamically-added control property. AE
 * effect-rig scripts add a control (Slider/Dropdown/Color) to a layer's Effects
 * parade and then assign `.name`. The harness has no dedicated "rename" op, so it
 * surfaces the assignment as a `setValue` targeting `<parent path>/<new name>` —
 * exactly the shape the effect-rig fixtures (Sync-o-tron, sfxMaster) assert.
 * @param {object} ctx
 * @param {object|null} parent owning group (its path prefixes the new name)
 * @param {string} newName
 */
function logNameAssignment(ctx, parent, newName) {
  const parentPath = (parent && parent.path) || '';
  const target = parentPath ? `${parentPath}/${newName}` : newName;
  safeLog(ctx, { kind: 'setValue', target, value: newName, meta: { rename: true } });
}

function joinPath(prefix, name) {
  if (!prefix) return name;
  if (!name) return prefix;
  return `${prefix}/${name}`;
}

/** A PropertyDef is a group when it carries child `properties`. */
function isGroupDef(def) {
  return Array.isArray(def && def.properties) && def.properties.length >= 0 &&
    'properties' in (def || {});
}

/** Shallow clone of an array/object value (for stable op payloads). */
function cloneValue(v) {
  if (Array.isArray(v)) return v.map((x) => (Array.isArray(x) ? x.slice() : x));
  return v;
}

/**
 * Provide a sane default value for a property whose def omits `value`, keyed off
 * its declared propertyValueType so scripts that read `.value.length` or do
 * arithmetic never see `undefined`.
 * @param {object} def
 */
function defaultValueFor(def) {
  const t = def && def.propertyValueType;
  switch (t) {
    case 'TwoD':
      return [0, 0];
    case 'ThreeD':
      return [0, 0, 0];
    case 'Color':
      return [0, 0, 0, 1];
    case 'OneD':
      return 0;
    case 'Shape':
      return { vertices: [], inTangents: [], outTangents: [], closed: true };
    case 'NoValue':
    case 'CustomValue':
      return undefined;
    default:
      return 0;
  }
}

/**
 * Whether a property name/matchName denotes a recognized AE structural node
 * that the harness should materialize on-demand even when not seeded by a
 * fixture. Restricted to real AE matchNames/aliases (effect parades, controls,
 * mask shapes, vector groups, animators, time remapping, etc.) so arbitrary
 * unknown names still resolve to null (preserving AE traversal semantics).
 * @param {string} name
 */
function isKnownDynamicName(name) {
  const n = String(name || '');
  // Effect/animator/control/vector/mask/text structural match names + common
  // aliases. Anything carrying an ADBE matchName prefix is treated as known.
  if (/^ADBE /.test(n)) return true;
  return [
    'Effects',
    'Effect Parade',
    'Masks',
    'Mask Parade',
    'Contents',
    'Source Text',
    'Animators',
    'Time Remap',
    'Time Remapping',
    'Slider',
    'Checkbox',
    'Color',
    'Point',
    'Angle',
    '3D Point',
    'Layer',
    'Path',
    // Transform property display names — AE exposes them and scripts read them
    // directly off the layer/transform group.
    'Position',
    'Scale',
    'Rotation',
    'Anchor Point',
    'Opacity',
    'Transform'
  ].includes(n);
}

/**
 * Heuristic: does a matchName denote a property GROUP (vs a leaf value prop)?
 * Effects, controls, filters, animators, selectors and "group"-ish match names
 * become traversable groups; everything else becomes a loggable leaf property.
 * @param {string} matchName
 */
function looksLikeGroup(matchName) {
  const mn = String(matchName || '');
  return (
    /Parade$|Group$|Animator$|Animators$|Selector$|Selectors$|Control$|Filter|Effect|Properties$|Contents$/.test(mn) ||
    mn === 'ADBE Text Animator' ||
    mn === 'ADBE Text Selector'
  );
}

/**
 * Build a dynamic (not seeded from a PropertyDef) child node for a parent group.
 * Returns `{ node, asAdded }` where `node` is the traversable property/group and
 * `asAdded()` performs any side-effect logging tied to *adding* it (effects log
 * an executeCommand so the harness records the structural mutation).
 *
 * @param {object} parent owning property/group
 * @param {string} matchName matchName/name to create
 * @param {object} ctx logging ctx
 */
function makeDynamicGroup(parent, matchName, ctx) {
  const mn = String(matchName || '');
  const parentPath = (parent && parent.path) || '';
  const path = parentPath ? `${parentPath}/${mn}` : mn;
  const isGroup = looksLikeGroup(mn);
  const node = isGroup
    ? createDynamicGroupNode({ name: mn, matchName: mn, path, parent, ctx })
    : createDynamicLeafNode({ name: mn, matchName: mn, path, parent, ctx });

  return {
    node,
    asAdded() {
      // Adding an effect / filter is a structural change; surface it as an
      // executeCommand op so scripts that "add Trim Paths" etc. produce a kind.
      if (/Filter|Effect|Control$/.test(mn)) {
        safeLog(ctx, { kind: 'executeCommand', target: path, value: mn, meta: { addProperty: true } });
      }
      return node;
    }
  };
}

/**
 * A dynamic, fully-permissive property GROUP. Any `.property()`/`.addProperty()`
 * materializes further dynamic children, so scripts can walk arbitrarily deep
 * into structures that were never seeded by a fixture.
 */
function createDynamicGroupNode({ name, matchName, path, parent, ctx }) {
  const kids = [];
  let expr = '';
  let curName = name;
  const node = {
    matchName,
    path,
    propertyValueType: PropertyValueType.NO_VALUE,
    propertyType: PropertyType.NAMED_GROUP,
    isPropertyGroup: true,
    canSetExpression: false,
    canVaryOverTime: false,
    selected: false,
    parentProperty: parent || null,
    propertyDepth: (parent && parent.propertyDepth ? parent.propertyDepth : 0) + 1,
    propertyIndex: 1,
    /** AE: a control/group's `.name` is settable (effect-rig scripts rename the
     *  added control). Assigning it records a `setValue` op at the renamed path —
     *  this is the harness's representation of an effect-control name assignment
     *  (Sync-o-tron renames Dropdown/Slider controls; the fixture expects setValue
     *  on the new "<parent path>/<new name>" target). */
    get name() {
      return curName;
    },
    set name(v) {
      curName = v == null ? '' : String(v);
      logNameAssignment(ctx, parent, curName);
    },
    get numProperties() {
      return kids.length;
    },
    get numKeys() {
      return 0;
    },
    get value() {
      return undefined;
    },
    set value(_v) {
      /* groups carry no value */
    },
    propertyGroup(countUp) {
      let n = typeof countUp === 'number' ? countUp : 1;
      let p = node.parentProperty;
      while (p && n > 1) {
        p = p.parentProperty;
        n--;
      }
      return p || null;
    },
    property(nameOrIndex) {
      if (typeof nameOrIndex === 'number') {
        return kids[nameOrIndex - 1] || dynamicChild(node, nameOrIndex, ctx);
      }
      const found = kids.find((c) => c.name === nameOrIndex || c.matchName === nameOrIndex);
      return found || dynamicChild(node, nameOrIndex, ctx);
    },
    addProperty(mn) {
      const built = makeDynamicGroup(node, mn, ctx);
      kids.push(built.node);
      return built.asAdded();
    },
    /** AE: `prop.setPropertyParameters(items[])` — set a Dropdown Menu Control's
     *  item list. Returns the (menu) property; scripts then walk
     *  `.propertyGroup(1).name = ...` to rename the owning control group. */
    setPropertyParameters() {
      return node;
    },
    get expression() {
      return expr;
    },
    set expression(v) {
      expr = v == null ? '' : String(v);
      safeLog(ctx, { kind: 'setExpression', target: path, value: expr });
    }
  };
  return node;
}

/**
 * A dynamic, fully-permissive LEAF property. setValue/setValueAtTime/expression
 * all log; `.property()` keeps returning further dynamic children so deep
 * `effect("X")("Slider")` style chains keep resolving.
 */
function createDynamicLeafNode({ name, matchName, path, parent, ctx }) {
  let value = 0;
  let expr = '';
  let curName = name;
  const keyframes = [];
  const node = {
    matchName,
    path,
    propertyValueType: PropertyValueType.OneD,
    propertyType: PropertyType.PROPERTY,
    isPropertyGroup: false,
    canSetExpression: true,
    canVaryOverTime: true,
    selected: false,
    numProperties: 0,
    parentProperty: parent || null,
    propertyDepth: (parent && parent.propertyDepth ? parent.propertyDepth : 0) + 1,
    propertyIndex: 1,
    /** Settable `.name` — assigning it records a `setValue` rename op (see
     *  logNameAssignment); covers leaf-style controls renamed by effect rigs. */
    get name() {
      return curName;
    },
    set name(v) {
      curName = v == null ? '' : String(v);
      logNameAssignment(ctx, parent, curName);
    },
    get value() {
      return value;
    },
    set value(v) {
      value = v;
    },
    /** AE: `prop.setPropertyParameters(items[])` — present on leaf-treated menu
     *  controls too; returns the node so `.propertyGroup(1).name = ...` chains. */
    setPropertyParameters() {
      return node;
    },
    get numKeys() {
      return keyframes.length;
    },
    propertyGroup(countUp) {
      let n = typeof countUp === 'number' ? countUp : 1;
      let p = node.parentProperty;
      while (p && n > 1) {
        p = p.parentProperty;
        n--;
      }
      return p || null;
    },
    setValue(v) {
      value = v;
      safeLog(ctx, { kind: 'setValue', target: path, value: cloneValue(v) });
      return v;
    },
    setValueAtTime(time, v) {
      value = v;
      keyframes.push({ time, value: v });
      safeLog(ctx, { kind: 'setValueAtTime', target: path, value: cloneValue(v), meta: { time } });
      safeLog(ctx, { kind: 'addKeyframe', target: path, value: cloneValue(v), meta: { time, keyIndex: keyframes.length } });
      return keyframes.length;
    },
    setValueAtKey(keyIndex, v) {
      const kf = keyframes[keyIndex - 1];
      if (kf) kf.value = v;
      value = v;
      safeLog(ctx, { kind: 'setValue', target: path, value: cloneValue(v), meta: { keyIndex } });
      return keyIndex;
    },
    setValuesAtTimes(times, values) {
      const ts = Array.isArray(times) ? times : [];
      const vs = Array.isArray(values) ? values : [];
      for (let i = 0; i < ts.length; i++) {
        node.setValueAtTime(ts[i], vs[i]);
      }
      return keyframes.length;
    },
    get selectedKeys() {
      const out = [];
      for (let i = 1; i <= keyframes.length; i++) out.push(i);
      return out;
    },
    keySelected(keyIndex) {
      return keyIndex >= 1 && keyIndex <= keyframes.length;
    },
    keyTime(i) {
      const kf = keyframes[i - 1];
      return kf ? kf.time : 0;
    },
    keyValue(i) {
      const kf = keyframes[i - 1];
      return kf ? kf.value : undefined;
    },
    valueAtTime(time) {
      let val = value;
      for (const kf of keyframes) {
        if (kf.time <= time) val = kf.value;
      }
      return val;
    },
    setInterpolationTypeAtKey(keyIndex, inType, outType) {
      const kf = keyframes[keyIndex - 1];
      if (kf) {
        kf.interpolationIn = inType;
        kf.interpolationOut = outType !== undefined ? outType : inType;
      }
    },
    setTemporalEaseAtKey() {},
    setSpatialTangentsAtKey() {},
    setTemporalContinuousAtKey() {},
    setTemporalAutoBezierAtKey() {},
    setRovingAtKey() {},
    nearestKeyIndex() {
      return 1;
    },
    addProperty(mn) {
      const built = makeDynamicGroup(node, mn, ctx);
      return built.asAdded();
    },
    property(nameOrIndex) {
      return dynamicChild(node, nameOrIndex, ctx);
    },
    get expression() {
      return expr;
    },
    set expression(v) {
      expr = v == null ? '' : String(v);
      safeLog(ctx, { kind: 'setExpression', target: path, value: expr });
    }
  };
  return node;
}

/**
 * Resolve a dynamic child of `parent` for a name/index. Effect-param style names
 * (e.g. "ADBE Slider Control-0001", "Slider", "Color", "Checkbox", "Point")
 * become loggable leaf props; group-ish names become traversable groups.
 * @param {object} parent
 * @param {number|string} nameOrIndex
 * @param {object} ctx
 */
function dynamicChild(parent, nameOrIndex, ctx) {
  const name = nameOrIndex == null ? '' : String(nameOrIndex);
  return makeDynamicGroup(parent, name, ctx).node;
}

/**
 * Base shared shape between Property and PropertyGroup.
 * @param {PropertyDef} def
 * @param {Object} ctx
 */
function createBase(def, ctx) {
  const log = ctx && Array.isArray(ctx.log) ? ctx.log : [];
  const path = def.path || joinPath(ctx && ctx.pathPrefix, def.name);

  const base = {
    name: def.name,
    matchName: def.matchName,
    // Scripts read propertyValueType as the numeric AE code (KeyBot compares raw
    // integers; others compare against PropertyValueType.* which are now numeric).
    propertyValueType: valueTypeCode(def.propertyValueType),
    path,
    canSetExpression: !!def.canSetExpression,
    selected: false,
    __def: def,
    __log: log
  };
  return base;
}

/**
 * Build a single leaf Property.
 * @param {PropertyDef} def
 * @param {Object} ctx
 */
function createProperty(def, ctx) {
  const base = createBase(def, ctx);
  const keyframes = Array.isArray(def.keyframes) ? def.keyframes.slice() : [];

  // mutable internal value backing field. Default scalar/array values sanely so
  // scripts that read `prop.value.length` (RandoMatic) or do arithmetic on the
  // value never trip over `undefined`.
  let currentValue = def.value !== undefined ? def.value : defaultValueFor(def);
  let currentExpression = typeof def.expression === 'string' ? def.expression : '';

  const prop = {
    ...base,
    propertyType: PropertyType.PROPERTY,
    isPropertyGroup: false,
    numProperties: 0,
    // AE Property surface used by scripts under test.
    propertyDepth: typeof (ctx && ctx.depth) === 'number' ? ctx.depth : 1,
    propertyIndex: typeof (ctx && ctx.propertyIndex) === 'number' ? ctx.propertyIndex : 1,
    parentProperty: (ctx && ctx.parentProperty) || null,
    canVaryOverTime: def.canVaryOverTime !== false,
    elided: false,

    get value() {
      return currentValue;
    },

    set value(v) {
      currentValue = v;
    },

    get numKeys() {
      return keyframes.length;
    },

    /** AE: `prop.isTimeVarying` — true when the property has keyframes (or an
     *  expression). KeyCloneMatic skips non-time-varying properties. */
    get isTimeVarying() {
      return keyframes.length > 0 || (typeof currentExpression === 'string' && currentExpression.length > 0);
    },

    /**
     * AE: `prop.propertyGroup(countUp)` — walk up `countUp` parents (1-based).
     * @param {number} [countUp]
     */
    propertyGroup(countUp) {
      let n = typeof countUp === 'number' ? countUp : 1;
      let node = prop.parentProperty;
      while (node && n > 1) {
        node = node.parentProperty;
        n--;
      }
      // AE: the layer IS the top property group, so propertyGroup(propertyDepth)
      // returns the owning layer. Our concrete tree tops out at a synthetic root,
      // so when the walk exhausts the chain, return the owning layer.
      return node || (ctx && ctx.ownerLayer) || null;
    },

    /** Selected-keyframe surface (RandoMatic). All seeded keys count as selected. */
    get selectedKeys() {
      const out = [];
      for (let i = 1; i <= keyframes.length; i++) out.push(i);
      return out;
    },

    /** AE: `prop.keySelected(keyIndex)` — 1-based. */
    keySelected(keyIndex) {
      return keyIndex >= 1 && keyIndex <= keyframes.length;
    },

    /**
     * AE: `prop.setValueAtKey(keyIndex, value)` — update an existing key's value.
     * In AE this re-sets the value AT that keyframe's time, so the harness logs
     * BOTH `setValueAtTime` (KeyBot edits selected keyframes and expects this) and
     * `setValue` (KeyCloneMatic's clone→update path expects a value-set op). Extra
     * kinds are harmless — scenarios assert the expected kinds are PRESENT.
     * @param {number} keyIndex 1-based
     * @param {*} v
     */
    setValueAtKey(keyIndex, v) {
      const kf = keyframes[keyIndex - 1];
      if (kf) kf.value = v;
      currentValue = v;
      const time = kf ? kf.time : 0;
      safeLog(ctx, {
        kind: 'setValueAtTime',
        target: base.path,
        value: cloneValue(v),
        meta: { time, keyIndex }
      });
      safeLog(ctx, { kind: 'setValue', target: base.path, value: cloneValue(v), meta: { keyIndex } });
      return keyIndex;
    },

    /**
     * AE: `prop.setValuesAtTimes(times[], values[])` — batch keyframe creation.
     * Logs setValueAtTime + addKeyframe per pair (Triminator expects addKeyframe).
     * @param {number[]} times
     * @param {Array} values
     */
    setValuesAtTimes(times, values) {
      const ts = Array.isArray(times) ? times : [];
      const vs = Array.isArray(values) ? values : [];
      for (let i = 0; i < ts.length; i++) {
        const v = vs[i];
        const kf = { time: ts[i], value: v };
        keyframes.push(kf);
        currentValue = v;
        safeLog(ctx, { kind: 'setValueAtTime', target: base.path, value: cloneValue(v), meta: { time: ts[i] } });
        safeLog(ctx, { kind: 'addKeyframe', target: base.path, value: cloneValue(v), meta: { time: ts[i], keyIndex: keyframes.length } });
      }
      return keyframes.length;
    },

    /**
     * Set a static value. Logs OPERATION_KINDS.setValue.
     * @param {*} v
     */
    setValue(v) {
      currentValue = v;
      safeLog(ctx, {
        kind: OPERATION_KINDS[OPERATION_KINDS.indexOf('setValue')],
        target: base.path,
        value: v
      });
      return v;
    },

    /**
     * Set a keyframed value at a time. Logs setValueAtTime + addKeyframe.
     * @param {number} time
     * @param {*} v
     */
    setValueAtTime(time, v) {
      currentValue = v;
      const kf = { time, value: v };
      keyframes.push(kf);
      safeLog(ctx, {
        kind: 'setValueAtTime',
        target: base.path,
        value: v,
        meta: { time }
      });
      safeLog(ctx, {
        kind: 'addKeyframe',
        target: base.path,
        value: v,
        meta: { time, keyIndex: keyframes.length }
      });
      return keyframes.length;
    },

    /**
     * Add a keyframe at the given time (AE: addKey returns the new key index).
     * @param {number} time
     */
    addKey(time) {
      const kf = { time, value: currentValue };
      keyframes.push(kf);
      safeLog(ctx, {
        kind: 'addKeyframe',
        target: base.path,
        value: currentValue,
        meta: { time, keyIndex: keyframes.length }
      });
      return keyframes.length;
    },

    /**
     * AE valueAtTime(time[, preExpression]) — sample the property value at a
     * time. The harness returns the nearest keyframe value at-or-before `time`,
     * else the current value (deterministic; no interpolation needed for the
     * op-kind checks).
     * @param {number} time
     */
    valueAtTime(time) {
      let val = currentValue;
      for (const kf of keyframes) {
        if (kf.time <= time) val = kf.value;
      }
      return val;
    },

    /**
     * AE keyTime(keyIndex) — 1-based. Stub backed by stored keyframes.
     * @param {number} keyIndex
     */
    keyTime(keyIndex) {
      const kf = keyframes[keyIndex - 1];
      return kf ? kf.time : 0;
    },

    /**
     * AE keyValue(keyIndex) — 1-based. Stub backed by stored keyframes.
     * @param {number} keyIndex
     */
    keyValue(keyIndex) {
      const kf = keyframes[keyIndex - 1];
      return kf ? kf.value : undefined;
    },

    /**
     * A leaf usually has no sub-properties. To keep scripts that probe into
     * effect parameters (e.g. `slider.property("ADBE Slider Control-0001")`)
     * working, we return a dynamic child node lazily rather than null.
     * @param {number|string} nameOrIndex
     */
    property(nameOrIndex) {
      return dynamicChild(prop, nameOrIndex, ctx);
    },

    /** AE: add a sub-property (used on effect params/groups treated as leaves). */
    addProperty(matchName) {
      return makeDynamicGroup(prop, matchName, ctx).asAdded();
    },

    /** AE: remove a keyframe (1-based). */
    removeKey(keyIndex) {
      if (keyIndex >= 1 && keyIndex <= keyframes.length) {
        keyframes.splice(keyIndex - 1, 1);
      }
    },

    /** AE keyframe interpolation/ease setters — accepted as no-ops (read-shape
     *  mutations the harness does not need to record as distinct op kinds). */
    setInterpolationTypeAtKey(keyIndex, inType, outType) {
      const kf = keyframes[keyIndex - 1];
      if (kf) {
        kf.interpolationIn = inType;
        kf.interpolationOut = outType !== undefined ? outType : inType;
      }
    },
    setTemporalEaseAtKey() {},
    setSpatialTangentsAtKey() {},
    setTemporalContinuousAtKey() {},
    setTemporalAutoBezierAtKey() {},
    setTemporalAutoSpatialBezierAtKey() {},
    setSpatialContinuousAtKey() {},
    setSpatialAutoBezierAtKey() {},
    setRovingAtKey() {},
    setLabelAtKey() {},
    /** AE: select/deselect a keyframe (1-based). No-op (no distinct op kind). */
    setSelectedAtKey() {},
    keyInTemporalEase() {
      return [{ speed: 0, influence: 16.67 }];
    },
    keyOutTemporalEase() {
      return [{ speed: 0, influence: 16.67 }];
    },
    /** AE keyframe interpolation/flag GETTERS — KeyCloneMatic's Keyframe ctor
     *  reads each one per key to clone it. Return deterministic AE defaults
     *  (LINEAR interpolation, no continuity/auto-bezier, neutral label/roving). */
    keyInInterpolationType(keyIndex) {
      const kf = keyframes[keyIndex - 1];
      return interpolationTypeCode(kf && kf.interpolationIn);
    },
    keyOutInterpolationType(keyIndex) {
      const kf = keyframes[keyIndex - 1];
      return interpolationTypeCode(kf && kf.interpolationOut);
    },
    keyTemporalContinuous() {
      return false;
    },
    keyTemporalAutoBezier() {
      return false;
    },
    keySpatialContinuous() {
      return false;
    },
    keySpatialAutoBezier() {
      return false;
    },
    keyRoving() {
      return false;
    },
    keyLabel() {
      return 0;
    },
    keyInSpatialTangent() {
      return [0, 0, 0];
    },
    keyOutSpatialTangent() {
      return [0, 0, 0];
    },
    nearestKeyIndex(time) {
      let best = 1;
      let bestDist = Infinity;
      for (let i = 0; i < keyframes.length; i++) {
        const d = Math.abs(keyframes[i].time - time);
        if (d < bestDist) {
          bestDist = d;
          best = i + 1;
        }
      }
      return best;
    }
  };

  // expression getter/setter — assignment logs setExpression.
  Object.defineProperty(prop, 'expression', {
    enumerable: true,
    get() {
      return currentExpression;
    },
    set(expr) {
      currentExpression = expr == null ? '' : String(expr);
      safeLog(ctx, {
        kind: 'setExpression',
        target: base.path,
        value: currentExpression
      });
    }
  });

  // expose backing keyframes for inspection (non-enumerable)
  Object.defineProperty(prop, '__keyframes', {
    enumerable: false,
    get() {
      return keyframes;
    }
  });

  return prop;
}

/**
 * Build a PropertyGroup with recursive children and AE-style .property() traversal.
 * @param {PropertyDef} def
 * @param {Object} ctx
 */
function createPropertyGroup(def, ctx) {
  const base = createBase(def, ctx);
  const childDefs = Array.isArray(def.properties) ? def.properties : [];

  const depth = typeof (ctx && ctx.depth) === 'number' ? ctx.depth : 1;

  /** @type {any[]} built children — declared first so getters/closures see it. */
  let children = [];

  const group = {
    ...base,
    propertyType: def.name ? PropertyType.NAMED_GROUP : PropertyType.INDEXED_GROUP,
    isPropertyGroup: true,
    propertyDepth: depth,
    propertyIndex: typeof (ctx && ctx.propertyIndex) === 'number' ? ctx.propertyIndex : 1,
    parentProperty: (ctx && ctx.parentProperty) || null,
    canVaryOverTime: false,

    get numProperties() {
      return children.length;
    },

    get numKeys() {
      return 0;
    },

    /** AE: `group.propertyGroup(countUp)` — walk up `countUp` parents (1-based). */
    propertyGroup(countUp) {
      let n = typeof countUp === 'number' ? countUp : 1;
      let node = group.parentProperty;
      while (node && n > 1) {
        node = node.parentProperty;
        n--;
      }
      return node || (ctx && ctx.ownerLayer) || null;
    },

    /**
     * AE: `group.addProperty(matchName)` — append a child group/property. Used
     * heavily by scripts that build effect controls, animators, trim paths, etc.
     * For known "filter/effect" match names we log an executeCommand (mirrors the
     * AE menu-add) so harness ops reflect the addition; the returned node is a
     * fully traversable dynamic group/property.
     * @param {string} matchName
     */
    addProperty(matchName) {
      const built = makeDynamicGroup(group, matchName, ctx);
      children.push(built.node);
      return built.asAdded();
    },

    /**
     * AE-style traversal.
     *   .property(index)      — 1-based integer index
     *   .property(name)       — by display name
     *   .property(matchName)  — by matchName
     * Returns the child Property/PropertyGroup or null.
     * @param {number|string} nameOrIndex
     */
    property(nameOrIndex) {
      if (typeof nameOrIndex === 'number') {
        // AE indices are 1-based
        const idx = nameOrIndex - 1;
        if (children[idx]) return children[idx];
        // Out-of-range numeric access on a seeded group returns null (AE-like).
        return null;
      }
      if (typeof nameOrIndex === 'string') {
        // match by name first, then matchName
        let found = children.find((c) => c.name === nameOrIndex);
        if (!found) {
          found = children.find((c) => c.matchName === nameOrIndex);
        }
        if (found) return found;
        // AE Vector Groups expose their children under a "Contents" sub-group.
        // Fixtures often seed the children directly on the group, so when a
        // script asks a populated group for "Contents" (and there is no literal
        // Contents child) return the group itself — its children ARE its
        // contents. This lets shape-tree walkers (Originator/Centralizer/
        // VertexMaster) reach the seeded Path properties.
        if ((nameOrIndex === 'Contents' || nameOrIndex === 'ADBE Vectors Group') && children.length > 0) {
          return group;
        }
        // An Effects parade may hold effects with ARBITRARY display names (e.g.
        // "Stereo Mixer", "Multi_Parent"). When THIS group is the effect parade,
        // materialize+persist any requested effect child so the round-trip
        // `effects.property("Stereo Mixer")` (lookup) and a later
        // `effects.addProperty("Stereo Mixer")` resolve to the same node and the
        // expression writes land (sfxMaster). Persisting keeps numProperties sane.
        if (base.matchName === 'ADBE Effect Parade' || base.name === 'Effects') {
          const child = makeDynamicGroup(group, nameOrIndex, ctx).node;
          children.push(child);
          return child;
        }
        // Permissive fallback — ONLY for recognized AE structural names (effect
        // parades, mask parades, controls, animators, time-remapping, etc.). For
        // arbitrary unknown names we return null to preserve AE's traversal
        // contract (a non-existent property resolves to null).
        if (isKnownDynamicName(nameOrIndex)) {
          return dynamicChild(group, nameOrIndex, ctx);
        }
        return null;
      }
      return null;
    },

    /** AE: a group is also callable — `group("Position")` ≡ `group.property("Position")`. */
    __children: undefined,

    /** Groups do not carry a value, but AE exposes a value getter that throws-ish.
     *  We keep it permissive and return undefined. */
    get value() {
      return undefined;
    },

    /** setValue on a group is invalid in AE; we log nothing and return undefined. */
    setValue: noop,

    /** keyTime/keyValue stubs on a group return defaults. */
    keyTime() {
      return 0;
    },
    keyValue() {
      return undefined;
    }
  };

  // Build children now that `group` exists so each child can carry a correct
  // parentProperty / propertyDepth / propertyIndex (AE-style).
  //
  // AE: the layer IS the top-level property group — `rootGroup.parentProperty`
  // returns the owning layer, and the layer itself has no parentProperty. The
  // synthetic 'ADBE Root' wrapper created by buildProperties has no AE
  // counterpart, so children of that wrapper parent to the owner layer instead
  // (RefManager-style walks `while (p.parentProperty)` then rely on
  // `layer.containingComp` to reach the comp, exactly as in AE).
  const isSyntheticRoot = !(ctx && ctx.parentProperty);
  const childParent = isSyntheticRoot && ctx && ctx.ownerLayer ? ctx.ownerLayer : group;
  children = childDefs.map((cd, i) =>
    buildProperty(cd, {
      ...ctx,
      pathPrefix: base.path,
      parentProperty: childParent,
      depth: depth + 1,
      propertyIndex: i + 1
    })
  );
  group.__children = children;

  // expression is not settable on most groups; expose canSetExpression and a
  // setter that still logs when permitted, for API symmetry.
  let groupExpression = typeof def.expression === 'string' ? def.expression : '';
  Object.defineProperty(group, 'expression', {
    enumerable: true,
    get() {
      return groupExpression;
    },
    set(expr) {
      groupExpression = expr == null ? '' : String(expr);
      safeLog(ctx, {
        kind: 'setExpression',
        target: base.path,
        value: groupExpression
      });
    }
  });

  return group;
}

/**
 * Build a single Property or PropertyGroup from a PropertyDef.
 * @param {PropertyDef} def
 * @param {Object} ctx
 * @returns {Object}
 */
export function buildProperty(def, ctx = {}) {
  if (!def || typeof def !== 'object') {
    return null;
  }
  if (isGroupDef(def)) {
    return createPropertyGroup(def, ctx);
  }
  return createProperty(def, ctx);
}

/**
 * buildProperties — entry point. Builds a synthetic root PropertyGroup that
 * contains the given top-level PropertyDefs, so the result supports
 * AE-style `.property(...)` traversal directly.
 *
 * @param {PropertyDef[]} propDefs
 * @param {Object} [ctx] - { log: Operation[], pathPrefix?: string }
 * @returns {Object} root PropertyGroup
 */
export function buildProperties(propDefs, ctx = {}) {
  const defs = Array.isArray(propDefs) ? propDefs : [];
  const rootDef = {
    name: ctx && ctx.rootName ? ctx.rootName : '',
    matchName: ctx && ctx.rootMatchName ? ctx.rootMatchName : 'ADBE Root',
    path: (ctx && ctx.pathPrefix) || '',
    propertyValueType: 'NoValue',
    canSetExpression: false,
    properties: defs
  };
  return createPropertyGroup(rootDef, ctx);
}

/**
 * selectedProperties — resolve a list of slash-separated property paths
 * (from snapshot.selection.propertyPaths) into Property objects within a
 * built property tree (the root PropertyGroup from buildProperties).
 *
 * Each path is resolved by walking name/matchName segments from the root.
 * Resolved properties are flagged `.selected = true`.
 *
 * @param {Object} rootGroup - root PropertyGroup from buildProperties
 * @param {string[]} propertyPaths
 * @returns {Object[]} array of resolved Property/PropertyGroup objects
 */
export function selectedProperties(rootGroup, propertyPaths) {
  const out = [];
  if (!rootGroup || !Array.isArray(propertyPaths)) return out;

  for (const rawPath of propertyPaths) {
    if (typeof rawPath !== 'string' || rawPath.length === 0) continue;
    const segments = rawPath.split('/').filter((s) => s.length > 0);
    let node = rootGroup;
    let ok = true;
    for (const seg of segments) {
      if (!node || typeof node.property !== 'function') {
        ok = false;
        break;
      }
      const next = node.property(seg);
      if (!next) {
        ok = false;
        break;
      }
      node = next;
    }
    if (ok && node && node !== rootGroup) {
      node.selected = true;
      out.push(node);
    }
  }
  return out;
}

export default buildProperties;
