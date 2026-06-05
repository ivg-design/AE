import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for Onionizer.jsx
 *
 * Script behaviour summary:
 *  - @ui HEADLESS  (no ScriptUI window — runs inline)
 *  - Includes //@include 'modules/PropQuery.js' → KNOWN-BLOCKED in the test harness
 *    (the static include-scanner will flag blocked:true; functional execution is skipped).
 *
 * Runtime behaviour (when PropQuery is available in real AE):
 *  1. app.beginUndoGroup("Onionizer: The Onionizer for Shape Layers")
 *  2. Guard: no active comp → alert("Please select a composition.") + return
 *  3. Guard: no selected layers → alert("Please select at least one layer.") + return
 *  4. Loops selected layers/properties, builds selectedInfoArray via PropQuery.
 *  5. comp.duplicate() → renames duplicate to "CelSkin".
 *  6. Navigates parentProperty chain in CelSkin comp (no expression writes in v2.0.1).
 *  7. comp.layers.addNull() → controller null named "Onionizer" → createLayer
 *  8. Loop k=0..6: comp.layers.add(celSkinComp) named "CelSkin_k+1",
 *     enables timeRemapEnabled, adds ADBE Stroke + ADBE Fill effects.
 *     → 7× createLayer + property mutations
 *  9. app.endUndoGroup()
 *
 * Because PropQuery is //@include'd the static scanner marks this script as
 * known-blocked. All scenarios carry expectedConfidence:'known-blocked' so the
 * harness skips functional execution and records the block reason.
 */

// ---------------------------------------------------------------------------
// Shared identifiers
// ---------------------------------------------------------------------------
const COMP_ID = 'comp-onion-01';
const SL1_ID  = 'layer-onion-shape-01';
const SL2_ID  = 'layer-onion-shape-02';

// ---------------------------------------------------------------------------
// KNOWN-BLOCKED snapshot — realistic comp with shape layers + selected props.
// This snapshot represents the ideal input; functional execution is skipped.
// ---------------------------------------------------------------------------
const knownBlockedHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Character Anim', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Character Anim',
      width: 1920,
      height: 1080,
      duration: 3,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: SL1_ID,
          index: 1,
          name: 'Arm Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 3,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Arm Shape/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Rotate Z',
                  name: 'Rotation',
                  path: 'Arm Shape/Transform/Rotation',
                  propertyValueType: 'OneD',
                  value: 0,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 0 },
                    { time: 1, value: 45 },
                    { time: 2, value: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: SL2_ID,
          index: 2,
          name: 'Leg Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 3,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Leg Shape/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Rotate Z',
                  name: 'Rotation',
                  path: 'Leg Shape/Transform/Rotation',
                  propertyValueType: 'OneD',
                  value: 0,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 0 },
                    { time: 1, value: -30 },
                    { time: 2, value: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: [SL1_ID, SL2_ID],
    propertyPaths: [
      'Arm Shape/Transform/Rotation',
      'Leg Shape/Transform/Rotation',
    ],
  },
};

// ---------------------------------------------------------------------------
// SUCCESS snapshot (documents expected runtime behaviour for reference;
// confidence is known-blocked — functional runner will skip).
// A realistic comp with one shape layer selected.
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-onion-s', name: 'Walk Cycle', typeName: 'Composition' }],
  },
  activeItemId: 'comp-onion-s',
  comps: [
    {
      id: 'comp-onion-s',
      name: 'Walk Cycle',
      width: 1920,
      height: 1080,
      duration: 2,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-onion-s-01',
          index: 1,
          name: 'Body Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 2,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Body Shape/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Body Shape/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: [960, 540] },
                    { time: 1, value: [980, 540] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: ['layer-onion-s-01'],
    propertyPaths: ['Body Shape/Transform/Position'],
  },
};

// ---------------------------------------------------------------------------
// GUARD snapshot — no active composition
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// GUARD snapshot — active comp but no selected layers
// ---------------------------------------------------------------------------
const guardNoLayersHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-onion-g2', name: 'Empty Selection Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-onion-g2',
  comps: [
    {
      id: 'comp-onion-g2',
      name: 'Empty Selection Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-onion-g2-01',
          index: 1,
          name: 'Unselected Layer',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Unselected Layer/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Unselected Layer/Transform/Position',
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
  // No layers selected
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Onionizer',
    category: 'utilities',
    relPath: 'utilities/Onionizer.jsx',
    ui: false,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) KNOWN-BLOCKED — PropQuery //@include prevents harness execution.
    //     Snapshot is realistic; expectedOperations document what would happen
    //     if PropQuery were available, but the harness will record known-blocked.
    // ------------------------------------------------------------------
    {
      name: 'known-blocked – PropQuery include prevents functional execution',
      kind: 'known-blocked',
      host: knownBlockedHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        // Script begins undo group immediately (before guards)
        { kind: 'beginUndoGroup' },
        // comp.duplicate() → not modelled as a specific op kind; treated as createLayer sequence
        // Controller null "Onionizer" added to original comp
        { kind: 'createLayer', target: 'Onionizer' },
        // 7 CelSkin instances added
        { kind: 'createLayer', target: 'CelSkin_1' },
        { kind: 'createLayer', target: 'CelSkin_2' },
        { kind: 'createLayer', target: 'CelSkin_3' },
        { kind: 'createLayer', target: 'CelSkin_4' },
        { kind: 'createLayer', target: 'CelSkin_5' },
        { kind: 'createLayer', target: 'CelSkin_6' },
        { kind: 'createLayer', target: 'CelSkin_7' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'known-blocked',
    },

    // ------------------------------------------------------------------
    // (b) SUCCESS (known-blocked confidence) — documents expected runtime
    //     behaviour with one shape layer selected.
    //     Cannot be verified without PropQuery.
    // ------------------------------------------------------------------
    {
      name: 'success – single shape layer creates CelSkin + 7 instances + controller null',
      kind: 'known-blocked',
      host: successHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'createLayer', target: 'Onionizer' },
        { kind: 'createLayer', target: 'CelSkin_1' },
        { kind: 'createLayer', target: 'CelSkin_2' },
        { kind: 'createLayer', target: 'CelSkin_3' },
        { kind: 'createLayer', target: 'CelSkin_4' },
        { kind: 'createLayer', target: 'CelSkin_5' },
        { kind: 'createLayer', target: 'CelSkin_6' },
        { kind: 'createLayer', target: 'CelSkin_7' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'known-blocked',
    },

    // ------------------------------------------------------------------
    // (c) GUARD — no active composition (known-blocked confidence because the
    //     harness cannot load the script at all due to PropQuery include).
    //     expectedAlerts records the expected runtime guard message.
    // ------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'known-blocked',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
      ],
      expectedAlerts: ['Please select a composition.'],
      expectedConfidence: 'known-blocked',
    },

    // ------------------------------------------------------------------
    // (d) GUARD — comp active but no layers selected (known-blocked).
    // ------------------------------------------------------------------
    {
      name: 'guard – no selected layers',
      kind: 'known-blocked',
      host: guardNoLayersHost,
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
      ],
      expectedAlerts: ['Please select at least one layer.'],
      expectedConfidence: 'known-blocked',
    },
  ],
};

// Self-check at module load
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error('Onionizer.fixture.js failed self-validation:\n' + _check.errors.join('\n'));
}

export default fixture;
