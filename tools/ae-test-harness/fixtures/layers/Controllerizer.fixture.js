/**
 * Test fixture for Controllerizer.jsx
 *
 * Controllerizer gathers all selected properties onto a single "Controller
 * Null": one matching expression control per property (Slider/Angle/Point/
 * 3D Point/Color), seeded with the current value, with the source property
 * linked back by expression.
 *
 * Scenarios:
 *  1. success — selected Opacity gets a Slider control + linking expression
 *  2. guard — no active composition
 *  3. guard — no property selected
 */

import { validateFixture } from '../../src/contracts/index.js';

const COMP = {
  id: 'comp-ctrl-1',
  name: 'Rig Comp',
  width: 1920,
  height: 1080,
  duration: 10,
  frameRate: 24,
  pixelAspect: 1,
  layers: [
    {
      id: 'layer-ctrl-1',
      index: 1,
      name: 'Art Layer',
      type: 'AV',
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
              matchName: 'ADBE Opacity',
              name: 'Opacity',
              path: 'ADBE Transform Group/ADBE Opacity',
              propertyValueType: 'OneD',
              canSetExpression: true,
              value: 80
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
    name: 'Controllerizer',
    category: 'layers',
    relPath: 'layers/Controllerizer.jsx',
    ui: false
  },
  scenarios: [
    {
      name: 'success — selected Opacity centralized onto Controller Null',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-ctrl-1', name: 'Rig Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-ctrl-1',
        comps: [COMP],
        selection: { layerIds: [], propertyPaths: ['Art Layer/Transform/Opacity'] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'createLayer' },
        { kind: 'setValue' },
        { kind: 'setExpression' },
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
      name: 'guard — no property selected alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-ctrl-1', name: 'Rig Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-ctrl-1',
        comps: [COMP],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['Please select at least one property.'],
      expectedConfidence: 'high'
    }
  ]
};

const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(`Controllerizer.fixture.js failed self-validation:\n  ${check.errors.join('\n  ')}`);
}

export default fixture;
