/**
 * Tests for the host-media subsystem (src/host/media/index.js).
 *
 * Verifies: shape groups/paths, masks, TextDocument + fluent setters, source text
 * property logging, text animators, layerStyles stub, sourceRectAtTime stub, and that
 * ALL logged operations use kinds from the frozen OPERATION_KINDS set.
 */

import { describe, it, expect } from 'vitest';

import buildMedia, {
  Shape,
  PathProperty,
  ShapeGroup,
  Mask,
  MaskCollection,
  TextDocument,
  SourceTextProperty,
  TextAnimators,
  LayerStyles,
  makeSourceRectAtTime
} from '../index.js';

import { OPERATION_KINDS, validateOperation } from '../../../contracts/index.js';

/** Build media with a private log sink. */
function freshMedia(extra = {}) {
  const log = [];
  const media = buildMedia({ log, ...extra });
  return { media, log };
}

describe('buildMedia — wiring & isolation', () => {
  it('is importable in isolation and returns the documented surface', () => {
    const { media } = freshMedia();
    for (const k of [
      'Shape',
      'PathProperty',
      'ShapeGroup',
      'Mask',
      'MaskCollection',
      'TextDocument',
      'SourceTextProperty',
      'TextAnimators',
      'LayerStyles',
      'createShape',
      'createTextDocument',
      'createShapeGroup',
      'createMasks',
      'createSourceText',
      'createTextAnimators',
      'createLayerStyles'
    ]) {
      expect(media[k]).toBeDefined();
    }
  });

  it('falls back to an internal log when ctx has no sink', () => {
    const media = buildMedia();
    const path = media.createShapeGroup('Contents').addPath();
    path.setValue(new Shape({ vertices: [[0, 0]] }));
    expect(media.__log.length).toBe(1);
  });

  it('routes operations to ctx.pushOp when provided', () => {
    const ops = [];
    const media = buildMedia({ pushOp: (o) => ops.push(o) });
    media.createSourceText('hi').setValue(new TextDocument('bye'));
    expect(ops).toHaveLength(1);
    expect(ops[0].kind).toBe('setValue');
  });
});

describe('Shape / Path', () => {
  it('holds vertices/inTangents/outTangents/closed', () => {
    const s = new Shape({
      vertices: [[0, 0], [10, 0]],
      inTangents: [[0, 0], [0, 0]],
      outTangents: [[0, 0], [0, 0]],
      closed: false
    });
    expect(s.vertices).toEqual([[0, 0], [10, 0]]);
    expect(s.closed).toBe(false);
  });

  it('createPath mutates the shape', () => {
    const s = new Shape();
    s.createPath([[1, 1]], [[0, 0]], [[0, 0]], true);
    expect(s.vertices).toEqual([[1, 1]]);
    expect(s.closed).toBe(true);
  });

  it('PathProperty.setValue logs a setValue op with the shape value', () => {
    const { media, log } = freshMedia();
    const p = media.createShapeGroup('Contents').addPath(undefined, 'Path 1');
    expect(p).toBeInstanceOf(PathProperty);
    const ret = p.setValue(new Shape({ vertices: [[1, 2]], closed: true }));
    expect(ret.kind).toBe('setValue');
    expect(log).toHaveLength(1);
    expect(log[0].kind).toBe('setValue');
    expect(log[0].value.vertices).toEqual([[1, 2]]);
    expect(log[0].value.closed).toBe(true);
  });

  it('PathProperty.setValueAtTime logs setValueAtTime', () => {
    const { media, log } = freshMedia();
    const p = media.createShapeGroup().addPath();
    p.setValueAtTime(0.5, new Shape({ vertices: [[0, 0]] }));
    expect(log[0].kind).toBe('setValueAtTime');
    expect(log[0].value.time).toBe(0.5);
  });
});

describe('ShapeGroup traversal', () => {
  it('supports nested groups and index/name traversal', () => {
    const { media } = freshMedia();
    const root = media.createShapeGroup('ADBE Root Vectors Group');
    const grp = root.addGroup('Rectangle 1');
    grp.addPath(undefined, 'Rectangle Path 1');
    expect(root.numProperties).toBe(1);
    expect(root.property(1)).toBe(grp);
    expect(root.property('Rectangle 1')).toBe(grp);
    expect(grp.property('Rectangle Path 1')).toBeInstanceOf(PathProperty);
  });
});

describe('Masks', () => {
  it('builds masks from defs and exposes a mask path that logs setValue', () => {
    const { media, log } = freshMedia();
    const masks = media.createMasks([{ name: 'Mask 1' }, { name: 'Mask 2' }], 'MyLayer');
    expect(masks).toBeInstanceOf(MaskCollection);
    expect(masks.numProperties).toBe(2);
    const m1 = masks.property(1);
    expect(m1).toBeInstanceOf(Mask);
    expect(masks.property('Mask 2').name).toBe('Mask 2');
    m1.maskPath.setValue(new Shape({ vertices: [[0, 0], [5, 5]] }));
    expect(log[0].kind).toBe('setValue');
    expect(log[0].target).toContain('Mask 1');
  });

  it('addProperty appends a new mask', () => {
    const { media } = freshMedia();
    const masks = media.createMasks([], 'L');
    const m = masks.addProperty('Mask 1');
    expect(masks.numProperties).toBe(1);
    expect(m.property('ADBE Mask Shape')).toBe(m.maskPath);
    expect(m.property('ADBE Mask Feather')).toBeDefined();
  });
});

