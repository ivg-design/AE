import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for RandoMatic.jsx
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (Window "dialog", title "RandoMatic")
 *  - Guard 1: no active comp → alert("Please select a composition") + return
 *  - Guard 2: comp.selectedProperties.length === 0 → alert("Please select some keyframes") + return
 *  - Guard 3 (inline, inside OK handler): non-numeric range input →
 *      alert("Please enter valid numbers for the range") + return (dialog stays open)
 *  - Success flow:
 *      1. Script reads selectedProperties and computes maxDimensionality from property.value
 *      2. Dialog shows X (+ Y for 2D, + Z for 3D) range input rows
 *      3. OK click:
 *           beginUndoGroup("RandoMatic")
 *           for each selected property with selected keyframes:
 *             property.setValueAtKey(keyIndex, randomValue)  → logged as setValue per key
 *           endUndoGroup
 *           win.close()
 *
 * Confidence notes:
 *  - setValue operations use Math.random() so actual values are non-deterministic;
 *    harness can only assert operation kind and target, not exact value → 'medium'.
 *  - Guard scenarios are fully deterministic → 'high'.
 */

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const COMP_ID = 'comp-rando-01';
const LAYER_ID = 'layer-rando-01';

// ---------------------------------------------------------------------------
// HostSnapshot: success — one AV layer with a 2D Position property
// that has 3 keyframes (indices 1-3), all marked selected.
// The property path is in selection.propertyPaths so the script sees it
// in comp.selectedProperties.
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Rando Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Rando Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: LAYER_ID,
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
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Shape Layer 1/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                  keyframes: [
                    { time: 0,   value: [960, 540] },
                    { time: 1.5, value: [960, 300] },
                    { time: 3,   value: [960, 700] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  // Position property is in selectedProperties; all 3 keyframes are selected
  selection: {
    layerIds: [LAYER_ID],
    propertyPaths: ['Shape Layer 1/Transform/Position'],
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
// HostSnapshot: guard — comp active but no selected properties
// ---------------------------------------------------------------------------
const guardNoPropsHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-rando-02', name: 'Empty Sel Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-rando-02',
  comps: [
    {
      id: 'comp-rando-02',
      name: 'Empty Sel Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-rando-02',
          index: 1,
          name: 'Shape Layer 2',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [],
        },
      ],
    },
  ],
  // No properties selected → selectedProperties.length === 0
  selection: { layerIds: ['layer-rando-02'], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'RandoMatic',
    category: 'utilities',
    relPath: 'utilities/RandoMatic.jsx',
    ui: true,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS — 2D Position property, 3 selected keyframes.
    //     Dialog shows X and Y range rows.
    //     OK clicked with valid ranges (X: -50→50, Y: -30→30).
    //     Expected: beginUndoGroup → three setValue operations (one per key) → endUndoGroup.
    //     Values are random so we only assert kind + target.
    // ------------------------------------------------------------------
    {
      name: 'success – randomise 2D Position keyframes in range',
      kind: 'success',
      host: successHost,
      actions: [
        // Dialog appears automatically when script runs.
        // X range row
        { type: 'change', target: 'Start Range X', value: '-50' },
        { type: 'change', target: 'End Range X',   value: '50'  },
        // Y range row
        { type: 'change', target: 'Start Range Y', value: '-30' },
        { type: 'change', target: 'End Range Y',   value: '30'  },
        // Click OK
        { type: 'click', target: 'OK' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'RandoMatic' },
        // setValueAtKey for key 1 → logged as setValue
        { kind: 'setValue', target: 'Shape Layer 1/Transform/Position' },
        // setValueAtKey for key 2
        { kind: 'setValue', target: 'Shape Layer 1/Transform/Position' },
        // setValueAtKey for key 3
        { kind: 'setValue', target: 'Shape Layer 1/Transform/Position' },
        { kind: 'endUndoGroup' },
      ],
      // No expressions written by this script
      expectedExpressions: [],
      // Randomised values are non-deterministic; kind/target assertions are the meaningful check
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (b) GUARD — no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please select a composition'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (c) GUARD — composition active but no selected properties/keyframes
    // ------------------------------------------------------------------
    {
      name: 'guard – no selected keyframes',
      kind: 'guard',
      host: guardNoPropsHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please select some keyframes'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load — throw if the fixture is malformed
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error(
    'RandoMatic.fixture.js failed self-validation:\n' + _check.errors.join('\n')
  );
}

export default fixture;
