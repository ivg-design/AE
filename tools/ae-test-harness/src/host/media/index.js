/**
 * src/host/media/index.js — host-media subsystem.
 *
 * Provides the "media" surface of the simulated After Effects host:
 *   - Shape groups / Path value objects (Shape with vertices/inTangents/outTangents/closed,
 *     setValue logging, createPath).
 *   - Mask / MaskCollection objects.
 *   - TextDocument value objects (text, fontSize, fillColor, applyFill, fluent setters).
 *   - Text animator group stubs.
 *   - layerStyles group stub.
 *   - sourceRectAtTime() returning a deterministic stub rect.
 *
 * These objects are attached to Shape and Text layers by the layers subsystem via `ctx`.
 *
 * Every mutation that the harness must observe is logged as an Operation whose `kind`
 * comes EXCLUSIVELY from OPERATION_KINDS (imported from the frozen contracts module).
 *
 * The module is importable in isolation: `buildMedia(ctx)` tolerates a missing/partial
 * `ctx` and falls back to an internal operation log.
 *
 * ESM only. Relative imports use explicit `.js` extensions.
 */

import { OPERATION_KINDS } from '../../contracts/index.js';

/**
 * Resolve a logging function from the provided ctx.
 *
 * Accepts any of:
 *   - ctx.pushOp(op)         (preferred — host-level operation sink)
 *   - ctx.log  (Array)       (mutations are pushed directly)
 *   - ctx.__log (Array)      (alias used by the composed host)
 * Falls back to an internal array (still queryable via the returned media.__log).
 *
 * @param {object} [ctx]
 * @returns {{ push: (op: object) => object, sink: object[] }}
 */
function resolveLogger(ctx) {
  const sink = [];
  const internal = (op) => {
    sink.push(op);
    return op;
  };

  if (ctx) {
    if (typeof ctx.pushOp === 'function') {
      return {
        push: (op) => {
          sink.push(op);
          ctx.pushOp(op);
          return op;
        },
        sink
      };
    }
    const arr = Array.isArray(ctx.log)
      ? ctx.log
      : Array.isArray(ctx.__log)
        ? ctx.__log
        : null;
    if (arr) {
      return {
        push: (op) => {
          sink.push(op);
          arr.push(op);
          return op;
        },
        sink
      };
    }
  }
  return { push: internal, sink };
}

/**
 * Assert (at construction time) that an operation kind is part of the frozen set.
 * Guards against drift between this module and the contracts.
 * @param {string} kind
 * @returns {string}
 */
function op(kind) {
  if (!OPERATION_KINDS.includes(kind)) {
    throw new Error(
      `host-media: illegal operation kind "${kind}" (must be one of ${OPERATION_KINDS.join('|')})`
    );
  }
  return kind;
}

/* ------------------------------------------------------------------ *
 * Shape / Path value object (AE "Shape" — the value of a path property)
 * ------------------------------------------------------------------ */

/**
 * Mirror of the After Effects `Shape` object that is the value of a
 * "Path" (ADBE Vector Shape) property.
 *
 * Supports both the property-style API (`vertices`, `inTangents`, `outTangents`,
 * `closed`) used throughout the catalog scripts and the `createPath(...)` helper.
 */
export class Shape {
  /**
   * @param {object} [init]
   * @param {number[][]} [init.vertices]
   * @param {number[][]} [init.inTangents]
   * @param {number[][]} [init.outTangents]
   * @param {boolean} [init.closed]
   */
  constructor(init = {}) {
    /** @type {number[][]} */
    this.vertices = clone2D(init.vertices) || [];
    /** @type {number[][]} */
    this.inTangents = clone2D(init.inTangents) || [];
    /** @type {number[][]} */
    this.outTangents = clone2D(init.outTangents) || [];
    /** @type {boolean} */
    this.closed = init.closed != null ? !!init.closed : true;
    // AE also exposes featherSegLocs etc.; harmless empty stubs.
    this.featherSegLocs = [];
    this.featherRelSegLocs = [];
    this.featherAmounts = [];
    this.featherTensions = [];
    this.featherTypes = [];
    this.featherInterps = [];
  }

  /**
   * AE Shape.setPath(points) — alias kept for compatibility.
   * @param {number[][]} points
   */
  setPath(points) {
    this.vertices = clone2D(points) || [];
    return this;
  }

