/**
 * Test fixture for Opac-o-bot.jsx
 *
 * Opac-o-bot writes `thisComp.layer("<parent>").transform.opacity` onto every
 * selected layer's Opacity so children fade with their parent.
 *
 * Scenarios:
 *  1. success — parented child gets the opacity expression (setExpression)
 *  2. guard — no active composition
 *  3. guard — no layers selected
 *  4. guard — selected layer has no parent (alert, no expression)
 */

import { validateFixture } from '../../src/contracts/index.js';

function comp(withParent) {
  return {
    id: 'comp-opac-1',
    name: 'Opacity Comp',
    width: 1920,
    height: 1080,
    duration: 10,
    frameRate: 24,
    pixelAspect: 1,
    layers: [
      {
        id: 'layer-parent-1',
        index: 1,
        name: 'Controller Null',
        type: 'Null',
        threeDLayer: false,
        parentId: null,
        inPoint: 0,
        outPoint: 10,
        properties: []
      },
      {
        id: 'layer-child-1',
        index: 2,
        name: 'Child Art',
        type: 'AV',
        threeDLayer: false,
        parentId: withParent ? 'layer-parent-1' : null,
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
                value: 100
              }
            ]
          }
        ]
      }
    ]
  };
}

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Opac-o-bot',
    category: 'layers',
    relPath: 'layers/Opac-o-bot.jsx',
    ui: false
  },
  scenarios: [
    {
      name: 'success — parented child opacity linked via expression',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-opac-1', name: 'Opacity Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-opac-1',
        comps: [comp(true)],
        selection: { layerIds: ['layer-child-1'], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
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
      name: 'guard — no layers selected alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-opac-1', name: 'Opacity Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-opac-1',
        comps: [comp(true)],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['Please select at least one parented layer.'],
      expectedConfidence: 'high'
    },
    {
      name: 'guard — unparented layer alerts and is skipped',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-opac-1', name: 'Opacity Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-opac-1',
        comps: [comp(false)],
        selection: { layerIds: ['layer-child-1'], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['"Child Art" has no parent - skipped.'],
      expectedConfidence: 'high'
    }
  ]
};

const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(`Opac-o-bot.fixture.js failed self-validation:\n  ${check.errors.join('\n  ')}`);
}

export default fixture;
