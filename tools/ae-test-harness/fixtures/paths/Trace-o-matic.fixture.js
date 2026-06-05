/**
 * Fixture for Trace-o-matic — Mask-to-Shape Layer Converter
 *
 * Script: paths/Trace-o-matic.jsx
 * UI: HEADLESS  (no ScriptUI dialog; runs immediately on execution)
 *
 * Scenarios:
 *   success      — comp with one AV layer that has two animated masks → new shape layer
 *                  created with effect controls, shape groups, expressions wired, keyframes
 *                  copied, undo group opened/closed
 *   guard-nocomp — no active composition → guard alert, zero mutations
 *   guard-nolayer — comp is active but no layers selected → guard alert, zero mutations
 *   guard-nomask  — one layer selected but it has no masks → guard alert, zero mutations
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Shared host-snapshot builders
// ---------------------------------------------------------------------------

/**
 * Comp snapshot with one AV layer that has two animated masks.
 * The layer's masks are represented on the ADBE Mask Parade property.
 */
function maskedLayerSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-1', name: 'Main Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-1',
    comps: [
      {
        id: 'comp-1',
        name: 'Main Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-1',
            index: 1,
            name: 'Animated Footage',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Animated Footage/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              },
              {
                matchName: 'ADBE Mask Parade',
                name: 'Masks',
                path: 'Animated Footage/Masks',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 2,
                properties: [
                  {
                    matchName: 'ADBE Mask Atom',
                    name: 'Mask 1',
                    path: 'Animated Footage/Masks/Mask 1',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    properties: [
                      {
                        matchName: 'ADBE Mask Shape',
                        name: 'Mask Path',
                        path: 'Animated Footage/Masks/Mask 1/Mask Path',
                        propertyValueType: 'Shape',
                        canSetExpression: false,
                        keyframes: [
                          { time: 0, value: { vertices: [[0, 0], [100, 0], [100, 100], [0, 100]], closed: true } },
                          { time: 1, value: { vertices: [[10, 10], [110, 10], [110, 110], [10, 110]], closed: true } }
                        ]
                      },
                      {
                        matchName: 'ADBE Mask Opacity',
                        name: 'Mask Opacity',
                        path: 'Animated Footage/Masks/Mask 1/Mask Opacity',
                        propertyValueType: 'OneD',
                        value: 100,
                        canSetExpression: true,
                        keyframes: [
                          { time: 0, value: 100 },
                          { time: 1, value: 100 }
                        ]
                      }
                    ]
                  },
                  {
                    matchName: 'ADBE Mask Atom',
                    name: 'Mask 2',
                    path: 'Animated Footage/Masks/Mask 2',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    properties: [
                      {
                        matchName: 'ADBE Mask Shape',
                        name: 'Mask Path',
                        path: 'Animated Footage/Masks/Mask 2/Mask Path',
                        propertyValueType: 'Shape',
                        canSetExpression: false,
                        keyframes: [
                          { time: 0, value: { vertices: [[200, 0], [300, 0], [300, 100], [200, 100]], closed: true } },
                          { time: 2, value: { vertices: [[210, 10], [310, 10], [310, 110], [210, 110]], closed: true } }
                        ]
                      },
                      {
                        matchName: 'ADBE Mask Opacity',
                        name: 'Mask Opacity',
                        path: 'Animated Footage/Masks/Mask 2/Mask Opacity',
                        propertyValueType: 'OneD',
                        value: 80,
                        canSetExpression: true,
                        keyframes: [
                          { time: 0, value: 80 },
                          { time: 2, value: 0 }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    selection: { layerIds: ['layer-1'], propertyPaths: [] }
  };
}

/** Snapshot with no active composition */
function noCompSnapshot() {
  return {
    appVersion: '25.0',
    project: { items: [] },
    activeItemId: null,
    comps: [],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** Comp with no layers selected */
function noSelectionSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-2', name: 'Empty Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-2',
    comps: [
      {
        id: 'comp-2',
        name: 'Empty Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: []
      }
    ],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** Comp with one layer selected but it has no masks */
function noMaskSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-3', name: 'No Mask Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-3',
    comps: [
      {
        id: 'comp-3',
        name: 'No Mask Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-3',
            index: 1,
            name: 'Plain Layer',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Plain Layer/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              },
              {
                matchName: 'ADBE Mask Parade',
                name: 'Masks',
                path: 'Plain Layer/Masks',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 0,
                properties: []
              }
            ]
          }
        ]
      }
    ],
    selection: { layerIds: ['layer-3'], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Trace-o-matic',
    category: 'paths',
    relPath: 'paths/Trace-o-matic.jsx',
    ui: false
  },

  scenarios: [
    // ------------------------------------------------------------------
    // 1. SUCCESS — layer with two animated masks → shape layer created
    // ------------------------------------------------------------------
    {
      name: 'success — two masked AV layer → shape layer with effect controls and expressions',
      kind: 'success',
      host: maskedLayerSnapshot(),

      // HEADLESS: no UI interactions, just run the script.
      actions: [{ type: 'run' }],

      expectedOperations: [
        // Undo group opened
        { kind: 'beginUndoGroup', value: 'Trace-o-matic' },

        // New shape layer created
        { kind: 'createLayer', target: 'Shapes from Animated Footage' },

        // Five effect controls added and their default values set
        // Fill Opacity slider → 100
        { kind: 'setValue', target: 'Shapes from Animated Footage/Effects/Fill Opacity/Slider' },
        // Fill Color → [1, 0, 0, 1]
        { kind: 'setValue', target: 'Shapes from Animated Footage/Effects/Fill Color/Color' },
        // Stroke Opacity slider → 100
        { kind: 'setValue', target: 'Shapes from Animated Footage/Effects/Stroke Opacity/Slider' },
        // Stroke Color → [0, 0, 1, 1]
        { kind: 'setValue', target: 'Shapes from Animated Footage/Effects/Stroke Color/Color' },
        // Stroke Width slider → 5
        { kind: 'setValue', target: 'Shapes from Animated Footage/Effects/Stroke Width/Slider' },

        // — Mask 1 shape group: fill and stroke expressions wired —
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Fill/Color' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Fill/Opacity' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Stroke/Color' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Stroke/Opacity' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Stroke/Stroke Width' },

        // Mask 1 path keyframes copied as setValueAtTime
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Shape - Group/ADBE Vector Shape' },
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Shape - Group/ADBE Vector Shape' },

        // Mask 1 opacity keyframes copied
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Transform/Opacity' },
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Transform/Opacity' },

        // — Mask 2 shape group: fill and stroke expressions wired —
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Graphic - Fill/Color' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Graphic - Fill/Opacity' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Graphic - Stroke/Color' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Graphic - Stroke/Opacity' },
        { kind: 'setExpression', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Graphic - Stroke/Stroke Width' },

        // Mask 2 path keyframes copied
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Shape - Group/ADBE Vector Shape' },
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Contents/ADBE Vector Shape - Group/ADBE Vector Shape' },

        // Mask 2 opacity keyframes copied
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Transform/Opacity' },
        { kind: 'setValueAtTime', target: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 2/Transform/Opacity' },

        // Undo group closed
        { kind: 'endUndoGroup' }
      ],

      expectedExpressions: [
        // Fill Color expression links to effect on the new shape layer
        {
          targetPath: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Fill/Color',
          source: 'literal',
          parseStatus: 'ok'
        },
        // Stroke Width expression
        {
          targetPath: 'Shapes from Animated Footage/ADBE Root Vectors Group/Mask 1/Contents/ADBE Vector Graphic - Stroke/Stroke Width',
          source: 'literal',
          parseStatus: 'ok'
        }
      ],

      expectedAlerts: [],

      // Functional behavior depends on AE-only runtime (mask path keyframes, shape layer API,
      // hold interpolation setting), so functional confidence is medium; expression parse is high.
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------
    // 2. GUARD — no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard — no active composition',
      kind: 'guard',
      host: noCompSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [],

      expectedAlerts: ['No comp selected'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 3. GUARD — comp active but no layer selected (zero layers → alert)
    // ------------------------------------------------------------------
    {
      name: 'guard — no layer selected',
      kind: 'guard',
      host: noSelectionSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [],

      expectedAlerts: ['Please select one layer'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 4. GUARD — layer selected but has no masks
    // ------------------------------------------------------------------
    {
      name: 'guard — selected layer has no masks',
      kind: 'guard',
      host: noMaskSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [],

      expectedAlerts: ['No masks in selected layer'],

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
    `[Trace-o-matic.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