  /**
   * Reproduces `Shape.createPath(points, inTangents, outTangents, closed)`.
   *
   * In After Effects this is `new Shape()` then `.createPath(...)`. Here the same
   * method is exposed so scripts can call `myShape.createPath(pts, inT, outT, !open)`.
   *
   * @param {number[][]} [points]
   * @param {number[][]} [inTangents]
   * @param {number[][]} [outTangents]
   * @param {boolean} [isClosed]
   * @returns {Shape} this
   */
  createPath(points, inTangents, outTangents, isClosed) {
    if (points != null) this.vertices = clone2D(points) || [];
    if (inTangents != null) this.inTangents = clone2D(inTangents) || [];
    if (outTangents != null) this.outTangents = clone2D(outTangents) || [];
    if (isClosed != null) this.closed = !!isClosed;
    return this;
  }
}

/**
 * A Path property facade (ADBE Vector Shape / Mask Path). Its `.value` is a {@link Shape}.
 * `setValue(shape)` logs a `setValue` operation with the path target.
 */
export class PathProperty {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {string} [args.path]
   * @param {Shape} [args.value]
   * @param {string} [args.matchName]
   * @param {string} [args.name]
   */
  constructor({ push, path = 'ADBE Vector Shape', value, matchName = 'ADBE Vector Shape', name = 'Path' }) {
    this._push = push;
    this.path = path;
    this.matchName = matchName;
    this.name = name;
    this.propertyValueType = 'Shape';
    /** @type {Shape} */
    this.value = value instanceof Shape ? value : new Shape(value || {});
  }

  /**
   * @param {Shape|object} shape
   * @returns {object} the logged operation
   */
  setValue(shape) {
    const next = shape instanceof Shape ? shape : new Shape(shape || {});
    this.value = next;
    return this._push({
      kind: op('setValue'),
      target: this.path,
      value: {
        vertices: clone2D(next.vertices),
        inTangents: clone2D(next.inTangents),
        outTangents: clone2D(next.outTangents),
        closed: next.closed
      },
      meta: { propertyValueType: 'Shape' }
    });
  }

  /**
   * @param {number} time
   * @param {Shape|object} shape
   * @returns {object} the logged setValueAtTime operation
   */
  setValueAtTime(time, shape) {
    const next = shape instanceof Shape ? shape : new Shape(shape || {});
    this.value = next;
    return this._push({
      kind: op('setValueAtTime'),
      target: this.path,
      value: { time, closed: next.closed, vertexCount: next.vertices.length },
      meta: { propertyValueType: 'Shape' }
    });
  }
}

/* ------------------------------------------------------------------ *
 * Shape group (ADBE Vector Group / Root Vectors Group)
 * ------------------------------------------------------------------ */

/**
 * A shape group facade for shape layers. Holds nested groups/paths and exposes
 * `addPath`/`addGroup` helpers plus AE-style `.property(nameOrIndex)` traversal.
 */
export class ShapeGroup {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {string} [args.path]
   * @param {string} [args.matchName]
   * @param {string} [args.name]
   */
  constructor({ push, path = 'ADBE Root Vectors Group', matchName = 'ADBE Root Vectors Group', name = 'Contents' }) {
    this._push = push;
    this.path = path;
    this.matchName = matchName;
    this.name = name;
    this.propertyValueType = 'NoValue';
    /** @type {(ShapeGroup|PathProperty)[]} */
    this._children = [];
  }

  get numProperties() {
    return this._children.length;
  }

  /**
   * Add a nested shape group.
   * @param {string} [name]
   * @returns {ShapeGroup}
   */
  addGroup(name = 'Group') {
    const child = new ShapeGroup({
      push: this._push,
      path: `${this.path}/${name}`,
      name
    });
    this._children.push(child);
    return child;
  }

  /**
   * Add a path child whose value is a {@link Shape}.
   * @param {object} [value]
   * @param {string} [name]
   * @returns {PathProperty}
   */
  addPath(value, name = 'Path 1') {
    const child = new PathProperty({
      push: this._push,
      path: `${this.path}/${name}`,
      value,
      name
    });
    this._children.push(child);
    return child;
  }

  /**
   * AE-style traversal by 1-based index or by name/matchName.
   * @param {number|string} nameOrIndex
   * @returns {ShapeGroup|PathProperty|undefined}
   */
  property(nameOrIndex) {
    if (typeof nameOrIndex === 'number') {
      return this._children[nameOrIndex - 1];
    }
    return this._children.find(
      (c) => c.name === nameOrIndex || c.matchName === nameOrIndex
    );
  }
}

