/**
 * Fixture for Distributron — Distribute Layers Along a Shape Path
 *
 * Script: paths/Distributron.jsx
 * UI: HEADLESS (no ScriptUI window; runs entirely inline)
 *
 * What the script does (success path):
 *   1. beginUndoGroup("Distributron")
 *   2. Moves shapeLayer to index 1 if not already there (reorder)
 *   3. Adds a Mask to the shape layer; sets mask path expression
 *   4. Creates a CTRL Null layer
 *   5. Sets CTRL.parent = shapeLayer (setParent)
 *   6. Sets CTRL Position to shapeLayer anchor point (setValue)
 *   7. Writes FFX binary to temp file (fileWrite) and applies it to CTRL (applyPreset)
 *   8. Sets "Distribution Path Layer" slider to shapeLayer index (setValue)
 *   9. Sets "First Layer Index" and "Last Layer Index" values (setValue × 2)
 *  10. For each distributable layer: setParent to CTRL, setExpression on Position, setExpression on Rotation
 *  11. endUndoGroup("Distributron")
 *
 * Guard:
 *   selectedLayers.length !== 1 → alert + endUndoGroup + return
 *
 * Scenarios:
 *   success     — 1 shape layer + 3 distributable layers; all operations logged
 *   guard-nosel — 0 layers selected → guard alert
 *   guard-multi — 2 layers selected → guard alert
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Expression written to every distributable layer's Position and Rotation
// (partial match is sufficient for expectedExpressions)
// ---------------------------------------------------------------------------
const DISTRIBUTION_EXPR_FRAGMENT = 'calcPathLength';

// ---------------------------------------------------------------------------
// Shared host-snapshot builders
// ---------------------------------------------------------------------------

/**
 * Comp with:
 *   layer 1 — ShapeLayer (the selected path layer, index 1)
 *   layers 2-4 — AV layers to be distributed
 */
function successSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-1', name: 'Path Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-1',
    comps: [
      {
        id: 'comp-1',
        name: 'Path Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-shape-1',
            index: 1,
            name: 'Path Shape',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Root Vectors Group',
                name: 'Contents',
                path: 'Path Shape/Contents',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 1,
                properties: [
                  {
                    matchName: 'ADBE Vector Group',
                    name: 'Shape Group 1',
                    path: 'Path Shape/Contents/Shape Group 1',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    properties: [
                      {
                        matchName: 'ADBE Vectors Group',
                        name: 'Contents',
                        path: 'Path Shape/Contents/Shape Group 1/Contents',
                        propertyValueType: 'NoValue',
                        canSetExpression: false,
                        properties: [
                          {
                            matchName: 'ADBE Vector Shape - Group',
                            name: 'Path 1',
                            path: 'Path Shape/Contents/Shape Group 1/Contents/Path 1',
                            propertyValueType: 'NoValue',
                            canSetExpression: false,
                            properties: [
                              {
                                matchName: 'ADBE Vector Shape',
                                name: 'Path',
                                path: 'Path Shape/Contents/Shape Group 1/Contents/Path 1/Path',
                                propertyValueType: 'Shape',
                                canSetExpression: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Path Shape/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                properties: [
                  {
                    matchName: 'ADBE Anchor Point',
                    name: 'Anchor Point',
                    path: 'Path Shape/Transform/Anchor Point',
                    propertyValueType: 'TwoD',
                    value: [0, 0],
                    canSetExpression: true
                  },
                  {
                    matchName: 'ADBE Position',
                    name: 'Position',
                    path: 'Path Shape/Transform/Position',
                    propertyValueType: 'TwoD',
                    value: [960, 540],
                    canSetExpression: true
                  }
                ]
              },
              {
                matchName: 'ADBE Mask Parade',
                name: 'Masks',
                path: 'Path Shape/Masks',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 0,
                properties: []
              },
              {
                matchName: 'ADBE Effect Parade',
                name: 'Effects',
                path: 'Path Shape/Effects',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 0,
                properties: []
              }
            ]
          },
          {
            id: 'layer-av-2',
            index: 2,
            name: 'Item A',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Item A/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                properties: [
                  {
                    matchName: 'ADBE Position',
                    name: 'Position',
                    path: 'Item A/Transform/Position',
                    propertyValueType: 'TwoD',
                    value: [960, 540],
                    canSetExpression: true
                  },
                  {
                    matchName: 'ADBE Rotate Z',
                    name: 'Rotation',
                    path: 'Item A/Transform/Rotation',
                    propertyValueType: 'OneD',
                    value: 0,
                    canSetExpression: true
                  }
                ]
              }
            ]
          },
          {
            id: 'layer-av-3',
            index: 3,
            name: 'Item B',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Item B/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                properties: [
                  {
                    matchName: 'ADBE Position',
                    name: 'Position',
                    path: 'Item B/Transform/Position',
                    propertyValueType: 'TwoD',
                    value: [960, 540],
                    canSetExpression: true
                  },
                  {
                    matchName: 'ADBE Rotate Z',
                    name: 'Rotation',
                    path: 'Item B/Transform/Rotation',
                    propertyValueType: 'OneD',
                    value: 0,
                    canSetExpression: true
                  }
                ]
              }
            ]
          },
          {
            id: 'layer-av-4',
            index: 4,
            name: 'Item C',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Item C/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                properties: [
                  {
                    matchName: 'ADBE Position',
                    name: 'Position',
                    path: 'Item C/Transform/Position',
                    propertyValueType: 'TwoD',
                    value: [960, 540],
                    canSetExpression: true
                  },
                  {
                    matchName: 'ADBE Rotate Z',
                    name: 'Rotation',
                    path: 'Item C/Transform/Rotation',
                    propertyValueType: 'OneD',
                    value: 0,
                    canSetExpression: true
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    // Only the shape layer is selected
    selection: { layerIds: ['layer-shape-1'], propertyPaths: [] }
  };
}

/** 0 layers selected → guard */
function noSelectionSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-2', name: 'Empty Sel Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-2',
    comps: [
      {
        id: 'comp-2',
        name: 'Empty Sel Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-x',
            index: 1,
            name: 'Layer X',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Layer X/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              }
            ]
          }
        ]
      }
    ],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** 2 layers selected → guard */
function multiSelectionSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-3', name: 'Multi Sel Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-3',
    comps: [
      {
        id: 'comp-3',
        name: 'Multi Sel Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-m1',
            index: 1,
            name: 'Shape A',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Shape A/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              }
            ]
          },
          {
            id: 'layer-m2',
            index: 2,
            name: 'Shape B',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Shape B/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              }
            ]
          }
        ]
      }
    ],
    selection: { layerIds: ['layer-m1', 'layer-m2'], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Distributron',
    category: 'paths',
    relPath: 'paths/Distributron.jsx',
    ui: false
  },

  scenarios: [
    // ------------------------------------------------------------------
    // 1. SUCCESS — shape layer at index 1 + 3 AV layers
    // ------------------------------------------------------------------
    {
      name: 'success — distribute 3 layers along shape path',
      kind: 'success',
      host: successSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [
        // Undo group opened
        { kind: 'beginUndoGroup', value: 'Distributron' },

        // Shape layer is already at index 1, no reorder needed.
        // Mask added to shape layer with path expression
        { kind: 'setExpression', target: 'Path Shape/Masks/Mask/Mask Path' },

        // CTRL Null layer created
        { kind: 'createLayer', target: 'CTRL' },

        // CTRL parented to shapeLayer
        { kind: 'setParent', target: 'CTRL' },

        // CTRL Position set to shapeLayer anchor point
        { kind: 'setValue', target: 'CTRL/Transform/Position' },

        // FFX binary written to temp file, applied to CTRL
        { kind: 'fileWrite' },
        { kind: 'applyPreset' },

        // "Distribution Path Layer" pseudo-effect value
        { kind: 'setValue' },

        // First Layer Index = minIndex (2)
        { kind: 'setValue' },

        // Last Layer Index = maxIndex (4)
        { kind: 'setValue' },

        // Item A: setParent to CTRL, expressions on Position + Rotation
        { kind: 'setParent', target: 'Item A' },
        { kind: 'setExpression', target: 'Item A/Transform/Position' },
        { kind: 'setExpression', target: 'Item A/Transform/Rotation' },

        // Item B
        { kind: 'setParent', target: 'Item B' },
        { kind: 'setExpression', target: 'Item B/Transform/Position' },
        { kind: 'setExpression', target: 'Item B/Transform/Rotation' },

        // Item C
        { kind: 'setParent', target: 'Item C' },
        { kind: 'setExpression', target: 'Item C/Transform/Position' },
        { kind: 'setExpression', target: 'Item C/Transform/Rotation' },

        // Undo group closed
        { kind: 'endUndoGroup' }
      ],

      expectedExpressions: [
        // Mask path expression linking to the shape group's path
        {
          targetPath: 'Path Shape/Masks/Mask/Mask Path',
          source: 'literal',
          parseStatus: 'ok'
        },
        // Position expression for distributed layers contains calcPathLength
        {
          targetPath: 'Item A/Transform/Position',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          targetPath: 'Item A/Transform/Rotation',
          source: 'literal',
          parseStatus: 'ok'
        }
      ],

      expectedAlerts: [],

      // Script writes FFX binary + applyPreset; full verification requires AE runtime.
      // Expression parse can be validated statically.
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------
    // 2. GUARD — 0 layers selected
    // ------------------------------------------------------------------
    {
      name: 'guard — no layers selected',
      kind: 'guard',
      host: noSelectionSnapshot(),

      actions: [{ type: 'run' }],

      // beginUndoGroup fires before the guard check in main()
      expectedOperations: [
        { kind: 'beginUndoGroup', value: 'Distributron' },
        { kind: 'endUndoGroup' }
      ],

      expectedAlerts: ['Please select exactly one shape layer with a path.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 3. GUARD — 2 layers selected (not exactly 1)
    // ------------------------------------------------------------------
    {
      name: 'guard — multiple layers selected',
      kind: 'guard',
      host: multiSelectionSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [
        { kind: 'beginUndoGroup', value: 'Distributron' },
        { kind: 'endUndoGroup' }
      ],

      expectedAlerts: ['Please select exactly one shape layer with a path.'],

      expectedConfidence: 'high'
    }
  ]
};

// ---------------------------------------------------------------------------
// Self-validate at module load (throws on schema violation)
// ---------------------------------------------------------------------------
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `[Distributron.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
