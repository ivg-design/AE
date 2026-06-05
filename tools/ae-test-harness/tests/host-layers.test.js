import { describe, it, expect, beforeEach } from 'vitest';
import { buildLayers, warmupProperties } from '../src/host/layers/index.js';
import { OPERATION_KINDS, validateOperation } from '../src/contracts/index.js';

/**
 * Small CompDef builder + ctx with an operation log capture.
 */
function makeCtx() {
  const log = [];
  return {
    log: (op) => log.push(op),
    __log: log
  };
}

function transformGroup() {
  return {
    matchName: 'ADBE Transform Group',
    name: 'Transform',
    path: 'Transform',
    propertyValueType: 'NoValue',
    canSetExpression: false,
    numProperties: 1,
    properties: [
      {
        matchName: 'ADBE Position',
        name: 'Position',
        path: 'Transform/Position',
        propertyValueType: 'TwoD',
        value: [100, 100],
        canSetExpression: true
      }
    ]
  };
}

function makeCompDef() {
  return {
    id: 'comp1',
    name: 'Main',
    width: 1920,
    height: 1080,
    duration: 10,
    frameRate: 30,
    pixelAspect: 1,
    layers: [
      {
        id: 'L1',
        index: 1,
        name: 'Solid 1',
        type: 'AV',
        threeDLayer: false,
        parentId: null,
        inPoint: 0,
        outPoint: 5,
        properties: [transformGroup()]
      },
      {
        id: 'L2',
        index: 2,
        name: 'Shape 1',
        type: 'Shape',
        threeDLayer: true,
        parentId: 'L3',
        inPoint: 0,
        outPoint: 10,
        properties: [transformGroup()]
      },
      {
        id: 'L3',
        index: 3,
        name: 'Null 1',
        type: 'Null',
        threeDLayer: false,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: [transformGroup()]
      },
      {
        id: 'L4',
        index: 4,
        name: 'Text 1',
        type: 'Text',
        threeDLayer: false,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: [transformGroup()]
      },
      {
        id: 'L5',
        index: 5,
        name: 'Cam 1',
        type: 'Camera',
        threeDLayer: true,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: []
      },
      {
        id: 'L6',
        index: 6,
        name: 'Light 1',
        type: 'Light',
        threeDLayer: true,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: []
      }
    ]
  };
}