/* ------------------------------------------------------------------ *
 * Masks
 * ------------------------------------------------------------------ */

/** Mask blending mode names mirrored from AE's MaskMode enum (string stubs). */
export const MASK_MODES = ['NONE', 'ADD', 'SUBTRACT', 'INTERSECT', 'LIGHTEN', 'DARKEN', 'DIFFERENCE'];

/**
 * A single Mask. Owns a Mask Path ({@link PathProperty}) plus the standard
 * scalar mask properties (opacity / feather / expansion) as simple loggable facades.
 */
export class Mask {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {number} args.index 1-based mask index
   * @param {string} [args.name]
   * @param {string} [args.parentPath] owning layer path prefix
   */
  constructor({ push, index, name, parentPath = '' }) {
    this._push = push;
    this.maskIndex = index;
    this.name = name || `Mask ${index}`;
    this.matchName = 'ADBE Mask Atom';
    this.maskMode = 'ADD';
    this.inverted = false;
    this.rotoBezier = false;
    this.locked = false;
    this.color = [1, 0, 0];
    const base = `${parentPath ? parentPath + '/' : ''}ADBE Mask Parade/${this.name}`;
    /** @type {PathProperty} */
    this.maskPath = new PathProperty({
      push,
      path: `${base}/ADBE Mask Shape`,
      matchName: 'ADBE Mask Shape',
      name: 'Mask Path'
    });
    // alias used by some scripts: mask.property("maskShape") / "ADBE Mask Shape"
    this.maskShape = this.maskPath;
    this._scalars = {
      'ADBE Mask Feather': new ScalarProp(push, `${base}/ADBE Mask Feather`, 'Mask Feather', [0, 0]),
      'ADBE Mask Opacity': new ScalarProp(push, `${base}/ADBE Mask Opacity`, 'Mask Opacity', 100),
      'ADBE Mask Offset': new ScalarProp(push, `${base}/ADBE Mask Offset`, 'Mask Expansion', 0)
    };
  }

  /**
   * AE-style property traversal for a mask.
   * @param {number|string} nameOrIndex
   * @returns {PathProperty|ScalarProp|undefined}
   */
  property(nameOrIndex) {
    if (nameOrIndex === 1 || nameOrIndex === 'ADBE Mask Shape' || nameOrIndex === 'Mask Path' || nameOrIndex === 'maskShape') {
      return this.maskPath;
    }
    if (typeof nameOrIndex === 'string' && this._scalars[nameOrIndex]) {
      return this._scalars[nameOrIndex];
    }
    return undefined;
  }
}

/**
 * Mask collection (ADBE Mask Parade) — `addProperty('Mask')` style + index access.
 */
export class MaskCollection {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {string} [args.parentPath]
   * @param {Array<object>} [args.defs] initial mask defs (LayerDef.masks)
   */
  constructor({ push, parentPath = '', defs = [] }) {
    this._push = push;
    this._parentPath = parentPath;
    /** @type {Mask[]} */
    this._masks = [];
    if (Array.isArray(defs)) {
      defs.forEach((d, i) =>
        this._masks.push(
          new Mask({ push, index: i + 1, name: d && d.name, parentPath })
        )
      );
    }
  }

  get numProperties() {
    return this._masks.length;
  }

  /**
   * Add a new mask (AE: `layer.Masks.addProperty("Mask")`).
   * @param {string} [name]
   * @returns {Mask}
   */
  addProperty(name) {
    const mask = new Mask({
      push: this._push,
      index: this._masks.length + 1,
      name,
      parentPath: this._parentPath
    });
    this._masks.push(mask);
    return mask;
  }

  /**
   * 1-based index or name access (AE: `layer.mask(1)` / `layer.mask("Mask 1")`).
   * @param {number|string} nameOrIndex
   * @returns {Mask|undefined}
   */
  property(nameOrIndex) {
    if (typeof nameOrIndex === 'number') return this._masks[nameOrIndex - 1];
    return this._masks.find((m) => m.name === nameOrIndex);
  }

  /** @returns {Mask[]} */
  toArray() {
    return this._masks.slice();
  }
}

/* ------------------------------------------------------------------ *
 * TextDocument + Source Text
 * ------------------------------------------------------------------ */

