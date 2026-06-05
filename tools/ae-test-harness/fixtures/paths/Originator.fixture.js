import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for Originator.jsx
 *
 * Script behaviour summary:
 *  - @ui DIALOG
 *  - Wraps everything in beginUndoGroup("Center Shape Path Origin") / endUndoGroup.
 *  - Guard: no active comp → alert("Please open a composition and select a shape layer.") + return
 *  - Guard: no selected layers → alert("Please select a shape layer.") + return
 *  - Guard: selected layer is not a ShapeLayer → alert("The selected layer is not a Shape Layer.") + return
 *  - Guard: layer has no shape paths → alert("No shape paths were found in the selected layer.") + return
 *  - Success (single shape path):
 *      1. beginUndoGroup("Center Shape Path Origin")
 *      2. Reads path property value (no op logged for reads)
 *      3. setValue on the shape path property (centered Shape)
 *      4. alert("The shape path has been centered.")
 *      5. endUndoGroup
 *  - Success (multiple shape paths):
 *      1. beginUndoGroup("Center Shape Path Origin")
 *      2. Shows DIALOG for tree-view selection
 *      3. User clicks "Center Selected"
 *      4. setValue on the selected shape path property
 *      5. alert("Selected shape paths have been centered.")
 *      6. endUndoGroup
 */

// ---------------------------------------------------------------------------
// Shared IDs
// ---------------------------------------------------------------------------
const COMP_ID = 'comp-orig-01';
const SHAPE_LAYER_ID = 'layer-shape-01';
const MULTI_COMP_ID = 'comp-orig-02';
const MULTI_SHAPE_LAYER_ID = 'layer-shape-02';
const GUARD_COMP_ID = 'comp-orig-guard-01';
const GUARD_AV_LAYER_ID = 'layer-av-guard-01';