describe('buildLayers', () => {
  beforeEach(async () => {
    // Ensure the real properties module is wired in for property() delegation.
    await warmupProperties();
  });

  it('builds layer objects with core contract fields', () => {
    const ctx = makeCtx();
    const { layers, byId } = buildLayers(makeCompDef(), ctx);
    expect(layers).toHaveLength(6);

    const l1 = byId.L1;
    expect(l1.index).toBe(1);
    expect(l1.name).toBe('Solid 1');
    expect(l1.enabled).toBe(true);
    expect(l1.threeDLayer).toBe(false);
    expect(l1.inPoint).toBe(0);
    expect(l1.outPoint).toBe(5);

    expect(byId.L2.threeDLayer).toBe(true);
    expect(byId.L3.nullLayer).toBe(true);
  });

  it('keys layers by type bucket', () => {
    const { byType } = buildLayers(makeCompDef(), makeCtx());
    expect(byType.AVLayer.map((l) => l.id)).toContain('L1');
    expect(byType.ShapeLayer.map((l) => l.id)).toEqual(['L2']);
    expect(byType.TextLayer.map((l) => l.id)).toEqual(['L4']);
    expect(byType.Null.map((l) => l.id)).toEqual(['L3']);
    // Null layers are also AVLayer instances.
    expect(byType.AVLayer.map((l) => l.id)).toContain('L3');
    expect(byType.Camera.map((l) => l.id)).toEqual(['L5']);
    expect(byType.Light.map((l) => l.id)).toEqual(['L6']);
  });

  it('wires initial parents from parentId without logging', () => {
    const ctx = makeCtx();
    const { byId } = buildLayers(makeCompDef(), ctx);
    expect(byId.L2.parent).toBe(byId.L3);
    expect(byId.L1.parent).toBeNull();
    // Initial parent wiring must not produce operations.
    expect(ctx.__log).toHaveLength(0);
  });

  it('logs setParent and guards self-parent', () => {
    const ctx = makeCtx();
    const { byId } = buildLayers(makeCompDef(), ctx);

    byId.L1.setParent(byId.L3);
    expect(byId.L1.parent).toBe(byId.L3);
    expect(ctx.__log).toHaveLength(1);
    expect(ctx.__log[0].kind).toBe('setParent');
    expect(ctx.__log[0].target).toBe('Solid 1');
    expect(ctx.__log[0].meta.parentId).toBe('L3');

    // Self-parent guarded: no parent change, no extra op.
    byId.L1.setParent(byId.L1);
    expect(byId.L1.parent).toBe(byId.L3);
    expect(ctx.__log).toHaveLength(1);

    // parent setter delegates to setParent and logs.
    byId.L1.parent = byId.L4;
    expect(byId.L1.parent).toBe(byId.L4);
    expect(ctx.__log).toHaveLength(2);
    expect(ctx.__log[1].kind).toBe('setParent');
  });

  it('delegates property() and exposes transform group', () => {
    const { byId } = buildLayers(makeCompDef(), makeCtx());
    const tf = byId.L1.transform;
    expect(tf).toBeTruthy();
    const pos = byId.L1.property('Transform').property('Position');
    expect(pos).toBeTruthy();
  });

  it('logs reorder for moveToBeginning and moveBefore', () => {
    const ctx = makeCtx();
    const { byId } = buildLayers(makeCompDef(), ctx);

    byId.L4.moveToBeginning();
    const moveBegin = ctx.__log.find((o) => o.meta && o.meta.mode === 'moveToBeginning');
    expect(moveBegin.kind).toBe('reorder');
    expect(byId.L4.index).toBe(1);

    byId.L1.moveBefore(byId.L3);
    const moveBefore = ctx.__log.find((o) => o.meta && o.meta.mode === 'moveBefore');
    expect(moveBefore.kind).toBe('reorder');
    expect(moveBefore.meta.beforeId).toBe('L3');
  });

  it('logs deleteLayer on remove and re-indexes', () => {
    const ctx = makeCtx();
    const { byId, layerCollection } = buildLayers(makeCompDef(), ctx);
    const before = layerCollection.length;
    byId.L3.remove();
    const del = ctx.__log.find((o) => o.kind === 'deleteLayer');
    expect(del.target).toBe('Null 1');
    expect(del.meta.layerId).toBe('L3');
    expect(layerCollection.length).toBe(before - 1);
    // Indices remain contiguous 1..N.
    layerCollection.toArray().forEach((l, i) => expect(l.index).toBe(i + 1));
  });

  it('seeds selectedLayers from snapshot.selection.layerIds', () => {
    const ctx = makeCtx();
    ctx.snapshot = { selection: { layerIds: ['L2', 'L4'], propertyPaths: [] } };
    const { selectedLayers } = buildLayers(makeCompDef(), ctx);
    expect(selectedLayers.map((l) => l.id)).toEqual(['L2', 'L4']);
  });

  it('emits only valid contract operations', () => {
    const ctx = makeCtx();
    const { byId } = buildLayers(makeCompDef(), ctx);
    byId.L1.setParent(byId.L3);
    byId.L1.moveToBeginning();
    byId.L1.remove();
    expect(ctx.__log.length).toBeGreaterThan(0);
    for (const op of ctx.__log) {
      expect(OPERATION_KINDS).toContain(op.kind);
      expect(validateOperation(op).ok).toBe(true);
    }
  });

  it('is importable and usable without a properties module (stub fallback)', () => {
    // Provide an explicit buildProperties via ctx to prove delegation path.
    const ctx = makeCtx();
    ctx.buildProperties = (defs) => ({
      numProperties: defs.length,
      property: (n) =>
        defs.find((d) => d.name === n || d.matchName === n) ? { __found: n } : null
    });
    const { byId } = buildLayers(makeCompDef(), ctx);
    expect(byId.L1.numProperties).toBe(1);
    expect(byId.L1.property('Transform')).toEqual({ __found: 'Transform' });
  });
});