/**
 * Mirror of the After Effects `TextDocument` object (the value of a Source Text property).
 *
 * Implements the data-binding properties used by catalog scripts (font, fontSize,
 * fillColor, applyFill, justification, tracking, leading, …) as plain writable fields,
 * plus the fluent style setters (`setText`, `setFontSize`, `setFillColor`, `setFont`,
 * `setApplyFill`, `setTracking`) that return a (cloned) TextDocument — matching the
 * AE 2022+ "style" API used in expressions and in `SourceTextProperty.setValue(...)`.
 */
export class TextDocument {
  /**
   * @param {string|object} [init] initial text string or a partial doc to copy.
   */
  constructor(init) {
    if (typeof init === 'string') {
      this.text = init;
    } else if (init && typeof init === 'object') {
      Object.assign(this, deepClonePlain(init));
      if (this.text == null) this.text = '';
    } else {
      this.text = '';
    }
    // Defaults mirroring AE's TextDocument.
    if (this.font == null) this.font = 'ArialMT';
    if (this.fontSize == null) this.fontSize = 36;
    if (this.fillColor == null) this.fillColor = [1, 1, 1];
    if (this.applyFill == null) this.applyFill = true;
    if (this.applyStroke == null) this.applyStroke = false;
    if (this.strokeColor == null) this.strokeColor = [0, 0, 0];
    if (this.strokeWidth == null) this.strokeWidth = 0;
    if (this.tracking == null) this.tracking = 0;
    if (this.leading == null) this.leading = 0;
    if (this.autoLeading == null) this.autoLeading = true;
    if (this.justification == null) this.justification = 7411; // LEFT_JUSTIFY value
    if (this.baselineShift == null) this.baselineShift = 0;
    if (this.boxText == null) this.boxText = false;
  }

  /**
   * The expression "style" object exposes a fluent setter surface. Each setter
   * returns a clone (so chained calls don't mutate the original), mirroring AE.
   */
  _withClone(mutate) {
    const next = new TextDocument(deepClonePlain(this));
    mutate(next);
    return next;
  }

  /** @param {string} v */ setText(v) { return this._withClone((d) => { d.text = String(v); }); }
  /** @param {number} v */ setFontSize(v) { return this._withClone((d) => { d.fontSize = Number(v); }); }
  /** @param {number[]} v */ setFillColor(v) { return this._withClone((d) => { d.fillColor = Array.isArray(v) ? v.slice() : v; d.applyFill = true; }); }
  /** @param {number[]} v */ setStrokeColor(v) { return this._withClone((d) => { d.strokeColor = Array.isArray(v) ? v.slice() : v; }); }
  /** @param {number} v */ setStrokeWidth(v) { return this._withClone((d) => { d.strokeWidth = Number(v); }); }
  /** @param {string} v */ setFont(v) { return this._withClone((d) => { d.font = String(v); }); }
  /** @param {boolean} v */ setApplyFill(v) { return this._withClone((d) => { d.applyFill = !!v; }); }
  /** @param {boolean} v */ setApplyStroke(v) { return this._withClone((d) => { d.applyStroke = !!v; }); }
  /** @param {number} v */ setTracking(v) { return this._withClone((d) => { d.tracking = Number(v); }); }
  /** @param {number} v */ setLeading(v) { return this._withClone((d) => { d.leading = Number(v); }); }
  /** @param {number} v */ setBaselineShift(v) { return this._withClone((d) => { d.baselineShift = Number(v); }); }

  /** The `style` accessor used in expressions (`text.sourceText.style`). */
  get style() {
    return this;
  }
}

/**
 * A Source Text property facade (ADBE Text Document). `.value` is a {@link TextDocument}.
 * `setValue(doc)` logs a `setValue` operation, and `.expression =` logs `setExpression`.
 */
export class SourceTextProperty {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {string} [args.path]
   * @param {string|object|TextDocument} [args.value]
   */
  constructor({ push, path = 'ADBE Text Properties/ADBE Text Document', value }) {
    this._push = push;
    this.path = path;
    this.matchName = 'ADBE Text Document';
    this.name = 'Source Text';
    this.propertyValueType = 'CustomValue';
    this.canSetExpression = true;
    /** @type {TextDocument} */
    this._value = value instanceof TextDocument ? value : new TextDocument(value);
    this._expression = '';
  }

