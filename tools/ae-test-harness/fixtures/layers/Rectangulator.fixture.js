/**
 * Test fixture for Rectangulator.jsx
 *
 * Rectangulator converts a selected parametric rectangle shape into a bezier-backed
 * shape group with preserved fills/strokes, applies a pseudo-effect controller via
 * embedded FFX binary (ApplyFFX), and attaches expressions for path, anchorPoint,
 * and position. As of v2.1.0 RefManager, ApplyFFX, and the expression helpers are
 * inlined, so the script runs standalone.
 *
 * Scenarios:
 *  1. success — converts a parametric rectangle: new group, pseudo effect, expressions
 *  2. guard/no-comp  — no active composition, expects guard alert
 *  3. guard/no-shape — non-shape layer selected, expects guard alert
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Rectangulator',
    category: 'layers',
    relPath: 'layers/Rectangulator.jsx',
    ui: false
  },
  scenarios: [
    // -------------------------------------------------------------------------
    // Scenario 1: success
    // A shape layer with a parametric rectangle is selected. The script creates
    // a "Parametric Rectangle" group (addProperty → executeCommand ops), writes
    // the pseudo-effect FFX to temp and applies it (fileWrite + applyPreset),
    // then wires the path/anchorPoint/position expressions (setExpression).
    // -------------------------------------------------------------------------
    {
      name: 'success — converts parametric rectangle to controlled bezier group',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [
            { id: 'comp-1', name: 'Main Comp', typeName: 'Composition' }
          ]
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
                name: 'Rectangle Shape',
                type: 'Shape',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [
                  {
                    matchName: 'ADBE Root Vectors Group',
                    name: 'Contents',
                    path: 'ADBE Root Vectors Group',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 1,
                    properties: [
                      {
                        matchName: 'ADBE Vector Group',
                        name: 'Rectangle 1',
                        path: 'ADBE Root Vectors Group/ADBE Vector Group',
                        propertyValueType: 'NoValue',
                        canSetExpression: false,
                        numProperties: 2,
                        properties: [
                          {
                            matchName: 'ADBE Vectors Group',
                            name: 'Contents',
                            path: 'ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group',
                            propertyValueType: 'NoValue',
                            canSetExpression: false,
                            numProperties: 1,
                            properties: [
                              {
                                matchName: 'ADBE Vector Shape - Rect',
                                name: 'Rectangle Path 1',
                                path: 'ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Shape - Rect',
                                propertyValueType: 'NoValue',
                                canSetExpression: false
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        selection: {
          layerIds: ['layer-1'],
          propertyPaths: []
        }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'fileWrite' },
        { kind: 'applyPreset' },
        { kind: 'setValue' },
        { kind: 'setExpression' },
        { kind: 'endUndoGroup' }
      ],
      expectedConfidence: 'medium'
    },

    // -------------------------------------------------------------------------
    // Scenario 2: guard — no active composition
    // -------------------------------------------------------------------------
    {
      name: 'guard — no active composition alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: []
        },
        activeItemId: null,
        comps: [],
        selection: {
          layerIds: [],
          propertyPaths: []
        }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        { kind: 'alert' }
      ],
      expectedAlerts: ['Please open a composition first.'],
      expectedConfidence: 'high'
    },

    // -------------------------------------------------------------------------
    // Scenario 3: guard — non-shape layer selected (AV layer)
    // Script checks instanceof ShapeLayer; alerts and returns.
    // -------------------------------------------------------------------------
    {
      name: 'guard — non-shape layer selected alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [
            { id: 'comp-2', name: 'Test Comp', typeName: 'Composition' }
          ]
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Test Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-av-1',
                index: 1,
                name: 'Video Layer',
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
        selection: {
          layerIds: ['layer-av-1'],
          propertyPaths: []
        }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        { kind: 'alert' }
      ],
      expectedAlerts: ['Please select a shape layer with a rectangle.'],
      expectedConfidence: 'high'
    }
  ]
};

// Self-check at module load — throw if the fixture is invalid.
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `Rectangulator.fixture.js failed self-validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
