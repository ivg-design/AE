import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for Triminator.jsx
 *
 * Script behaviour summary:
 *  - @ui HEADLESS  (no ScriptUI dialog; runs directly)
 *  - Reads ScriptUI.environment.keyboardState.shiftKey to decide addKeys flag
 *  - Guard 1: no active comp → alert("Please select a composition!") + return
 *  - Guard 2: comp.selectedLayers.length === 0 → alert("Please select some layers!") + return
 *  - Main flow:
 *      beginUndoGroup("Add Trim Paths")
 *      for each selected layer:
 *        skip if layer.matchName !== "ADBE Vector Layer"  (not a shape layer)
 *        collect selectedGroups (PropertyType.NAMED_GROUP) from layer.selectedProperties
 *        if no selectedGroups:
 *          groupContents = layer.property("ADBE Root Vectors Group")
 *          addTrimPathsWithKeys(groupContents)  → contents.addProperty("ADBE Vector Filter - Trim")
 *            → logged as executeCommand (shape property mutation)
 *            if addKeys:
 *              trimStart.setValuesAtTimes([inPoint, inPoint+1], [0, 100])
 *                → logged as addKeyframe × 2  (time=inPoint val=0, time=inPoint+1 val=100)
 *              trimEnd.setValuesAtTimes([inPoint, inPoint+1], [0, 100])
 *                → logged as addKeyframe × 2
 *        else: same per selected group
 *      endUndoGroup
 *
 * Scenario set:
 *  (a) success-with-keys  — one Shape layer selected, no group selected, Shift NOT held.
 *      Trim Paths added to root vectors group + 4 keyframes written (2 on Start, 2 on End).
 *  (b) success-no-keys    — same layer, Shift IS held.
 *      Trim Paths added but NO keyframes written.
 *  (c) guard-no-comp      — no active composition → alert.
 *  (d) guard-no-layers    — comp active, no layers selected → alert.
 *  (e) guard-non-shape    — selected layer is AV (matchName "ADBE AV Layer"), skipped silently;
 *      endUndoGroup still called but no Trim Paths or keyframes written.
 */

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const COMP_ID      = 'comp-trim-01';
const SHAPE_LYR_ID = 'layer-trim-shape-01';
const AV_LYR_ID    = 'layer-trim-av-01';

// ---------------------------------------------------------------------------
// HostSnapshot: success — one Shape layer selected, no groups pre-selected.
// layer.inPoint = 0  →  keyframe times [0, 1]
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Trim Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Trim Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: SHAPE_LYR_ID,
          index: 1,
          name: 'Shape Layer 1',
          // type 'Shape' corresponds to matchName "ADBE Vector Layer" in AE
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Shape Layer 1/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 0,
              properties: [],
            },
          ],
        },
      ],
    },
  ],
  // Layer selected; no property paths → no selectedGroups
  selection: {
    layerIds: [SHAPE_LYR_ID],
    propertyPaths: [],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot: guard — no active composition
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot: guard — comp active but no layers selected
// ---------------------------------------------------------------------------
const guardNoLayersHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-trim-02', name: 'Empty Sel Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-trim-02',
  comps: [
    {
      id: 'comp-trim-02',
      name: 'Empty Sel Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-trim-02',
          index: 1,
          name: 'Shape Layer 2',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [],
        },
      ],
    },
  ],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot: non-shape — selected layer is an AV layer, should be skipped.
// beginUndoGroup/endUndoGroup still wrap the loop even if nothing is added.
// ---------------------------------------------------------------------------
const nonShapeHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-trim-03', name: 'AV Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-trim-03',
  comps: [
    {
      id: 'comp-trim-03',
      name: 'AV Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: AV_LYR_ID,
          index: 1,
          name: 'AV Layer 1',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [],
        },
      ],
    },
  ],
  selection: { layerIds: [AV_LYR_ID], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Triminator',
    category: 'utilities',
    relPath: 'utilities/Triminator.jsx',
    ui: false,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS WITH KEYS — shape layer, Shift not held.
    //     Trim Paths property added (executeCommand) then 4 keyframes
    //     written: TrimStart[0s]=0, TrimStart[1s]=100,
    //              TrimEnd[0s]=0,   TrimEnd[1s]=100.
    // ------------------------------------------------------------------
    {
      name: 'success – add Trim Paths with keyframes to root vectors group',
      kind: 'success',
      host: successHost,
      actions: [
        // HEADLESS: Shift not held (addKeys=true is the default)
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Add Trim Paths' },
        // contents.addProperty("ADBE Vector Filter - Trim") → shape mutation
        { kind: 'executeCommand', target: 'Shape Layer 1/Contents/ADBE Vector Filter - Trim' },
        // trimStart.setValuesAtTimes → 2 keyframes
        { kind: 'addKeyframe', target: 'Shape Layer 1/Contents/ADBE Vector Filter - Trim/ADBE Vector Trim Start' },
        { kind: 'addKeyframe', target: 'Shape Layer 1/Contents/ADBE Vector Filter - Trim/ADBE Vector Trim Start' },
        // trimEnd.setValuesAtTimes → 2 keyframes
        { kind: 'addKeyframe', target: 'Shape Layer 1/Contents/ADBE Vector Filter - Trim/ADBE Vector Trim End' },
        { kind: 'addKeyframe', target: 'Shape Layer 1/Contents/ADBE Vector Filter - Trim/ADBE Vector Trim End' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      // addProperty and setValuesAtTimes behaviour depends on AE shape-layer runtime details
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (b) SUCCESS WITHOUT KEYS — same layer, Shift IS held → addKeys=false.
    //     Only Trim Paths property added; no keyframes.
    // ------------------------------------------------------------------
    {
      name: 'success – add Trim Paths effect only (Shift held, no keyframes)',
      kind: 'success',
      host: successHost,
      actions: [
        // Simulate Shift key being held: target encodes modifier hint
        { type: 'run', target: 'shiftKey' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Add Trim Paths' },
        { kind: 'executeCommand', target: 'Shape Layer 1/Contents/ADBE Vector Filter - Trim' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (c) GUARD — no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please select a composition!'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (d) GUARD — comp active but no layers selected
    // ------------------------------------------------------------------
    {
      name: 'guard – no selected layers',
      kind: 'guard',
      host: guardNoLayersHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please select some layers!'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (e) GUARD (soft) — selected layer is AV (matchName !== "ADBE Vector Layer").
    //     Script skips it silently; undo group is opened/closed but no Trim
    //     Paths or keyframes are written.
    // ------------------------------------------------------------------
    {
      name: 'guard – selected layer is not a shape layer (silently skipped)',
      kind: 'guard',
      host: nonShapeHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Add Trim Paths' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: [],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load — throw if the fixture is malformed
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error(
    'Triminator.fixture.js failed self-validation:\n' + _check.errors.join('\n')
  );
}

export default fixture;
