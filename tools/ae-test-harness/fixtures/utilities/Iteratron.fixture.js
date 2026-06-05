import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for Iteratron.jsx
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (Window "palette" — shows on load, stays open until OK/Cancel)
 *  - Palette has two property-link buttons (startButton / endButton) and OK/Cancel.
 *  - "Link Start Property" button: captures selectedLayers[0].index + selectedProperties path.
 *  - "Link End Property" button: captures selectedLayers[0].index + selectedProperties path.
 *  - OK button:
 *      1. app.beginUndoGroup("Link Properties")
 *      2. Validates start/end properties; alerts and returns on failure.
 *      3. Validates start/end layers (locked/hidden); alerts and returns.
 *      4. Counts valid (unlocked+enabled) layers between start index and end index;
 *         alerts if zero valid intermediate layers.
 *      5. For each valid intermediate layer:
 *           - Resolves the same property path on that layer.
 *           - If property.numKeys > 0 → setValueAtTime(currentTime, interpolatedValue)
 *           - Otherwise           → setValue(interpolatedValue)
 *      6. app.endUndoGroup()
 *      7. myPanel.close()
 *
 * Guard cases:
 *  - No active comp / no layers: alert on missing start/end property.
 *  - No valid intermediate layers: alert("No valid layers found between start and end layers.")
 *
 * Confidence: medium — setValue/setValueAtTime paths depend on AE property internals.
 */

// ---------------------------------------------------------------------------
// Shared identifiers
// ---------------------------------------------------------------------------
const COMP_ID = 'comp-iter-01';
const L1_ID   = 'layer-iter-01'; // index 1 — start layer
const L2_ID   = 'layer-iter-02'; // index 2 — middle layer (will receive interpolated value)
const L3_ID   = 'layer-iter-03'; // index 3 — middle layer 2
const L4_ID   = 'layer-iter-04'; // index 4 — end layer

// Common position property reused across layers
function positionProp(layerName, value) {
  return {
    matchName: 'ADBE Transform Group',
    name: 'Transform',
    path: `${layerName}/Transform`,
    propertyValueType: 'NoValue',
    canSetExpression: false,
    numProperties: 5,
    properties: [
      {
        matchName: 'ADBE Position',
        name: 'Position',
        path: `${layerName}/Transform/Position`,
        propertyValueType: 'TwoD',
        value: value,
        canSetExpression: true,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// SUCCESS snapshot
// Four AV layers; start=layer 1 (x=0), end=layer 4 (x=300).
// Two intermediate layers (2 and 3) will receive x=100 and x=200.
// No keyframes → script will call setValue.
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Motion Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Motion Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: L1_ID,
          index: 1,
          name: 'Ball A',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [positionProp('Ball A', [0, 540])],
        },
        {
          id: L2_ID,
          index: 2,
          name: 'Ball B',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [positionProp('Ball B', [960, 540])],
        },
        {
          id: L3_ID,
          index: 3,
          name: 'Ball C',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [positionProp('Ball C', [960, 540])],
        },
        {
          id: L4_ID,
          index: 4,
          name: 'Ball D',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [positionProp('Ball D', [1920, 540])],
        },
      ],
    },
  ],
  // Layer 1 selected so the startButton click captures index 1 + Position path.
  // (End button click will change selection to layer 4 in actions.)
  selection: {
    layerIds: [L1_ID],
    propertyPaths: ['Ball A/Transform/Position'],
  },
};

// ---------------------------------------------------------------------------
// SUCCESS — keyframe variant (numKeys > 0 → setValueAtTime)
// Same topology but Ball B has 2 keyframes on Position.
// ---------------------------------------------------------------------------
const L1K_ID = 'layer-kf-01';
const L2K_ID = 'layer-kf-02';
const L3K_ID = 'layer-kf-03';

const successKeyframeHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-iter-kf', name: 'Keyframe Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-iter-kf',
  comps: [
    {
      id: 'comp-iter-kf',
      name: 'Keyframe Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: L1K_ID,
          index: 1,
          name: 'Dot Start',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Dot Start/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Dot Start/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 0,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 0 },
                    { time: 5, value: 0 },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: L2K_ID,
          index: 2,
          name: 'Dot Mid',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Dot Mid/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Dot Mid/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 50,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 50 },
                    { time: 5, value: 50 },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: L3K_ID,
          index: 3,
          name: 'Dot End',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Dot End/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Dot End/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 100,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 100 },
                    { time: 5, value: 100 },
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
    layerIds: [L1K_ID],
    propertyPaths: ['Dot Start/Transform/Opacity'],
  },
};

