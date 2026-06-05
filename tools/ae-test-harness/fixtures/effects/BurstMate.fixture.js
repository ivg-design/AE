/**
 * Fixture for BurstMate — Stroke Burst Effect Generator
 *
 * Script: effects/BurstMate.jsx
 * UI: HEADLESS  (no ScriptUI; runs entirely via try/catch wrapper)
 *
 * What the script does:
 *   1. Guards: requires app.project.activeItem to be a CompItem; alerts + returns otherwise.
 *   2. Creates "BURST CTRL" shape layer; writes several setValue calls for rect/stroke props.
 *   3. Writes FFX binary to a temp file (fileWrite) and calls layer.applyPreset() twice —
 *      once for the StrokeBurst FFX, once for the Void FFX.
 *   4. Creates "Stroke 1" shape layer; sets path, stroke properties, keyframes (setValuesAtTimes),
 *      repeater copies, rotation, position, scale, rotation-Z.
 *   5. Creates "Stroke 2" shape layer with the same pattern.
 *   6. Wires ~15+ expression assignments across the three shape layers.
 *   7. Wraps everything in beginUndoGroup("BurstMate") / endUndoGroup().
 *
 * Scenarios:
 *   success      — active comp with one AV layer → all three shape layers created, presets applied,
 *                  expressions set, undo group closed
 *   guard-nocomp — no active composition → guard alert, zero mutations
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Host snapshot helpers
// ---------------------------------------------------------------------------

/** Minimal comp with one AV layer (selection not required by the script) */
function activeCompSnapshot() {
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
            name: 'Background',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 5,
            properties: [
              {
                matchName: 'ADBE Transform Group',
                name: 'Transform',
                path: 'Background/Transform',
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

/** No active composition — triggers the guard */
function noCompSnapshot() {
  return {
    appVersion: '25.0',
    project: { items: [] },
    activeItemId: null,
    comps: [],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'BurstMate',
    category: 'effects',
    relPath: 'effects/BurstMate.jsx',
    ui: false
  },

  scenarios: [
    // ------------------------------------------------------------------------
    // 1. SUCCESS — active comp, three shape layers created + presets applied
    // ------------------------------------------------------------------------
    {
      name: 'success — burst layers created on active comp',
      kind: 'success',
      host: activeCompSnapshot(),

      actions: [
        // HEADLESS: no UI interaction needed; just run the script.
        { type: 'run' }
      ],

      expectedOperations: [
        // Undo group opened
        { kind: 'beginUndoGroup', value: 'BurstMate' },

        // BURST CTRL shape layer created
        { kind: 'createLayer', target: 'BURST CTRL' },

        // Several setValue calls on BURST CTRL (rect size, rect position, stroke color, width, dashes)
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },

        // StrokeBurst FFX binary written to temp file, then applied as preset
        { kind: 'fileWrite' },
        { kind: 'applyPreset' },

        // After applyPreset, additional setValue calls configuring StrokeBurst effect parameters
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },

        // Void FFX binary written + applied as preset
        { kind: 'fileWrite' },
        { kind: 'applyPreset' },

        // Stroke 1 shape layer created
        { kind: 'createLayer', target: 'Stroke 1' },

        // Stroke 1 path setValue + stroke color + stroke width + line cap/join + dashes + keyframes
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },

        // Stroke 1 Start keyframes (setValuesAtTimes → addKeyframe entries)
        { kind: 'addKeyframe' },
        { kind: 'addKeyframe' },

        // Stroke 1 End keyframes
        { kind: 'addKeyframe' },
        { kind: 'addKeyframe' },

        // Stroke 1 repeater + transform
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },

        // Stroke 2 shape layer created
        { kind: 'createLayer', target: 'Stroke 2' },

        // Stroke 2 path + stroke props + dashes
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },

        // Stroke 2 Start keyframes
        { kind: 'addKeyframe' },
        { kind: 'addKeyframe' },

        // Stroke 2 End keyframes
        { kind: 'addKeyframe' },
        { kind: 'addKeyframe' },

        // Stroke 2 repeater + transform
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },

        // Expressions on BURST CTRL
        { kind: 'setExpression', target: 'BURST CTRL/ADBE Root Vectors Group/1/2/1/ADBE Vector Rect Size' },
        { kind: 'setExpression', target: 'BURST CTRL/ADBE Root Vectors Group/1/2/1/ADBE Vector Rect Position' },
        { kind: 'setExpression', target: 'BURST CTRL/ADBE Root Vectors Group/1/2/2/ADBE Vector Stroke Width' },

        // Expressions on Stroke 1
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/1/ADBE Vector Shape' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/2/ADBE Vector Stroke Color' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/2/ADBE Vector Stroke Width' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Dash 1' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Gap 1' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Dash 2' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Gap 2' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/3/ADBE Vector Repeater Copies' },
        { kind: 'setExpression', target: 'Stroke 1/ADBE Root Vectors Group/3/4/ADBE Vector Repeater Rotation' },

        // Expressions on Stroke 2
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/1/ADBE Vector Shape' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/2/ADBE Vector Stroke Color' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/2/ADBE Vector Stroke Width' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Dash 1' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Gap 1' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Dash 2' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/1/2/2/9/ADBE Vector Stroke Gap 2' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/3/ADBE Vector Repeater Copies' },
        { kind: 'setExpression', target: 'Stroke 2/ADBE Root Vectors Group/3/4/ADBE Vector Repeater Rotation' },
        { kind: 'setExpression', target: 'Stroke 2/Transform/Rotation' },

        // Undo group closed
        { kind: 'endUndoGroup' }
      ],

      expectedExpressions: [
        {
          // BURST CTRL rect size references the Void effect
          targetPath: 'BURST CTRL/ADBE Root Vectors Group/1/2/1/ADBE Vector Rect Size',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          // Stroke 1 shape expression references BURST CTRL layer and StrokeBurst effect
          targetPath: 'Stroke 1/ADBE Root Vectors Group/1/2/1/ADBE Vector Shape',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          // Stroke 1 color driven by StrokeBurst effect on BURST CTRL
          targetPath: 'Stroke 1/ADBE Root Vectors Group/1/2/2/ADBE Vector Stroke Color',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          // Stroke 2 rotation offset driven by Stroke 1 rotation + StrokeBurst param
          targetPath: 'Stroke 2/Transform/Rotation',
          source: 'literal',
          parseStatus: 'ok'
        }
      ],

      expectedAlerts: [],

      // applyPreset depends on AE runtime; expressions and setValue calls are verifiable statically
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------------
    // 2. GUARD — no active composition
    // ------------------------------------------------------------------------
    {
      name: 'guard — no active composition',
      kind: 'guard',
      host: noCompSnapshot(),

      actions: [{ type: 'run' }],

      // Script alerts immediately and returns; no undo group is opened, no layers created
      expectedOperations: [],

      expectedAlerts: ['Please select a composition first'],

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
    `[BurstMate.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
