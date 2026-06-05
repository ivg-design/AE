/**
 * Fixture for Centralizer — Path Guide Generation Tool
 *
 * Script: paths/Centralizer.jsx
 * UI: DIALOG (frontmatter @ui DIALOG; runtime uses Window("palette", ...))
 *
 * Scenarios:
 *   success-av       — AV layer selected, no-kbar path → undo group + addGuide calls
 *   guard-nocomp     — no active composition → guard alert, zero mutations
 *   guard-nolayers   — comp active but no layers selected → guard alert, zero mutations
 *   guard-shapempty  — ShapeLayer with no groups → guard alert, zero mutations
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Shared host-snapshot builders
// ---------------------------------------------------------------------------

/** Comp with a single AV layer selected */
function avLayerSnapshot() {
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
            id: 'layer-av-1',
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
                properties: [
                  {
                    matchName: 'ADBE Position',
                    name: 'Position',
                    path: 'Footage Layer/Transform/Position',
                    propertyValueType: 'TwoD',
                    value: [960, 540],
                    canSetExpression: true
                  },
                  {
                    matchName: 'ADBE Scale',
                    name: 'Scale',
                    path: 'Footage Layer/Transform/Scale',
                    propertyValueType: 'TwoD',
                    value: [100, 100],
                    canSetExpression: true
                  }
                ]
              }
            ],
            source: { width: 1920, height: 1080 }
          }
        ]
      }
    ],
    selection: { layerIds: ['layer-av-1'], propertyPaths: [] }
  };
}

/** No active composition */
function noCompSnapshot() {
  return {
    appVersion: '25.0',
    project: { items: [] },
    activeItemId: null,
    comps: [],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** Comp active but no layers selected */
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
        layers: [
          {
            id: 'layer-bg',
            index: 1,
            name: 'BG',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'BG/Transform',
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

/** Comp with a ShapeLayer that has no shape groups (empty Contents) */
function emptyShapeLayerSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-3', name: 'Shape Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-3',
    comps: [
      {
        id: 'comp-3',
        name: 'Shape Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-shape-1',
            index: 1,
            name: 'Empty Shape',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Root Vectors Group',
                name: 'Contents',
                path: 'Empty Shape/Contents',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 0,
                properties: []
              },
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Empty Shape/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              }
            ]
          }
        ]
      }
    ],
    selection: { layerIds: ['layer-shape-1'], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Centralizer',
    category: 'paths',
    relPath: 'paths/Centralizer.jsx',
    ui: true
  },

  scenarios: [
    // ------------------------------------------------------------------
    // 1. SUCCESS — AV layer selected, non-kbar path
    //    Script calls: beginUndoGroup, addGuide (×6 center+bbox), endUndoGroup
    // ------------------------------------------------------------------
    {
      name: 'success — AV layer selected, center and bounding box guides added',
      kind: 'success',
      host: avLayerSnapshot(),

      // For non-Shape layers without kbar, the script skips the UI and goes
      // straight to guide creation.  The 'run' action executes the script body.
      actions: [
        { type: 'run' }
      ],

      expectedOperations: [
        // Undo group opened
        { kind: 'beginUndoGroup', value: 'Add Guides' },

        // addGuide is surfaced as executeCommand (composition-level guide write)
        // Vertical center guide
        { kind: 'executeCommand' },
        // Horizontal center guide
        { kind: 'executeCommand' },
        // Left bounding-box guide (minX = 0)
        { kind: 'executeCommand' },
        // Right bounding-box guide (maxX = layer.width)
        { kind: 'executeCommand' },
        // Top bounding-box guide (minY = 0)
        { kind: 'executeCommand' },
        // Bottom bounding-box guide (maxY = layer.height)
        { kind: 'executeCommand' },

        // Undo group closed
        { kind: 'endUndoGroup' }
      ],

      expectedAlerts: [],

      // addGuide is an AE-only CompItem method; full verification requires AE runtime.
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

      expectedAlerts: ['Please select a layer in a composition.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 3. GUARD — comp active but no layers selected
    // ------------------------------------------------------------------
    {
      name: 'guard — no layers selected',
      kind: 'guard',
      host: noSelectionSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [],

      expectedAlerts: ['Please select a layer.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 4. GUARD — ShapeLayer selected but it has no shape groups
    // ------------------------------------------------------------------
    {
      name: 'guard — shape layer has no shape groups',
      kind: 'guard',
      host: emptyShapeLayerSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [],

      expectedAlerts: ['No shape groups found in the layer.'],

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
    `[Centralizer.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