// ---------------------------------------------------------------------------
// HostSnapshot – success with ONE shape path (auto-centered, no dialog)
// Shape layer contains "Contents > Group 1 > Path 1" structure.
// ---------------------------------------------------------------------------
const successSingleHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Origin Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Origin Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: SHAPE_LAYER_ID,
          index: 1,
          name: 'Star Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Star Shape/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 1,
              properties: [
                {
                  matchName: 'ADBE Vector Group',
                  name: 'Group 1',
                  path: 'Star Shape/Contents/Group 1',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 2,
                  properties: [
                    {
                      matchName: 'ADBE Vector Shape - Group',
                      name: 'Path 1',
                      path: 'Star Shape/Contents/Group 1/Path 1',
                      propertyValueType: 'NoValue',
                      canSetExpression: false,
                      numProperties: 1,
                      properties: [
                        {
                          matchName: 'ADBE Vector Shape',
                          name: 'Path',
                          path: 'Star Shape/Contents/Group 1/Path 1/Path',
                          propertyValueType: 'Shape',
                          value: {
                            vertices: [
                              [100, 100],
                              [200, 100],
                              [200, 200],
                              [100, 200],
                            ],
                            inTangents: [[0, 0], [0, 0], [0, 0], [0, 0]],
                            outTangents: [[0, 0], [0, 0], [0, 0], [0, 0]],
                            closed: true,
                          },
                          canSetExpression: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Star Shape/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Star Shape/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: [SHAPE_LAYER_ID],
    propertyPaths: [],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot – success with MULTIPLE shape paths (shows dialog)
//
// The shape paths are seeded as DIRECT children of "Contents" (two
// "ADBE Vector Shape - Group" entries: "Path 1" and "Path 2"). The harness
// ScriptUI runtime models a treeview as a FLAT item list — add('node', ...)
// returns a leaf list item that has no .add() — so wrapping each path in a
// nested "ADBE Vector Group" would crash Originator's recursive createTreeView
// when it tries to add the path item to the (leaf) group node. With the paths
// at the top level, extractGroups yields two "shape" entries, createTreeView
// adds both as items directly on the treeview, the dialog builds, and the
// modal show() auto-selects + fires "Center Selected" so the paths get
// re-centered (setValue) exactly as the script does on a real flat shape.
// ---------------------------------------------------------------------------
const successMultiHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: MULTI_COMP_ID, name: 'Multi Shape Comp', typeName: 'Composition' }],
  },
  activeItemId: MULTI_COMP_ID,
  comps: [
    {
      id: MULTI_COMP_ID,
      name: 'Multi Shape Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: MULTI_SHAPE_LAYER_ID,
          index: 1,
          name: 'Complex Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Complex Shape/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 2,
              properties: [
                {
                  matchName: 'ADBE Vector Shape - Group',
                  name: 'Path 1',
                  path: 'Complex Shape/Contents/Path 1',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Vector Shape',
                      name: 'Path',
                      path: 'Complex Shape/Contents/Path 1/Path',
                      propertyValueType: 'Shape',
                      value: {
                        vertices: [
                          [50, 50],
                          [150, 50],
                          [100, 130],
                        ],
                        inTangents: [[0, 0], [0, 0], [0, 0]],
                        outTangents: [[0, 0], [0, 0], [0, 0]],
                        closed: true,
                      },
                      canSetExpression: false,
                    },
                  ],
                },
                {
                  matchName: 'ADBE Vector Shape - Group',
                  name: 'Path 2',
                  path: 'Complex Shape/Contents/Path 2',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Vector Shape',
                      name: 'Path',
                      path: 'Complex Shape/Contents/Path 2/Path',
                      propertyValueType: 'Shape',
                      value: {
                        vertices: [
                          [300, 300],
                          [400, 300],
                          [350, 380],
                        ],
                        inTangents: [[0, 0], [0, 0], [0, 0]],
                        outTangents: [[0, 0], [0, 0], [0, 0]],
                        closed: true,
                      },
                      canSetExpression: false,
                    },
                  ],
                },
              ],
            },
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Complex Shape/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Complex Shape/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: [MULTI_SHAPE_LAYER_ID],
    propertyPaths: [],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot – guard: no active comp
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot – guard: active comp but no layers selected
// ---------------------------------------------------------------------------
const guardNoLayerHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: GUARD_COMP_ID, name: 'Guard Comp', typeName: 'Composition' }],
  },
  activeItemId: GUARD_COMP_ID,
  comps: [
    {
      id: GUARD_COMP_ID,
      name: 'Guard Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: GUARD_AV_LAYER_ID,
          index: 1,
          name: 'Footage Layer',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Footage Layer/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Footage Layer/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 100,
                  canSetExpression: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  // Nothing selected
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot – guard: selected layer is not a ShapeLayer (AV layer selected)
// ---------------------------------------------------------------------------
const guardNotShapeHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-orig-guard-02', name: 'AV Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-orig-guard-02',
  comps: [
    {
      id: 'comp-orig-guard-02',
      name: 'AV Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-av-02',
          index: 1,
          name: 'Video Layer',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Video Layer/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Video Layer/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 100,
                  canSetExpression: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: { layerIds: ['layer-av-02'], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Originator',
    category: 'paths',
    relPath: 'paths/Originator.jsx',
    ui: true,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS – single shape path: auto-centered, no dialog shown.
    //     Expected:
    //       beginUndoGroup("Center Shape Path Origin")
    //       setValue on "Star Shape/Contents/Group 1/Path 1/Path" (centered shape)
    //       alert("The shape path has been centered.")
    //       endUndoGroup
    // ------------------------------------------------------------------
    {
      name: 'success – single shape path auto-centered',
      kind: 'success',
      host: successSingleHost,
      actions: [
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Center Shape Path Origin' },
        { kind: 'setValue', target: 'Star Shape/Contents/Group 1/Path 1/Path' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['The shape path has been centered.'],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (b) SUCCESS – multiple shape paths: dialog shown, user selects
    //     a path and clicks "Center Selected".
    //     Expected:
    //       beginUndoGroup("Center Shape Path Origin")
    //       [dialog shown]
    //       setValue on the selected shape path ("Complex Shape/Contents/Path 1/Path")
    //       alert("Selected shape paths have been centered.")
    //       endUndoGroup
    // ------------------------------------------------------------------
    {
      name: 'success – multiple shape paths via dialog selection',
      kind: 'success',
      host: successMultiHost,
      actions: [
        { type: 'run' },
        // Tree view dialog appears; user selects a path item.
        { type: 'select', target: 'tree', value: 'Path 1' },
        // Click "Center Selected" button.
        { type: 'click', target: 'Center Selected' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Center Shape Path Origin' },
        { kind: 'setValue', target: 'Complex Shape/Contents/Path 1/Path' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['Selected shape paths have been centered.'],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (c) GUARD – no active composition
    //     Script exits after first guard alert.
    // ------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Center Shape Path Origin' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['Please open a composition and select a shape layer.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (d) GUARD – active comp exists but no layers selected
    // ------------------------------------------------------------------
    {
      name: 'guard – no layers selected',
      kind: 'guard',
      host: guardNoLayerHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Center Shape Path Origin' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['Please select a shape layer.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (e) GUARD – selected layer is not a Shape Layer
    // ------------------------------------------------------------------
    {
      name: 'guard – selected layer is not a Shape Layer',
      kind: 'guard',
      host: guardNotShapeHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Center Shape Path Origin' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['The selected layer is not a Shape Layer.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error('Originator.fixture.js failed self-validation:\n' + _check.errors.join('\n'));
}

export default fixture;
