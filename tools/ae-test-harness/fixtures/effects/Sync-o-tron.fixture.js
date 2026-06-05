/**
 * Fixture for Sync-o-tron — Advanced Audio Synchronization System
 *
 * Script: effects/Sync-o-tron.jsx
 * UI: PALETTE  (dockable ScriptUI palette — "Sync-o-tron" window)
 *
 * What the script does (TuneSync button onClick):
 *   1. Guards: no active comp → alert; no selected layers → alert; no selected props → alert.
 *   2. app.beginUndoGroup("Create Controls")
 *   3. Looks up the selected property type (1D / 2D / 3D / 4D/Color).
 *   4. For 1D: adds ADBE Dropdown Control to layer.Effects (renamed "*_Easing Type"),
 *              adds 2× ADBE Slider Control (renamed "*_Min Output" / "*_Max Output"),
 *              resolves the property by address and sets a generated expression.
 *   5. For 2D: same pattern + up to 4 sliders depending on X/Y/Unified dialog.
 *   6. For 3D: same pattern + up to 6 sliders depending on X/Y/Z/Unified dialog.
 *   7. For 4D (Color): adds Dropdown + 2× Color Control; sets color expression.
 *   8. app.endUndoGroup()
 *
 * Audio Reactor comp must be present in the project (name contains "AUDIO REACTOR").
 *
 * Scenarios:
 *   success-1d     — comp active, 1D property selected, "AUDIO REACTOR" comp present →
 *                    undo group, 3 effect-property creates (logged as setValue for names),
 *                    setExpression on the target property, undo group closed.
 *   guard-nocomp   — no active composition → alert, zero mutations.
 *   guard-nolayer  — comp active but no layer selected → alert, zero mutations.
 *   guard-noprop   — comp + layer active but no property selected → alert, zero mutations.
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Host-snapshot builders
// ---------------------------------------------------------------------------

/**
 * Comp with one AV layer that has Opacity (1D) selected, and an AUDIO REACTOR comp.
 */
function successSnapshot1D() {
  return {
    appVersion: '25.0',
    project: {
      items: [
        { id: 'comp-main', name: 'Main Comp', typeName: 'Composition' },
        { id: 'comp-reactor', name: 'AUDIO REACTOR - Kick', typeName: 'Composition' }
      ]
    },
    activeItemId: 'comp-main',
    comps: [
      {
        id: 'comp-main',
        name: 'Main Comp',
        width: 1920,
        height: 1080,
        duration: 10,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-1',
            index: 1,
            name: 'Shape Layer 1',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 10,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Shape Layer 1/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 6,
                properties: [
                  {
                    matchName: 'ADBE Opacity',
                    name: 'Opacity',
                    path: 'Shape Layer 1/Transform/Opacity',
                    propertyValueType: 'OneD',
                    value: 100,
                    canSetExpression: true
                  }
                ]
              },
              {
                matchName: 'ADBE Effect Parade',
                name: 'Effects',
                path: 'Shape Layer 1/Effects',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 0,
                properties: []
              }
            ]
          }
        ]
      },
      {
        id: 'comp-reactor',
        name: 'AUDIO REACTOR - Kick',
        width: 1920,
        height: 1080,
        duration: 10,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'reactor-layer-1',
            index: 1,
            name: 'Select Frequency',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 10,
            properties: []
          }
        ]
      }
    ],
    // Opacity property on layer 1 is selected
    selection: {
      layerIds: ['layer-1'],
      propertyPaths: ['Shape Layer 1/Transform/Opacity']
    }
  };
}

