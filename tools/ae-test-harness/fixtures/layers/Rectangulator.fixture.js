/**
 * Test fixture for Rectangulator.jsx
 *
 * Rectangulator converts a selected parametric rectangle shape into a bezier-backed
 * shape group with preserved fills/strokes, applies a pseudo-effect controller via
 * embedded FFX binary (ApplyFFX), and attaches expressions for path, anchorPoint,
 * and position. It depends on //@include directives (RefManager, ApplyFFX,
 * rectangulator_expressions) so it is KNOWN-BLOCKED in standalone Node execution.
 *
 * Scenarios:
 *  1. known-blocked — confirms include-blocked status, zero mutating ops expected
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
    // Scenario 1: known-blocked
    // The script contains //@include directives; it cannot execute in the Node
    // sandbox because RefManager, ApplyFFX, and rectangulator_expressions are
    // not bundled inline. scanIncludes returns blocked:true.
    // -------------------------------------------------------------------------
    {
      name: 'known-blocked — include dependencies prevent standalone execution',
      kind: 'known-blocked',
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
      // Known-blocked: no mutating operations expected at harness level
      expectedOperations: [],
      expectedConfidence: 'known-blocked'
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
      expectedConfidence: 'known-blocked'
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
      expectedConfidence: 'known-blocked'
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