describe('TextDocument', () => {
  it('exposes text/fontSize/fillColor/applyFill with sane defaults', () => {
    const d = new TextDocument('Hello');
    expect(d.text).toBe('Hello');
    expect(typeof d.fontSize).toBe('number');
    expect(Array.isArray(d.fillColor)).toBe(true);
    expect(d.applyFill).toBe(true);
  });

  it('accepts a partial doc object', () => {
    const d = new TextDocument({ text: 'x', fontSize: 50, fillColor: [1, 0, 0] });
    expect(d.fontSize).toBe(50);
    expect(d.fillColor).toEqual([1, 0, 0]);
  });

  it('fluent setters return clones (no mutation of the original)', () => {
    const d = new TextDocument('orig');
    const d2 = d.setText('new').setFontSize(72).setFillColor([0, 1, 0]);
    expect(d.text).toBe('orig');
    expect(d2.text).toBe('new');
    expect(d2.fontSize).toBe(72);
    expect(d2.fillColor).toEqual([0, 1, 0]);
    expect(d2.applyFill).toBe(true);
  });

  it('style getter returns the document itself', () => {
    const d = new TextDocument('z');
    expect(d.style).toBe(d);
  });
});

describe('SourceTextProperty', () => {
  it('setValue logs setValue with text payload', () => {
    const { media, log } = freshMedia();
    const src = media.createSourceText('initial');
    expect(src).toBeInstanceOf(SourceTextProperty);
    src.setValue(new TextDocument('updated'));
    expect(log[0].kind).toBe('setValue');
    expect(log[0].value.text).toBe('updated');
    expect(src.value.text).toBe('updated');
  });

  it('expression setter logs setExpression', () => {
    const { media, log } = freshMedia();
    const src = media.createSourceText('x');
    src.expression = 'thisComp.layer(1).text.sourceText';
    expect(log[0].kind).toBe('setExpression');
    expect(src.expression).toContain('sourceText');
  });
});

describe('TextAnimators', () => {
  it('addProperty spawns animator groups and leaf scalar props that log', () => {
    const { media, log } = freshMedia();
    const animators = media.createTextAnimators();
    expect(animators).toBeInstanceOf(TextAnimators);
    const animator = animators.addProperty('ADBE Text Animator');
    expect(animator.properties).toBeDefined();
    const fill = animator.properties.addProperty('ADBE Text Fill Color');
    fill.setValue([1, 0, 0, 1]);
    expect(log[0].kind).toBe('setValue');
    expect(log[0].value).toEqual([1, 0, 0, 1]);
  });
});

describe('LayerStyles stub', () => {
  it('returns enable-able style stubs without throwing', () => {
    const { media } = freshMedia();
    const styles = media.createLayerStyles();
    expect(styles).toBeInstanceOf(LayerStyles);
    const ds = styles.property('ADBE Drop Shadow');
    expect(ds.canSetEnabled).toBe(true);
    expect(typeof ds.setValue).toBe('function');
  });
});

describe('sourceRectAtTime', () => {
  it('returns a deterministic rect with top/left/width/height', () => {
    const fn = makeSourceRectAtTime({ bounds: { width: 200, height: 80 } });
    const r = fn(0);
    expect(r).toEqual({ top: -40, left: -100, width: 200, height: 80 });
    expect(fn(1.5, true)).toEqual(r);
  });

  it('falls back to fixed defaults with no bounds', () => {
    const fn = makeSourceRectAtTime();
    const r = fn();
    expect(r.width).toBeGreaterThan(0);
    expect(r.height).toBeGreaterThan(0);
  });
});

describe('attachToLayer', () => {
  it('decorates a Shape layer with content() and sourceRectAtTime', () => {
    const { media } = freshMedia();
    const layer = {};
    media.attachToLayer(layer, { type: 'Shape', name: 'Star', masks: [{ name: 'Mask 1' }] });
    expect(typeof layer.content).toBe('function');
    expect(layer.content()).toBeInstanceOf(ShapeGroup);
    expect(typeof layer.sourceRectAtTime).toBe('function');
    expect(layer.Masks).toBeInstanceOf(MaskCollection);
    expect(layer.layerStyles).toBeInstanceOf(LayerStyles);
  });

  it('decorates a Text layer with sourceText + animators', () => {
    const { media } = freshMedia();
    const layer = {};
    media.attachToLayer(layer, { type: 'Text', name: 'Title', text: { sourceText: 'Hi' } });
    expect(layer.sourceText).toBeInstanceOf(SourceTextProperty);
    expect(layer.sourceText.value.text).toBe('Hi');
    expect(layer.text.animators).toBeInstanceOf(TextAnimators);
  });

  it('auto-attaches when ctx.layer is provided', () => {
    const layer = {};
    buildMedia({ log: [], layer, layerDef: { type: 'Shape', name: 'Auto' } });
    expect(typeof layer.content).toBe('function');
  });
});

describe('operation-kind discipline', () => {
  it('every logged op uses a kind from OPERATION_KINDS and validates', () => {
    const { media, log } = freshMedia();
    const root = media.createShapeGroup('Contents');
    root.addPath().setValue(new Shape({ vertices: [[0, 0]] }));
    const masks = media.createMasks([{ name: 'Mask 1' }], 'L');
    masks.property(1).maskPath.setValue(new Shape({ vertices: [[1, 1]] }));
    const src = media.createSourceText('a');
    src.setValue(new TextDocument('b'));
    src.expression = 'value';
    const an = media.createTextAnimators().addProperty('ADBE Text Animator');
    an.properties.addProperty('ADBE Text Tracking Amount').setValue(10);

    expect(log.length).toBeGreaterThan(0);
    for (const o of log) {
      expect(OPERATION_KINDS).toContain(o.kind);
      expect(validateOperation(o).ok).toBe(true);
    }
  });
});
