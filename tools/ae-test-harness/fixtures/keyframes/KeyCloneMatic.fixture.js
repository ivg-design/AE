/**
 * Fixture for KeyCloneMatic — Advanced Keyframe Duplication and Distribution System
 *
 * KeyCloneMatic is a DIALOG script (@ui DIALOG). It calls app.beginUndoGroup() at the
 * top level (before the dialog opens), shows a Window('dialog') to collect interval,
 * repetitions, comp-duration, temporal-decay, decay-duration, and decay-type settings,
 * then calls duplicateKeyframesAcrossLayers() which:
 *   1. Guards: no active comp → alert('No active composition selected.')
 *   2. Guards: no selected keyframes → alert('No keyframes selected.')
 *   3. Iterates over selected layers → selected properties → selected keyframes,
 *      clones each keyframe via property.addKey() + setValueAtKey() + interpolation
 *      restoration (addKeyframe operations).
 *   4. Calls app.endUndoGroup() at the very bottom of the script.
 *
 * Note: app.beginUndoGroup runs unconditionally at script start; app.endUndoGroup runs
 * unconditionally at the end regardless of guard path.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'KeyCloneMatic',
    category: 'keyframes',
    relPath: 'keyframes/KeyCloneMatic.jsx',
    ui: true,
  },

  scenarios: [
    // -------------------------------------------------------------------------
    // SUCCESS — Duplicate 2 selected keyframes, 3 repetitions, interval 24 frames
    // (linear, no temporal decay)
    // -------------------------------------------------------------------------
    {
      name: 'success — duplicate 2 keyframes x3 reps at 24f interval (linear, no decay)',
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
            duration: 20,
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
                outPoint: 20,
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
                        keyframes: [
                          { time: 0, value: [100, 540] },
                          { time: 1, value: [500, 540] },
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
          layerIds: ['layer-1'],
          propertyPaths: ['Transform/Position'],
        },
      },
      // Dialog: set interval=24, repetitions=3, no comp duration, no decay
      // Decay type default=Linear
      actions: [
        { type: 'change', target: 'intervalInput',      value: '24' },
        { type: 'change', target: 'repetitionsInput',   value: '3' },
        { type: 'click',  target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // Each clone = addKeyframe (property.addKey) then setValue (setValueAtKey).
        // The host's seeded Property.setValueAtKey() logs the `setValue` kind, not
        // `setValueAtTime` (which is reserved for setValueAtTime()).
        // 2 source keyframes × 3 repetitions = 6 clone pairs
        { kind: 'addKeyframe', target: 'Transform/Position' },
        { kind: 'setValue',    target: 'Transform/Position' },
        { kind: 'addKeyframe', target: 'Transform/Position' },
        { kind: 'setValue',    target: 'Transform/Position' },
        { kind: 'addKeyframe', target: 'Transform/Position' },
        { kind: 'setValue',    target: 'Transform/Position' },
        { kind: 'addKeyframe', target: 'Transform/Position' },
        { kind: 'setValue',    target: 'Transform/Position' },
        { kind: 'addKeyframe', target: 'Transform/Position' },
        { kind: 'setValue',    target: 'Transform/Position' },
        { kind: 'addKeyframe', target: 'Transform/Position' },
        { kind: 'setValue',    target: 'Transform/Position' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'medium',
    },

    // -------------------------------------------------------------------------
    // SUCCESS — Temporal decay (Ease In), single keyframe, 2 reps
    // -------------------------------------------------------------------------
    {
      name: 'success — single keyframe x2 reps with Ease In temporal decay',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-2', name: 'Decay Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Decay Comp',
            width: 1920,
            height: 1080,
            duration: 30,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-2',
                index: 1,
                name: 'Text Layer 1',
                type: 'Text',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 30,
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
                        matchName: 'ADBE Opacity',
                        name: 'Opacity',
                        path: 'Transform/Opacity',
                        propertyValueType: 'OneD',
                        value: 100,
                        canSetExpression: true,
                        keyframes: [{ time: 0.5, value: 80 }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        selection: {
          layerIds: ['layer-2'],
          propertyPaths: ['Transform/Opacity'],
        },
      },
      actions: [
        { type: 'change', target: 'intervalInput',      value: '48' },
        { type: 'change', target: 'repetitionsInput',   value: '2' },
        { type: 'click',  target: 'temporalDecayCheckbox' },
        { type: 'change', target: 'decayDurationInput', value: '1200' },
        { type: 'select', target: 'decayTypeDropdown',  value: 'Ease In' },
        { type: 'click',  target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // 1 source keyframe × 2 reps = 2 clones.
        // setValueAtKey() logs `setValue` (not `setValueAtTime`).
        { kind: 'addKeyframe', target: 'Transform/Opacity' },
        { kind: 'setValue',    target: 'Transform/Opacity' },
        { kind: 'addKeyframe', target: 'Transform/Opacity' },
        { kind: 'setValue',    target: 'Transform/Opacity' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'medium',
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
      actions: [
        { type: 'change', target: 'intervalInput',    value: '24' },
        { type: 'change', target: 'repetitionsInput', value: '5' },
        { type: 'click',  target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        // beginUndoGroup fires unconditionally at top-level script scope
        { kind: 'beginUndoGroup' },
        // guard fires inside duplicateKeyframesAcrossLayers, no keyframe ops
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['No active composition selected.'],
      expectedConfidence: 'high',
    },

    // -------------------------------------------------------------------------
    // GUARD — Comp active but no keyframes selected in any property
    // -------------------------------------------------------------------------
    {
      name: 'guard — no keyframes selected',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-3', name: 'No KF Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-3',
        comps: [
          {
            id: 'comp-3',
            name: 'No KF Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-3',
                index: 1,
                name: 'AV Layer',
                type: 'AV',
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
                        // no keyframes → isTimeVarying = false
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        selection: {
          layerIds: ['layer-3'],
          propertyPaths: ['Transform/Position'],
        },
      },
      actions: [
        { type: 'change', target: 'intervalInput',    value: '24' },
        { type: 'change', target: 'repetitionsInput', value: '3' },
        { type: 'click',  target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['No keyframes selected.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-validate at module load
const result = validateFixture(fixture);
if (!result.ok) {
  throw new Error(`KeyCloneMatic.fixture.js failed validation:\n${result.errors.join('\n')}`);
}

export default fixture;