// ---------------------------------------------------------------------------
// GUARD — no active composition
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// GUARD — only two layers (no intermediate layers between them)
// ---------------------------------------------------------------------------
const guardNoMidLayersHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-iter-g2', name: 'Two Layer Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-iter-g2',
  comps: [
    {
      id: 'comp-iter-g2',
      name: 'Two Layer Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-g2-01',
          index: 1,
          name: 'Layer Alpha',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [positionProp('Layer Alpha', [0, 540])],
        },
        {
          id: 'layer-g2-02',
          index: 2,
          name: 'Layer Beta',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [positionProp('Layer Beta', [1920, 540])],
        },
      ],
    },
  ],
  selection: {
    layerIds: ['layer-g2-01'],
    propertyPaths: ['Layer Alpha/Transform/Position'],
  },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Iteratron',
    category: 'utilities',
    relPath: 'utilities/Iteratron.jsx',
    ui: true,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS — 2D Position distributed across 2 intermediate layers
    //     No keyframes → script calls setValue on each middle layer.
    //     Layer range: index 1 (start) → index 4 (end).
    //     stepValue = (1920 - 0) / (2 + 1) = 640 for x; y stays 540.
    // ------------------------------------------------------------------
    {
      name: 'success – 2D Position distributed setValue across 2 intermediate layers',
      kind: 'success',
      host: successHost,
      actions: [
        // The palette is non-modal: on myPanel.show() the harness auto-fires every
        // actionable button once. With the initial selection (layer 1 + Position)
        // that captures BOTH endpoints as layer 1 — startLayerIndex = endLayerIndex = 1
        // (the auto-fire OK then alerts "No valid layers" and returns without closing
        // the palette, so we can keep driving it).
        //
        // The start/end buttons render identical emoji text ("⚪️" → "🟢" after the
        // auto-fire), so the action driver resolves the first matching green button.
        // Re-selecting layer 4 and re-firing that button re-captures one endpoint as
        // layer 4, giving the bracket [1, 4] (the script uses min/max of the two
        // indices). Layers 2 and 3 are the valid intermediates that receive values.
        { type: 'selectLayers', value: [L4_ID] },
        { type: 'selectProperties', value: ['Ball D/Transform/Position'] },
        { type: 'click', target: '🟢' },
        // Click OK to execute the distribution across the [1, 4] bracket.
        { type: 'click', target: 'OK' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Link Properties' },
        // Middle layer 2 (Ball B): Position interpolated → setValue
        { kind: 'setValue', target: 'Ball B/Transform/Position' },
        // Middle layer 3 (Ball C): Position interpolated → setValue
        { kind: 'setValue', target: 'Ball C/Transform/Position' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (b) SUCCESS — 1D Opacity with keyframes → setValueAtTime
    //     start=0, end=100, 1 middle layer → step = 50.
    // ------------------------------------------------------------------
    {
      name: 'success – 1D Opacity with keyframes uses setValueAtTime',
      kind: 'success',
      host: successKeyframeHost,
      actions: [
        // Same driving pattern as the 2D case: the palette auto-fire captures both
        // endpoints as layer 1 (Dot Start / Opacity). Re-selecting layer 3 and
        // re-firing the first green link button re-captures one endpoint as layer 3,
        // bracketing [1, 3]. Layer 2 (Dot Mid) is the lone valid intermediate, and
        // because it carries keyframes the script writes via setValueAtTime.
        { type: 'selectLayers', value: [L3K_ID] },
        { type: 'selectProperties', value: ['Dot End/Transform/Opacity'] },
        { type: 'click', target: '🟢' },
        { type: 'click', target: 'OK' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Link Properties' },
        // Dot Mid has keyframes → setValueAtTime
        { kind: 'setValueAtTime', target: 'Dot Mid/Transform/Opacity' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (c) GUARD — no active composition
    //     Script calls alert() and the UI never reaches OK.
    //     No undo group is opened.
    // ------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Invalid start or end property. Please make sure both are selected.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (d) GUARD — only two layers, no valid intermediate layers
    //     After linking start and end the script detects numLayers === 0.
    // ------------------------------------------------------------------
    {
      name: 'guard – no intermediate layers between start and end',
      kind: 'guard',
      host: guardNoMidLayersHost,
      actions: [
        { type: 'selectLayers', value: ['layer-g2-01'] },
        { type: 'selectProperties', value: ['Layer Alpha/Transform/Position'] },
        { type: 'click', target: 'Link Start Property' },
        { type: 'selectLayers', value: ['layer-g2-02'] },
        { type: 'selectProperties', value: ['Layer Beta/Transform/Position'] },
        { type: 'click', target: 'Link End Property' },
        { type: 'click', target: 'OK' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Link Properties' },
      ],
      expectedAlerts: ['No valid layers found between start and end layers.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error('Iteratron.fixture.js failed self-validation:\n' + _check.errors.join('\n'));
}

export default fixture;