/** No active composition. */
function noCompSnapshot() {
  return {
    appVersion: '25.0',
    project: { items: [] },
    activeItemId: null,
    comps: [],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** Active comp, but no layer selected. */
function noLayerSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [
        { id: 'comp-a', name: 'Main Comp', typeName: 'Composition' },
        { id: 'comp-r', name: 'AUDIO REACTOR - Bass', typeName: 'Composition' }
      ]
    },
    activeItemId: 'comp-a',
    comps: [
      {
        id: 'comp-a',
        name: 'Main Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-a1',
            index: 1,
            name: 'Shape Layer 1',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: []
          }
        ]
      },
      {
        id: 'comp-r',
        name: 'AUDIO REACTOR - Bass',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: []
      }
    ],
    // No layers selected
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** Active comp + layer selected, but no property selected. */
function noPropSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [
        { id: 'comp-b', name: 'Main Comp', typeName: 'Composition' },
        { id: 'comp-rb', name: 'AUDIO REACTOR - Snare', typeName: 'Composition' }
      ]
    },
    activeItemId: 'comp-b',
    comps: [
      {
        id: 'comp-b',
        name: 'Main Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            id: 'layer-b1',
            index: 1,
            name: 'Shape Layer 1',
            type: 'Shape',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Shape Layer 1/Transform',
                propertyValueType: 'NoValue',
                canSetExpression: false
              }
            ]
          }
        ]
      },
      {
        id: 'comp-rb',
        name: 'AUDIO REACTOR - Snare',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: []
      }
    ],
    // Layer selected, but no properties
    selection: { layerIds: ['layer-b1'], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Sync-o-tron',
    category: 'effects',
    relPath: 'effects/Sync-o-tron.jsx',
    ui: true
  },

  scenarios: [
    // ------------------------------------------------------------------
    // 1. SUCCESS — 1D property (Opacity) synced to AUDIO REACTOR comp
    // ------------------------------------------------------------------
    {
      name: 'success — sync 1D property (Opacity) to audio reactor',
      kind: 'success',
      host: successSnapshot1D(),

      actions: [
        // The palette populates its dropdown with "AUDIO REACTOR - Kick".
        // Simulate selecting it (it should already be the first/only item).
        { type: 'select', target: 'dropdown', value: 'AUDIO REACTOR - Kick' },
        // Click TuneSync to trigger the sync logic.
        { type: 'click', target: 'tuneSyncButton' },
        // For a 1D property the script skips the XY/XYZ dialog and goes straight
        // to handle1DProperty → no further dialog interaction needed.
        // Final sentinel: execute the full script body.
        { type: 'run' }
      ],

      // The host simulation captures:
      //   beginUndoGroup("Create Controls")
      //   3 × setValue for effect-property name assignments (Dropdown + 2 Sliders)
      //   setExpression on the Opacity property
      //   endUndoGroup
      //
      // Note: layer.Effects.addProperty() is an AE-only API; the harness host
      // represents the name-setting side-effect as setValue operations on the
      // effect property path. The expression write is the most reliably captured op.
      expectedOperations: [
        { kind: 'beginUndoGroup', value: 'Create Controls' },

        // Easing Type dropdown control added and renamed
        { kind: 'setValue', target: 'Shape Layer 1/Effects/Opacity_Easing Type' },

        // Min Output slider added and renamed
        { kind: 'setValue', target: 'Shape Layer 1/Effects/Opacity_Min Output' },

        // Max Output slider added and renamed
        { kind: 'setValue', target: 'Shape Layer 1/Effects/Opacity_Max Output' },

        // Expression applied to the Opacity property
        {
          kind: 'setExpression',
          target: 'Shape Layer 1/Transform/Opacity'
        },

        { kind: 'endUndoGroup' }
      ],

      expectedExpressions: [
        {
          // build1DExpression produces a literal string referencing the AUDIO REACTOR comp
          targetPath: 'Shape Layer 1/Transform/Opacity',
          source: 'literal',
          // Expression references runtime layer/effect names — parse is structurally ok
          // but cannot be fully resolved without live AE context
          parseStatus: 'ok'
        }
      ],

      // No alerts on the happy path
      expectedAlerts: [],

      // Effect property creation (addProperty) and expression writes depend on the AE
      // host; the generated expression string itself is verifiable statically.
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------
    // 2. GUARD — no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard — no active composition',
      kind: 'guard',
      host: noCompSnapshot(),

      actions: [
        { type: 'click', target: 'tuneSyncButton' },
        { type: 'run' }
      ],

      expectedOperations: [],

      expectedAlerts: ['No composition is active.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 3. GUARD — comp active but no layer selected
    // ------------------------------------------------------------------
    {
      name: 'guard — no layer selected',
      kind: 'guard',
      host: noLayerSnapshot(),

      actions: [
        { type: 'click', target: 'tuneSyncButton' },
        { type: 'run' }
      ],

      expectedOperations: [],

      expectedAlerts: ['No layer is selected.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------
    // 4. GUARD — layer selected but no property selected
    // ------------------------------------------------------------------
    {
      name: 'guard — no property selected',
      kind: 'guard',
      host: noPropSnapshot(),

      actions: [
        { type: 'click', target: 'tuneSyncButton' },
        { type: 'run' }
      ],

      expectedOperations: [],

      expectedAlerts: ['No property is selected.'],

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
    `[Sync-o-tron.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
