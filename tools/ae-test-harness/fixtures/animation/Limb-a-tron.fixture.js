/**
 * Fixture for Limb-a-tron — Advanced IK Limb System
 *
 * Script: animation/Limb-a-tron.jsx
 * UI: DIALOG  (name-input dialog on creation; bake-confirm dialog on bake mode)
 *
 * Scenarios:
 *   success      — empty comp, user types limb name, clicks OK → shape + null layers created,
 *                  FFX written+applied, expressions wired, undo group closed
 *   guard-nocomp — no active composition → guard alert, zero mutations
 *   guard-badsel — layers selected but none are a Limb-a-tron rig → guard alert, zero mutations
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Shared host-snapshot builders
// ---------------------------------------------------------------------------

/** Minimal comp with no layers — used for creation path */
function emptyCompSnapshot() {
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
        layers: []
      }
    ],
    selection: { layerIds: [], propertyPaths: [] }
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

/** Snapshot with a non-rig AV layer selected */
function badSelectionSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-2', name: 'Rig Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-2',
    comps: [
      {
        id: 'comp-2',
        name: 'Rig Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-1',
            index: 1,
            name: 'Some Shape',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Some Shape/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              }
            ]
          }
        ]
      }
    ],
    selection: { layerIds: ['layer-1'], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Limb-a-tron',
    category: 'animation',
    relPath: 'animation/Limb-a-tron.jsx',
    ui: true
  },

  scenarios: [
    // ------------------------------------------------------------------
    // 1. SUCCESS — create a new limb rig
    // ------------------------------------------------------------------
    {
      name: 'success — create new limb rig',
      kind: 'success',
      host: emptyCompSnapshot(),

      // User fills in the name dialog then clicks OK; harness runs the script.
      actions: [
        // The script shows a 'Name the Limb' dialog whose single edittext is created
        // empty and unnamed (`win.add('edittext', undefined, '')`). The harness
        // resolves controls by name/text; the field's only stable handle is its
        // (empty) text, so an empty-string target seeds it before the modal show()
        // fires OK. This is the modeled "user types the limb name" interaction.
        { type: 'type', target: '', value: 'Arm' },
        // Click OK (button text 'OK') to confirm the name and trigger rig creation.
        { type: 'click', target: 'OK' },
        // Final sentinel: execute the full script body.
        { type: 'run' }
      ],

      expectedOperations: [
        // Undo group opened
        { kind: 'beginUndoGroup', value: 'Limb-a-tron' },

        // Shape layer created for the limb body
        { kind: 'createLayer', target: 'Arm' },

        // Position of shape layer set to comp centre
        { kind: 'setValue', target: 'Arm/Transform/Position' },

        // Null (controller) layer created
        { kind: 'createLayer', target: 'Arm CTRL' },

        // Controller position set slightly below comp centre
        { kind: 'setValue', target: 'Arm CTRL/Transform/Position' },

        // FFX binary written to temp file, then applied as preset to the null layer
        { kind: 'fileWrite' },
        { kind: 'applyPreset' },

        // Expressions wired: shape-layer paths
        { kind: 'setExpression', target: 'Arm/ADBE Root Vectors Group/Regular Limb/ADBE Vectors Group/Path 1/ADBE Vector Shape' },
        { kind: 'setExpression', target: 'Arm/ADBE Root Vectors Group/Regular Limb/ADBE Vectors Group/ADBE Vector Graphic - Fill/ADBE Vector Fill Color' },
        { kind: 'setExpression', target: 'Arm/ADBE Root Vectors Group/Regular Limb/ADBE Vectors Group/ADBE Vector Graphic - Fill/ADBE Vector Fill Opacity' },
        { kind: 'setExpression', target: 'Arm/ADBE Root Vectors Group/Noodle Limb/ADBE Vectors Group/Path 1/ADBE Vector Shape' },
        { kind: 'setExpression', target: 'Arm/ADBE Root Vectors Group/Noodle Limb/ADBE Vectors Group/ADBE Vector Graphic - Fill/ADBE Vector Fill Color' },
        { kind: 'setExpression', target: 'Arm/ADBE Root Vectors Group/Noodle Limb/ADBE Vectors Group/ADBE Vector Graphic - Fill/ADBE Vector Fill Opacity' },

        // Expressions wired: controller null pseudo-effect properties
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/Elbow (comp space)' },
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/Elbow (layer space)' },
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/Wrist  (comp space)' },
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/Wrist  (layer space)' },
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/IK Angles' },
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/Adjusted U/L Limb Lengths' },
        { kind: 'setExpression', target: 'Arm CTRL/Effects/Arm Limb Control/Proximity / Pop Prevent Factor' },

        // Undo group closed
        { kind: 'endUndoGroup' }
      ],

      expectedExpressions: [
        // The regularLimbExpression references the CTRL layer by name
        {
          targetPath: 'Arm/ADBE Root Vectors Group/Regular Limb/ADBE Vectors Group/Path 1/ADBE Vector Shape',
          source: 'literal',
          parseStatus: 'ok'
        },
        // IK Angles expression on the controller
        {
          targetPath: 'Arm CTRL/Effects/Arm Limb Control/IK Angles',
          source: 'literal',
          parseStatus: 'ok'
        }
      ],

      // No alerts expected on the happy path
      expectedAlerts: [],

      // The script writes expressions and applies an FFX preset — both depend on AE internals,
      // so functional confidence is medium; static and expression parse checks are high.
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

      expectedAlerts: ['Please select a composition.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 3. GUARD — layers selected but not a Limb-a-tron rig
    // ------------------------------------------------------------------
    {
      name: 'guard — selected layer is not a Limb-a-tron rig',
      kind: 'guard',
      host: badSelectionSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [],

      expectedAlerts: [
        'The selected layer is not part of a Limb-a-tron rig. Deselect all layers to create a new limb.'
      ],

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
    `[Limb-a-tron.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
