/**
 * NullBot fixture — layers category
 *
 * @ui HEADLESS
 *
 * What the script does:
 *  1. Guards: requires active CompItem and at least one selected layer.
 *  2. Calculates average [x, y] position of all selected layers.
 *  3. Creates a Null layer (addNull) named "NullBot" at the average position.
 *  4. Sets null.threeDLayer if any selected layer is 3D.
 *  5. Parents every selected layer to the new null.
 *  6. Moves the null to the topmost index of the selected layers (moveBefore).
 *  7. Sets null inPoint / outPoint to the combined span of all selected layers.
 *  8. Wraps everything in an undo group named "NullBot".
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'NullBot',
    category: 'layers',
    relPath: 'layers/NullBot.jsx',
    ui: false
  },
  scenarios: [
    // ------------------------------------------------------------------ success
    {
      name: 'success — two selected AV layers, null created at average position',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [
            { id: 'item-comp-1', name: 'Main Comp', typeName: 'Composition' }
          ]
        },
        activeItemId: 'item-comp-1',
        comps: [
          {
            id: 'item-comp-1',
            name: 'Main Comp',
            width: 1920,
            height: 1080,
            duration: 5,
            frameRate: 30,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-1',
                index: 1,
                name: 'Layer A',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 3,
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
                        value: [300, 200],
                        canSetExpression: true
                      }
                    ]
                  }
                ]
              },
              {
                id: 'layer-2',
                index: 2,
                name: 'Layer B',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 1,
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
                        value: [500, 400],
                        canSetExpression: true
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        selection: {
          layerIds: ['layer-1', 'layer-2'],
          propertyPaths: []
        }
      },
      // NullBot is HEADLESS — no UI interaction; just run.
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'createLayer', value: 'NullBot' },
        // position.setValue([400, 300]) — average of [300,200] and [500,400]
        { kind: 'setValue', target: 'NullBot/Transform/Position' },
        // parent all selected layers to the null
        { kind: 'setParent', target: 'layer-1' },
        { kind: 'setParent', target: 'layer-2' },
        // moveBefore (reorder) null to topmost selected index
        { kind: 'reorder' },
        { kind: 'endUndoGroup' }
      ],
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------ success 3D
    {
      name: 'success — one 3D selected layer, null inherits threeDLayer',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [
            { id: 'item-comp-2', name: '3D Comp', typeName: 'Composition' }
          ]
        },
        activeItemId: 'item-comp-2',
        comps: [
          {
            id: 'item-comp-2',
            name: '3D Comp',
            width: 1920,
            height: 1080,
            duration: 4,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-3d',
                index: 1,
                name: 'Shape3D',
                type: 'Shape',
                threeDLayer: true,
                parentId: null,
                inPoint: 0,
                outPoint: 4,
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
                        propertyValueType: 'ThreeD',
                        value: [960, 540, 0],
                        canSetExpression: true
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ],
        selection: {
          layerIds: ['layer-3d'],
          propertyPaths: []
        }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'createLayer', value: 'NullBot' },
        { kind: 'setValue', target: 'NullBot/Transform/Position' },
        { kind: 'setParent', target: 'layer-3d' },
        { kind: 'reorder' },
        { kind: 'endUndoGroup' }
      ],
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------ guard: no active comp
    {
      name: 'guard — no active composition',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [] },
        activeItemId: null,
        comps: [],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [],
      expectedAlerts: ['Please select a composition!'],
      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------ guard: no selected layers
    {
      name: 'guard — active comp but no layers selected',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [
            { id: 'item-comp-3', name: 'Empty Comp', typeName: 'Composition' }
          ]
        },
        activeItemId: 'item-comp-3',
        comps: [
          {
            id: 'item-comp-3',
            name: 'Empty Comp',
            width: 1920,
            height: 1080,
            duration: 5,
            frameRate: 30,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-unsel',
                index: 1,
                name: 'Unselected Layer',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 5,
                properties: []
              }
            ]
          }
        ],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [],
      expectedAlerts: ['Select at least one layer!'],
      expectedConfidence: 'high'
    }
  ]
};

// Self-validate at module load time — throw immediately if contract is violated.
const validation = validateFixture(fixture);
if (!validation.ok) {
  throw new Error(`NullBot.fixture.js failed contract validation:\n${validation.errors.join('\n')}`);
}

export default fixture;