  /** @returns {TextDocument} */
  get value() {
    return this._value;
  }

  /**
   * @param {TextDocument|string|object} doc
   * @returns {object} the logged setValue operation
   */
  setValue(doc) {
    const next = doc instanceof TextDocument ? doc : new TextDocument(doc);
    this._value = next;
    return this._push({
      kind: op('setValue'),
      target: this.path,
      value: {
        text: next.text,
        fontSize: next.fontSize,
        font: next.font,
        fillColor: Array.isArray(next.fillColor) ? next.fillColor.slice() : next.fillColor,
        applyFill: next.applyFill
      },
      meta: { propertyValueType: 'CustomValue' }
    });
  }

  /**
   * @param {number} time
   * @param {TextDocument|string|object} doc
   * @returns {object}
   */
  setValueAtTime(time, doc) {
    const next = doc instanceof TextDocument ? doc : new TextDocument(doc);
    this._value = next;
    return this._push({
      kind: op('setValueAtTime'),
      target: this.path,
      value: { time, text: next.text },
      meta: { propertyValueType: 'CustomValue' }
    });
  }

  /** @param {string} expr */
  set expression(expr) {
    this._expression = String(expr);
    this._push({
      kind: op('setExpression'),
      target: this.path,
      value: this._expression
    });
  }

  /** @returns {string} */
  get expression() {
    return this._expression;
  }
}

/* ------------------------------------------------------------------ *
 * Text animators
 * ------------------------------------------------------------------ */

/**
 * A scalar / color animator property facade that logs setValue/setExpression.
 */
export class ScalarProp {
  /**
   * @param {(op: object) => object} push
   * @param {string} path
   * @param {string} name
   * @param {*} value
   */
  constructor(push, path, name, value) {
    this._push = push;
    this.path = path;
    this.name = name;
    this.canSetExpression = true;
    this._value = value;
    this._expression = '';
  }

  get value() {
    return this._value;
  }

  /** @param {*} v */
  setValue(v) {
    this._value = v;
    return this._push({ kind: op('setValue'), target: this.path, value: v });
  }

  /** @param {number} time @param {*} v */
  setValueAtTime(time, v) {
    this._value = v;
    return this._push({ kind: op('setValueAtTime'), target: this.path, value: { time, value: v } });
  }

  /** @param {string} expr */
  set expression(expr) {
    this._expression = String(expr);
    this._push({ kind: op('setExpression'), target: this.path, value: this._expression });
  }

  get expression() {
    return this._expression;
  }
}

/**
 * Text animator group (ADBE Text Animators / a single ADBE Text Animator).
 * Supports `addProperty(matchName)` for animator selectors/props and traversal.
 */
export class TextAnimators {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {string} [args.path]
   */
  constructor({ push, path = 'ADBE Text Properties/ADBE Text Animators' }) {
    this._push = push;
    this.path = path;
    this.matchName = 'ADBE Text Animators';
    this.name = 'Animators';
    /** @type {Array<TextAnimators|ScalarProp>} */
    this._children = [];
  }

  get numProperties() {
    return this._children.length;
  }

  /**
   * AE: `textProp.property("ADBE Text Animators").addProperty("ADBE Text Animator")`
   * and on an animator: `addProperty("ADBE Text Fill Color")` etc.
   * Returns a child group for animators or a scalar prop for leaf props.
   * @param {string} matchName
   * @returns {TextAnimators|ScalarProp}
   */
  addProperty(matchName) {
    const childPath = `${this.path}/${matchName}`;
    // Group-ish match names spawn a sub-group; leaf props spawn a ScalarProp.
    const groupy = /Animator$|Animators$|Selector|Properties|Group$|ADBE Text Animator$/.test(
      matchName
    ) || matchName === 'ADBE Text Animator';
    let child;
    if (groupy) {
      child = new TextAnimators({ push: this._push, path: childPath });
      child.matchName = matchName;
      child.name = matchName;
      // animators carry a nested Properties group (so further addProperty works)
      child.properties = new TextAnimators({
        push: this._push,
        path: `${childPath}/ADBE Text Animator Properties`
      });
    } else {
      const defaultVal = /Color/.test(matchName) ? [1, 1, 1, 1] : 0;
      child = new ScalarProp(this._push, childPath, matchName, defaultVal);
    }
    this._children.push(child);
    return child;
  }

