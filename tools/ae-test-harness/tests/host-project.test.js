import { describe, it, expect } from 'vitest';
import { createProject, CompItem, ItemCollection } from '../src/host/project/index.js';
import { OPERATION_KINDS } from '../src/contracts/index.js';

/** Minimal valid-ish snapshot with two comps, one active. */
function makeSnapshot() {
  const compDef = (id, name) => ({
    id,
    name,
    width: 1920,
    height: 1080,
    duration: 10,
    frameRate: 24,
    pixelAspect: 1,
    layers: [
      {
        id: `${id}-L1`,
        index: 1,
        name: 'Layer One',
        type: 'AV',
        threeDLayer: false,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: []
      },
      {
        id: `${id}-L2`,
        index: 2,
        name: 'Layer Two',
        type: 'Shape',
        threeDLayer: true,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: []
      }
    ]
  });

  return {
    appVersion: '24.0',
    project: {
      items: [
        { id: 'comp-1', name: 'Main', typeName: 'Composition' },
        { id: 'comp-2', name: 'Other', typeName: 'Composition' },
        { id: 'foot-1', name: 'clip.mov', typeName: 'Footage' }
      ]
    },
    activeItemId: 'comp-1',
    comps: [compDef('comp-1', 'Main'), compDef('comp-2', 'Other')],
    selection: { layerIds: ['comp-1-L2'], propertyPaths: [] }
  };
}

describe('createProject', () => {
  it('returns app, project, CompItem and exposes app.version + activeViewer', () => {
    const log = [];
    const { app, project, CompItem: Cls } = createProject(makeSnapshot(), log);
    expect(typeof app).toBe('object');
    expect(typeof project).toBe('object');
    expect(Cls).toBe(CompItem);
    expect(app.version).toBe('24.0');
    expect(app.activeViewer).toBeTruthy();
    expect(typeof app.activeViewer.setActive).toBe('function');
    expect(app.project).toBe(project);
  });

  it('resolves activeItem to a CompItem with name/width/height/duration/frameRate', () => {
    const { app } = createProject(makeSnapshot(), []);
    const ai = app.project.activeItem;
    expect(ai).toBeInstanceOf(CompItem);
    expect(ai.name).toBe('Main');
    expect(ai.width).toBe(1920);
    expect(ai.height).toBe(1080);
    expect(ai.duration).toBe(10);
    expect(ai.frameRate).toBe(24);
  });

  it('returns null activeItem when activeItemId is null', () => {
    const snap = makeSnapshot();
    snap.activeItemId = null;
    const { app } = createProject(snap, []);
    expect(app.project.activeItem).toBe(null);
  });

  it('CompItem exposes numLayers/layers/layer(i)/selectedLayers (empty until attached)', () => {
    const { app } = createProject(makeSnapshot(), []);
    const comp = app.project.activeItem;
    expect(comp.numLayers).toBe(0);
    expect(comp.layers.length).toBe(0);
    expect(comp.layer(1)).toBe(null);
    expect(comp.selectedLayers).toEqual([]);
  });

  it('attachLayers wires a layers builder; numLayers/layer(i)/selectedLayers reflect it', () => {
    const { app, ctx } = createProject(makeSnapshot(), []);
    // Fake layers subsystem.
    const buildLayers = (compDef) =>
      compDef.layers.map((ld) => ({
        __id: ld.id,
        index: ld.index,
        name: ld.name,
        selected: ld.id === 'comp-1-L2',
        threeDLayer: ld.threeDLayer
      }));
    ctx.attachLayers(buildLayers);

    const comp = app.project.activeItem;
    expect(comp.numLayers).toBe(2);
    expect(comp.layers.length).toBe(2);
    expect(comp.layer(1).name).toBe('Layer One');
    expect(comp.layer(2).name).toBe('Layer Two');
    expect(comp.layer('Layer Two').index).toBe(2);
    expect(comp.layer(99)).toBe(null);
    expect(comp.selectedLayers.map((l) => l.name)).toEqual(['Layer Two']);
    // ctx.layerById populated for cross-module lookups.
    expect(ctx.layerById['comp-1-L2'].name).toBe('Layer Two');
  });

  it('beginUndoGroup logs beginUndoGroup with kind from OPERATION_KINDS', () => {
    const log = [];
    const { app } = createProject(makeSnapshot(), log);
    app.beginUndoGroup('My Group');
    expect(log).toHaveLength(1);
    expect(log[0].kind).toBe('beginUndoGroup');
    expect(OPERATION_KINDS).toContain(log[0].kind);
    expect(log[0].target).toBe('My Group');
  });

  it('endUndoGroup logs endUndoGroup', () => {
    const log = [];
    const { app } = createProject(makeSnapshot(), log);
    app.endUndoGroup();
    expect(log).toEqual([{ kind: 'endUndoGroup' }]);
  });

  it('executeCommand logs executeCommand with stringified target', () => {
    const log = [];
    const { app } = createProject(makeSnapshot(), log);
    app.executeCommand(2771);
    expect(log).toHaveLength(1);
    expect(log[0].kind).toBe('executeCommand');
    expect(log[0].target).toBe('2771');
    expect(log[0].value).toBe(2771);
  });

  it('all logged operation kinds are valid OPERATION_KINDS', () => {
    const log = [];
    const { app } = createProject(makeSnapshot(), log);
    app.beginUndoGroup('g');
    app.executeCommand('cmd');
    app.endUndoGroup();
    for (const op of log) {
      expect(OPERATION_KINDS).toContain(op.kind);
    }
  });

  it('project.items is an ItemCollection (1-based) resolving comps to CompItems', () => {
    const { project } = createProject(makeSnapshot(), []);
    expect(project.items).toBeInstanceOf(ItemCollection);
    expect(project.items.length).toBe(3);
    expect(project.items.item(1)).toBeInstanceOf(CompItem);
    expect(project.items.item(1).name).toBe('Main');
    expect(project.items.byName('clip.mov').typeName).toBe('Footage');
    expect(project.item(2).name).toBe('Other');
  });

  it('is usable in isolation with an empty/edge snapshot', () => {
    const empty = {
      appVersion: '0',
      project: { items: [] },
      activeItemId: null,
      comps: [],
      selection: { layerIds: [], propertyPaths: [] }
    };
    const { app, project } = createProject(empty, []);
    expect(app.project.activeItem).toBe(null);
    expect(project.items.length).toBe(0);
    // Defaults to internal log when none passed.
    const r = createProject(empty);
    expect(r.app.version).toBe('24.0');
  });
});
