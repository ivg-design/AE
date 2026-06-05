import { describe, it, expect } from 'vitest';
import { createHost, runFixtureScenario } from '../src/host/index.js';
import { OPERATION_KINDS } from '../src/contracts/index.js';

/**
 * A small but schema-shaped HostSnapshot: one active comp with an AV layer that
 * carries a Transform group containing an Opacity property we can mutate.
 */
function makeSnapshot() {
  const opacity = {
    matchName: 'ADBE Opacity',
    name: 'Opacity',
    path: 'ADBE Transform Group/ADBE Opacity',
    propertyValueType: 'OneD',
    value: 100,
    canSetExpression: true,
    keyframes: []
  };
  const transform = {
    matchName: 'ADBE Transform Group',
    name: 'Transform',
    path: 'ADBE Transform Group',
    propertyValueType: 'NoValue',
    canSetExpression: false,
    properties: [opacity]
  };
  const layer = {
    id: 'L1',
    index: 1,
    name: 'Solid 1',
    type: 'AV',
    threeDLayer: false,
    parentId: null,
    inPoint: 0,
    outPoint: 5,
    properties: [transform]
  };
  const comp = {
    id: 'C1',
    name: 'Comp 1',
    width: 1920,
    height: 1080,
    duration: 5,
    frameRate: 24,
    pixelAspect: 1,
    layers: [layer]
  };
  return {
    appVersion: '24.0',
    project: { items: [{ id: 'C1', name: 'Comp 1', typeName: 'Composition' }] },
    activeItemId: 'C1',
    comps: [comp],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

describe('host/index — createHost composition', () => {
  it('exposes the contract surface', () => {
    const host = createHost(makeSnapshot());
    expect(typeof host.app).toBe('object');
    expect(typeof host.File).toBe('function');
    expect(typeof host.Folder).toBe('function');
    expect(typeof host.$).toBe('object');
    expect(typeof host.CompItem).toBe('function');
    expect(typeof host.AVLayer).toBe('function');
    expect(typeof host.ShapeLayer).toBe('function');
    expect(typeof host.TextLayer).toBe('function');
    expect(Array.isArray(host.__log)).toBe(true);
  });

  it('resolves the active comp and its layers', () => {
    const host = createHost(makeSnapshot());
    const active = host.app.project.activeItem;
    expect(active).toBeTruthy();
    expect(active.name).toBe('Comp 1');
    expect(active.numLayers).toBe(1);
    const layer = active.layer(1);
    expect(layer.name).toBe('Solid 1');
    expect(layer).toBeInstanceOf(host.AVLayer);
  });

  it('shares ONE log across project, properties, and io-effects', () => {
    const host = createHost(makeSnapshot());
    const log = host.__log;

    host.app.beginUndoGroup('Trivial');

    const layer = host.app.project.activeItem.layer(1);
    const opacity = layer
      .property('Transform')
      .property('Opacity');
    expect(opacity).toBeTruthy();
    opacity.setValue(50);

    host.app.endUndoGroup();

    const kinds = log.map((op) => op.kind);
    expect(kinds).toContain('beginUndoGroup');
    expect(kinds).toContain('setValue');
    expect(kinds).toContain('endUndoGroup');
    // Every logged kind is part of the frozen set.
    for (const k of kinds) expect(OPERATION_KINDS).toContain(k);
  });
});

describe('host/index — runFixtureScenario', () => {
  it('runs a trivial script and returns logged operations', async () => {
    const script = `
      app.beginUndoGroup("Set Opacity");
      var comp = app.project.activeItem;
      var layer = comp.layer(1);
      var opacity = layer.property("Transform").property("Opacity");
      opacity.setValue(42);
      alert("done");
      app.endUndoGroup();
    `;
    const { error, operations } = await runFixtureScenario(makeSnapshot(), script, []);
    expect(error).toBeNull();
    expect(Array.isArray(operations)).toBe(true);
    const kinds = operations.map((op) => op.kind);
    expect(kinds).toContain('beginUndoGroup');
    expect(kinds).toContain('setValue');
    expect(kinds).toContain('alert');
    expect(kinds).toContain('endUndoGroup');

    const setVal = operations.find((op) => op.kind === 'setValue');
    expect(setVal.value).toBe(42);
  });

  it('captures script errors without throwing', async () => {
    const { error, operations } = await runFixtureScenario(
      makeSnapshot(),
      'throw new Error("boom");',
      []
    );
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('boom');
    expect(Array.isArray(operations)).toBe(true);
  });
});
