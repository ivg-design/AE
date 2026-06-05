/**
 * Fixture for KeyBot — Advanced Keyframe Value Manipulation Tool
 *
 * KeyBot is a dockable PANEL (@ui PANEL) that modifies selected keyframe values
 * using mathematical operations (Set, Add, Subtract, Multiply, Divide) across
 * selected properties on selected layers. It wraps all mutations in an undo group
 * and calls property.setValueAtKey() for each selected keyframe.
 *
 * Guard conditions:
 *   - No active comp → alert('Please select a composition.')
 *   - No selected layers → alert('Please select a layer with keyframes.')
 *   - Property has no keyframes → alert('No keyframes selected.')  (per-property, non-fatal)
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'KeyBot',
    category: 'keyframes',
    relPath: 'keyframes/KeyBot.jsx',
    ui: true,
  },

  scenarios: [
    // -------------------------------------------------------------------------
    // SUCCESS — Add 50 to X on two selected keyframes of a TwoD Position property
    // -------------------------------------------------------------------------
    {
      name: 'success — add 50 to X on selected Position keyframes',
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
                        keyframes: [
                          { time: 0, value: [100, 200] },
                          { time: 2, value: [500, 300] },
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
      // Actions: enable X checkbox, enter 50 in X input, click '+' button
      actions: [
        { type: 'click', target: 'checkbox_x' },
        { type: 'change', target: 'edittext1', value: '50' },
        { type: 'click', target: 'plus_button' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // setValueAtTime for each selected keyframe (k=1 and k=2) on Position
        { kind: 'setValueAtTime', target: 'Transform/Position' },
        { kind: 'setValueAtTime', target: 'Transform/Position' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'medium',
    },

    // -------------------------------------------------------------------------
    // SUCCESS — Set all three dimensions on a ThreeD property (3D Position)
    // -------------------------------------------------------------------------
    {
      name: 'success — set XYZ on selected 3D Position keyframes',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-2', name: '3D Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: '3D Comp',
            width: 1920,
            height: 1080,
            duration: 5,
            frameRate: 30,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-2',
                index: 1,
                name: 'Null 1',
                type: 'Null',
                threeDLayer: true,
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
                    numProperties: 7,
                    properties: [
                      {
                        matchName: 'ADBE Position',
                        name: 'Position',
                        path: 'Transform/Position',
                        propertyValueType: 'ThreeD',
                        value: [960, 540, 0],
                        canSetExpression: true,
                        keyframes: [{ time: 1, value: [200, 300, 0] }],
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
          propertyPaths: ['Transform/Position'],
        },
      },
      actions: [
        { type: 'click', target: 'checkbox_x' },
        { type: 'click', target: 'checkbox_y' },
        { type: 'click', target: 'checkbox_z' },
        { type: 'change', target: 'edittext1', value: '100' },
        { type: 'change', target: 'edittext2', value: '200' },
        { type: 'change', target: 'edittext3', value: '50' },
        { type: 'click', target: 'equals_button' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'setValueAtTime', target: 'Transform/Position' },
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
        { type: 'click', target: 'checkbox_x' },
        { type: 'change', target: 'edittext1', value: '10' },
        { type: 'click', target: 'plus_button' },
        { type: 'run' },
      ],
      expectedOperations: [],
      expectedAlerts: ['Please select a composition.'],
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
                id: 'layer-3',
                index: 1,
                name: 'AV Layer 1',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 5,
                properties: [],
              },
            ],
          },
        ],
        selection: {
          layerIds: [],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'click', target: 'checkbox_x' },
        { type: 'change', target: 'edittext1', value: '5' },
        { type: 'click', target: 'plus_button' },
        { type: 'run' },
      ],
      expectedOperations: [],
      expectedAlerts: ['Please select a layer with keyframes.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-validate at module load
const result = validateFixture(fixture);
if (!result.ok) {
  throw new Error(`KeyBot.fixture.js failed validation:\n${result.errors.join('\n')}`);
}

export default fixture;