  /**
   * @param {number|string} nameOrIndex
   * @returns {TextAnimators|ScalarProp|undefined}
   */
  property(nameOrIndex) {
    if (typeof nameOrIndex === 'number') return this._children[nameOrIndex - 1];
    return this._children.find(
      (c) => c.name === nameOrIndex || c.matchName === nameOrIndex
    );
  }
}

/* ------------------------------------------------------------------ *
 * Layer styles (stub group)
 * ------------------------------------------------------------------ */

/**
 * Layer styles group stub (ADBE Layer Styles). Enough surface for scripts to
 * probe `canSetEnabled` / enable styles without crashing.
 */
export class LayerStyles {
  /**
   * @param {object} args
   * @param {(op: object) => object} args.push
   * @param {string} [args.path]
   */
  constructor({ push, path = 'ADBE Layer Styles' }) {
    this._push = push;
    this.path = path;
    this.matchName = 'ADBE Layer Styles';
    this.name = 'Layer Styles';
    this.canSetEnabled = true;
    this.enabled = false;
    this._children = [];
  }

  get numProperties() {
    return this._children.length;
  }

  /**
   * AE: `layer.layerStyles.property("ADBE Drop Shadow")`. Returns a scalar-ish stub group.
   * @param {number|string} nameOrIndex
   * @returns {ScalarProp}
   */
  property(nameOrIndex) {
    const key =
      typeof nameOrIndex === 'number' ? `style-${nameOrIndex}` : nameOrIndex;
    let child = this._children.find((c) => c.name === key);
    if (!child) {
      child = new ScalarProp(this._push, `${this.path}/${key}`, key, 0);
      child.canSetEnabled = true;
      child.enabled = false;
      this._children.push(child);
    }
    return child;
  }
}

/* ------------------------------------------------------------------ *
 * sourceRectAtTime stub
 * ------------------------------------------------------------------ */

/**
 * Build a deterministic `sourceRectAtTime` implementation.
 *
 * AE returns `{ top, left, width, height }`. For the simulated host we derive a
 * stub rect from the layer's known/declared bounds when available, otherwise a
 * fixed deterministic rectangle. Pure: no logging (it is a read, not a mutation).
 *
 * @param {object} [opts]
 * @param {{width?:number,height?:number,top?:number,left?:number}} [opts.bounds]
 * @returns {(time?: number, extents?: boolean) => {top:number,left:number,width:number,height:number}}
 */
export function makeSourceRectAtTime(opts = {}) {
  const b = opts.bounds || {};
  const width = numOr(b.width, 100);
  const height = numOr(b.height, 50);
  const top = numOr(b.top, -height / 2);
  const left = numOr(b.left, -width / 2);
  return function sourceRectAtTime(_time, _extents) {
    // deterministic — independent of time/extents in the stub
    return { top, left, width, height };
  };
}

/* ------------------------------------------------------------------ *
 * buildMedia entrypoint
 * ------------------------------------------------------------------ */

/**
 * Build the media surface and (optionally) attach it to a layer object via ctx.
 *
 * @param {object} [ctx] host context. Recognized fields:
 *   - ctx.pushOp(op) | ctx.log[] | ctx.__log[] : operation sink.
 *   - ctx.layer : a layer object to decorate (Shape/Text layers).
 *   - ctx.layerDef : the LayerDef (type, masks, source bounds) driving construction.
 * @returns {{
 *   __log: object[],
 *   Shape: typeof Shape,
 *   PathProperty: typeof PathProperty,
 *   ShapeGroup: typeof ShapeGroup,
 *   Mask: typeof Mask,
 *   MaskCollection: typeof MaskCollection,
 *   TextDocument: typeof TextDocument,
 *   SourceTextProperty: typeof SourceTextProperty,
 *   TextAnimators: typeof TextAnimators,
 *   LayerStyles: typeof LayerStyles,
 *   createShape: (init?: object) => Shape,
 *   createTextDocument: (init?: string|object) => TextDocument,
 *   createShapeGroup: (path?: string) => ShapeGroup,
 *   createMasks: (defs?: object[], parentPath?: string) => MaskCollection,
 *   createSourceText: (value?: any, path?: string) => SourceTextProperty,
 *   createTextAnimators: (path?: string) => TextAnimators,
 *   createLayerStyles: (path?: string) => LayerStyles,
 *   sourceRectAtTime: (time?: number, extents?: boolean) => object,
 *   attachToLayer: (layer: object, layerDef?: object) => object
 * }}
 */
