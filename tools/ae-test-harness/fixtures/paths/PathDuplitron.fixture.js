import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for PathDuplitron.jsx
 *
 * Script behaviour summary:
 *  - @ui PANEL  (opens a "palette" Window via resource string on script load)
 *  - No beginUndoGroup wrapping — individual operations are un-grouped.
 *
 *  Copy button (copyTangents):
 *    Guard: no active comp → alert("Please select a composition.")
 *    Guard: no selected layer → alert("Please select a layer.")
 *    Guard: layer has no Position property → alert("The selected layer does not have a Position property.")
 *    Guard: no keyframes selected on Position → alert("Please select one or more keyframes.")
 *    Success:
 *      1. executeCommand — AE Copy menu command (via findMenuCommandId),
 *         driving AE's native keyframe clipboard (v2.0.1 removed the broken
 *         shape-layer intermediate that wrote invalid values to a SHAPE prop)
 *
 *  Paste button (pasteTangents):
 *    Guard: no active comp → alert("Please select a composition.")
 *    Guard: no selected layer → alert("Please select a layer.")
 *    Guard: layer has no Position property → alert("The selected layer does not have a Position property.")
 *    Guard: no keyframes selected on Position → alert("Please select one or more keyframes.")
 *    Success:
 *      1. executeCommand(20)  — AE Paste command
 *
 *  Close button: closes panel — no AE operations.
 */

// ---------------------------------------------------------------------------
// Shared IDs
// ---------------------------------------------------------------------------
const COMP_ID = 'comp-pathduplitron-01';
const ANIM_LAYER_ID = 'layer-anim-01';
const GUARD_COMP_ID = 'comp-pathduplitron-guard-01';
const GUARD_LAYER_ID = 'layer-guard-01';

// ---------------------------------------------------------------------------
// HostSnapshot – success: layer with 3 position keyframes, 2 selected
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
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: ANIM_LAYER_ID,
          index: 1,
          name: 'Animated Ball',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            // AE exposes layer.property("Position") as a direct shortcut to the
            // Transform's Position. The harness resolves layer.property() against
            // the layer's top-level property children, so the keyframed Position
            // is seeded here (at the layer root) to be reachable as
            // layer.property("Position") — which is exactly how the script reads it.
            {
              matchName: 'ADBE Position',
              name: 'Position',
              path: 'Animated Ball/Transform/Position',
              propertyValueType: 'TwoD',
              value: [960, 540],
              canSetExpression: true,
              keyframes: [
                { time: 0,   value: [200, 540] },
                { time: 2,   value: [960, 200] },
                { time: 4,   value: [1720, 540] },
              ],
            },
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Animated Ball/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Animated Ball/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                  keyframes: [
                    { time: 0,   value: [200, 540] },
                    { time: 2,   value: [960, 200] },
                    { time: 4,   value: [1720, 540] },
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
    layerIds: [ANIM_LAYER_ID],
    // Indicate the first two position keyframes are selected via property path notation
    propertyPaths: ['Animated Ball/Transform/Position'],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot – guard: no active composition
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot – guard: active comp, no layers selected
// ---------------------------------------------------------------------------
const guardNoLayerHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: GUARD_COMP_ID, name: 'Empty Selection Comp', typeName: 'Composition' }],
  },
  activeItemId: GUARD_COMP_ID,
  comps: [
    {
      id: GUARD_COMP_ID,
      name: 'Empty Selection Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: GUARD_LAYER_ID,
          index: 1,
          name: 'Static Layer',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Static Layer/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Static Layer/Transform/Position',
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
// HostSnapshot – guard: layer selected but no keyframes on Position
// ---------------------------------------------------------------------------
const guardNoKeyframesHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-pathduplitron-guard-02', name: 'No Keys Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-pathduplitron-guard-02',
  comps: [
    {
      id: 'comp-pathduplitron-guard-02',
      name: 'No Keys Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-nokeys-01',
          index: 1,
          name: 'Static Ball',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Static Ball/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Static Ball/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                  // No keyframes array — selectedKeys will be empty
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: { layerIds: ['layer-nokeys-01'], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'PathDuplitron',
    category: 'paths',
    relPath: 'paths/PathDuplitron.jsx',
    ui: true,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS – Copy: panel loads, user clicks Copy.
    //     v2.0.1: the script selects the position keyframes and runs the
    //     AE Copy menu command (findMenuCommandId('Copy')), letting AE's
    //     native keyframe clipboard carry full tangent/ease data. The old
    //     shape-layer intermediate (createLayer/setValueAtTime/deleteLayer)
    //     was removed — it wrote invalid values to a SHAPE property and
    //     threw in real AE.
    // ------------------------------------------------------------------
    {
      name: 'success – copy position keyframes via AE copy command',
      kind: 'success',
      host: successHost,
      actions: [
        // Panel auto-shows on script run
        { type: 'run' },
        // Click "Copy" button
        { type: 'click', target: 'Copy' },
      ],
      expectedOperations: [
        // AE Copy menu command drives the native keyframe clipboard
        { kind: 'executeCommand' },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (b) SUCCESS – Paste: user clicks Paste after a prior copy.
    //     Script calls app.executeCommand(20) — AE Paste.
    // ------------------------------------------------------------------
    {
      name: 'success – paste tangents via AE paste command',
      kind: 'success',
      host: successHost,
      actions: [
        { type: 'run' },
        { type: 'click', target: 'Paste' },
      ],
      expectedOperations: [
        // AE internal Paste command
        { kind: 'executeCommand', meta: { commandId: 20 } },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (c) GUARD – Copy clicked with no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard – copy with no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [
        { type: 'run' },
        { type: 'click', target: 'Copy' },
      ],
      expectedOperations: [
        { kind: 'alert' },
      ],
      expectedAlerts: ['Please select a composition.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (d) GUARD – Copy clicked with no layers selected
    // ------------------------------------------------------------------
    {
      name: 'guard – copy with no layer selected',
      kind: 'guard',
      host: guardNoLayerHost,
      actions: [
        { type: 'run' },
        { type: 'click', target: 'Copy' },
      ],
      expectedOperations: [
        { kind: 'alert' },
      ],
      expectedAlerts: ['Please select a layer.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (e) GUARD – Copy clicked but Position has no selected keyframes
    //     (selectedKeys is empty array)
    // ------------------------------------------------------------------
    {
      name: 'guard – copy with no keyframes selected on Position',
      kind: 'guard',
      host: guardNoKeyframesHost,
      actions: [
        { type: 'run' },
        { type: 'click', target: 'Copy' },
      ],
      expectedOperations: [
        { kind: 'alert' },
      ],
      expectedAlerts: ['Please select one or more keyframes.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (f) GUARD – Paste clicked with no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard – paste with no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [
        { type: 'run' },
        { type: 'click', target: 'Paste' },
      ],
      expectedOperations: [
        { kind: 'alert' },
      ],
      expectedAlerts: ['Please select a composition.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error('PathDuplitron.fixture.js failed self-validation:\n' + _check.errors.join('\n'));
}

export default fixture;
