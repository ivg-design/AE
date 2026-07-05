/**
 * Test fixture for Reseterator.jsx
 *
 * Reseterator zeroes the layer Anchor Point ([0,0,0]) of every selected layer
 * and recursively resets each ADBE Vector Transform Group's Anchor/Position to [0,0].
 *
 * Scenarios:
 *  1. success — selected shape layer gets anchors reset (setValue ops)
 *  2. guard — no active composition
 *  3. guard — no layers selected
 */

import { validateFixture } from '../../src/contracts/index.js';

const COMP = {
  id: 'comp-reset-1',
  name: 'Reset Comp',
  width: 1920,
  height: 1080,
  duration: 10,
  frameRate: 24,
  pixelAspect: 1,
  layers: [
    {
      id: 'layer-reset-1',
      index: 1,
      name: 'Messy Shape',
      type: 'Shape',
      threeDLayer: false,
      parentId: null,
      inPoint: 0,
      outPoint: 10,
      properties: [
        {
          matchName: 'ADBE Transform Group',
          name: 'Transform',
          path: 'ADBE Transform Group',
          propertyValueType: 'NoValue',
          canSetExpression: false,
          properties: [
            {
              matchName: 'ADBE Anchor Point',
              name: 'Anchor Point',
              path: 'ADBE Transform Group/ADBE Anchor Point',
              propertyValueType: 'ThreeD',
              canSetExpression: true,
              value: [120, 80, 0]
            }
          ]
        }
      ]
    }
  ]
};

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Reseterator',
    category: 'layers',
    relPath: 'layers/Reseterator.jsx',
    ui: false
  },
  scenarios: [
    {
      name: 'success — selected layer anchor reset to zero',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-reset-1', name: 'Reset Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-reset-1',
        comps: [COMP],
        selection: { layerIds: ['layer-reset-1'], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'setValue' },
        { kind: 'endUndoGroup' }
      ],
      expectedConfidence: 'medium'
    },
    {
      name: 'guard — no active composition alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [] },
        activeItemId: null,
        comps: [],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['Please select composition first'],
      expectedConfidence: 'high'
    },
    {
      name: 'guard — no layers selected alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-reset-1', name: 'Reset Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-reset-1',
        comps: [COMP],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['Please select at least one layer.'],
      expectedConfidence: 'high'
    }
  ]
};

const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(`Reseterator.fixture.js failed self-validation:\n  ${check.errors.join('\n  ')}`);
}

export default fixture;
