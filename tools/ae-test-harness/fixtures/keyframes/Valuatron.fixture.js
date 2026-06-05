/**
 * Fixture for Valuatron — Instant Keyframe Creation at Current Time and Value
 *
 * Valuatron is a HEADLESS script (@ui HEADLESS). It executes immediately with no UI.
 * Flow:
 *   1. Guards: no active comp → alert("No composition is active. Please select a composition and try again.")
 *   2. Guards: no selected layers → alert("No layers are selected. Please select layers and try again.")
 *   3. app.beginUndoGroup("Valuatron")
 *   4. For each selected layer → for each selected property where canVaryOverTime:
 *        prop.setValueAtTime(comp.time, prop.value)  → logs setValueAtTime + addKeyframe
 *   5. app.endUndoGroup()
 *
 * The script uses writeLn() (non-mutating) for per-layer progress messages.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Valuatron',
    category: 'keyframes',
    relPath: 'keyframes/Valuatron.jsx',
    ui: false,
  },

  scenarios: [
    // -------------------------------------------------------------------------
    // SUCCESS — Two selected properties on one layer, playhead at t=2s
    // -------------------------------------------------------------------------
    {
      name: 'success — create keyframes for two selected properties at current time',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-1', name: 'Main Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-1',
        comps: [
          {
            id: 'comp-1',
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
                    path: 'Transform',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 6,
                    properties: [
                      {
                        matchName: 'ADBE Position',
                        name: 'Position',
                        path: 'Transform/Position',
                        propertyValueType: 'TwoD',
                        value: [960, 540],
                        canSetExpression: true,
                      },
                      {
                        matchName: 'ADBE Opacity',
                        name: 'Opacity',
                        path: 'Transform/Opacity',
                        propertyValueType: 'OneD',
                        value: 75,
                        canSetExpression: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        selection: {
          layerIds: ['layer-1'],
          propertyPaths: ['Transform/Position', 'Transform/Opacity'],
        },
      },
      // HEADLESS — no UI clicks; just run
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // setValueAtTime logs both setValueAtTime and addKeyframe in harness
        { kind: 'setValueAtTime', target: 'Transform/Position' },
        { kind: 'addKeyframe',    target: 'Transform/Position' },
        { kind: 'setValueAtTime', target: 'Transform/Opacity' },
        { kind: 'addKeyframe',    target: 'Transform/Opacity' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'high',
    },

    // -------------------------------------------------------------------------
    // SUCCESS — Two selected layers, one property each
    // -------------------------------------------------------------------------
    {
      name: 'success — two selected layers, one property each',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-2', name: 'Multi Layer Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Multi Layer Comp',
            width: 1920,
            height: 1080,
            duration: 8,
            frameRate: 30,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-a',
                index: 1,
                name: 'Null A',
                type: 'Null',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 8,
                properties: [
                  {
                    matchName: 'ADBE Transform Group',
                    name: 'Transform',
                    path: 'Transform',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 6,
                    properties: [
                      {
                        matchName: 'ADBE Scale',
                        name: 'Scale',
                        path: 'Transform/Scale',
                        propertyValueType: 'TwoD',
                        value: [100, 100],
                        canSetExpression: true,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'layer-b',
                index: 2,
                name: 'Null B',
                type: 'Null',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 8,
                properties: [
                  {
                    matchName: 'ADBE Transform Group',
                    name: 'Transform',
                    path: 'Transform',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 6,
                    properties: [
                      {
                        matchName: 'ADBE Rotate Z',
                        name: 'Rotation',
                        path: 'Transform/Rotation',
                        propertyValueType: 'OneD',
                        value: 45,
                        canSetExpression: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        selection: {
          layerIds: ['layer-a', 'layer-b'],
          propertyPaths: ['Transform/Scale', 'Transform/Rotation'],
        },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'setValueAtTime', target: 'Transform/Scale' },
        { kind: 'addKeyframe',    target: 'Transform/Scale' },
        { kind: 'setValueAtTime', target: 'Transform/Rotation' },
        { kind: 'addKeyframe',    target: 'Transform/Rotation' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'high',
    },

    // -------------------------------------------------------------------------
    // GUARD — No active composition
    // -------------------------------------------------------------------------
    {
      name: 'guard — no active composition',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [],
        },
        activeItemId: null,
        comps: [],
        selection: {
          layerIds: [],
          propertyPaths: [],
        },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: [
        'No composition is active. Please select a composition and try again.',
      ],
      expectedConfidence: 'high',
    },

    // -------------------------------------------------------------------------
    // GUARD — Comp active but no layers selected
    // -------------------------------------------------------------------------
    {
      name: 'guard — no layers selected',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-3', name: 'Empty Sel Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-3',
        comps: [
          {
            id: 'comp-3',
            name: 'Empty Sel Comp',
            width: 1280,
            height: 720,
            duration: 5,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-x',
                index: 1,
                name: 'AV Layer',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 5,
                properties: [
                  {
                    matchName: 'ADBE Transform Group',
                    name: 'Transform',
                    path: 'Transform',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 6,
                    properties: [
                      {
                        matchName: 'ADBE Position',
                        name: 'Position',
                        path: 'Transform/Position',
                        propertyValueType: 'TwoD',
                        value: [640, 360],
                        canSetExpression: true,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        selection: {
          layerIds: [],
          propertyPaths: [],
        },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: [
        'No layers are selected. Please select layers and try again.',
      ],
      expectedConfidence: 'high',
    },
  ],
};

// Self-validate at module load
const result = validateFixture(fixture);
if (!result.ok) {
  throw new Error(`Valuatron.fixture.js failed validation:\n${result.errors.join('\n')}`);
}

export default fixture;