export function buildMedia(ctx = {}) {
  const { push, sink } = resolveLogger(ctx);

  const api = {
    __log: sink,
    // Classes
    Shape,
    PathProperty,
    ShapeGroup,
    Mask,
    MaskCollection,
    TextDocument,
    SourceTextProperty,
    TextAnimators,
    LayerStyles,
    MASK_MODES,

    // Factories ----------------------------------------------------
    createShape(init) {
      return new Shape(init);
    },
    createTextDocument(init) {
      return new TextDocument(init);
    },
    createShapeGroup(path) {
      return new ShapeGroup({ push, path });
    },
    createMasks(defs, parentPath) {
      return new MaskCollection({ push, defs, parentPath });
    },
    createSourceText(value, path) {
      return new SourceTextProperty({ push, value, path });
    },
    createTextAnimators(path) {
      return new TextAnimators({ push, path });
    },
    createLayerStyles(path) {
      return new LayerStyles({ push, path });
    },

    /**
     * Build a sourceRectAtTime function bound to the given bounds.
     * @param {object} [bounds]
     */
    makeSourceRectAtTime(bounds) {
      return makeSourceRectAtTime({ bounds });
    },

    /**
     * Decorate a layer object with the appropriate media surface based on its type.
     * Idempotent-ish: returns the same layer for chaining.
     *
     * @param {object} layer
     * @param {object} [layerDef]
     * @returns {object} the decorated layer
     */
    attachToLayer(layer, layerDef) {
      if (!layer) return layer;
      const def = layerDef || layer.__def || {};
      const type = def.type || layer.__type || layer.type;
      const layerPath = layer.name || def.name || 'Layer';

      // sourceRectAtTime for AV/Shape/Text layers.
      const bounds = boundsFromDef(def);
      if (typeof layer.sourceRectAtTime !== 'function') {
        layer.sourceRectAtTime = makeSourceRectAtTime({ bounds });
      }

      // Masks for any layer that declares them (or AV layers).
      if (Array.isArray(def.masks) && def.masks.length) {
        const masks = new MaskCollection({
          push,
          defs: def.masks,
          parentPath: layerPath
        });
        layer.Masks = masks;
        layer.mask = (sel) => masks.property(sel);
      }

      // Layer styles stub for all decorated layers.
      if (!layer.layerStyles) {
        layer.layerStyles = new LayerStyles({ push, path: `${layerPath}/ADBE Layer Styles` });
      }

      if (type === 'Shape') {
        if (!layer.content) {
          const root = new ShapeGroup({
            push,
            path: `${layerPath}/ADBE Root Vectors Group`
          });
          layer.rootVectorsGroup = root;
          // AE `layer.content("...")` is callable on shape layers.
          layer.content = (sel) => (sel == null ? root : root.property(sel));
        }
      } else if (type === 'Text') {
        if (!layer.sourceText) {
          const src = new SourceTextProperty({
            push,
            path: `${layerPath}/ADBE Text Properties/ADBE Text Document`,
            value: def.text && def.text.sourceText
          });
          layer.sourceText = src;
          layer.text = {
            sourceText: src,
            animators: new TextAnimators({
              push,
              path: `${layerPath}/ADBE Text Properties/ADBE Text Animators`
            })
          };
        }
      }
      return layer;
    }
  };

  // Auto-attach when ctx provides a layer to decorate.
  if (ctx && ctx.layer) {
    api.attachToLayer(ctx.layer, ctx.layerDef);
  }

  return api;
}

export default buildMedia;

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

function numOr(v, fallback) {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

function clone2D(arr) {
  if (!Array.isArray(arr)) return null;
  return arr.map((row) => (Array.isArray(row) ? row.slice() : row));
}

function deepClonePlain(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (Array.isArray(v)) out[k] = v.map((x) => (Array.isArray(x) ? x.slice() : x));
    else if (v && typeof v === 'object') out[k] = deepClonePlain(v);
    else out[k] = v;
  }
  return out;
}

function boundsFromDef(def) {
  if (!def) return {};
  if (def.source && typeof def.source === 'object') {
    const s = def.source;
    if (s.width != null || s.height != null) {
      return { width: s.width, height: s.height };
    }
  }
  if (def.bounds) return def.bounds;
  return {};
}
