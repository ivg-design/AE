/**
 * Test fixture for Elast-o-matic.jsx
 *
 * Elast-o-matic applies a per-property pseudo-effect controller plus a bounce
 * expression to every selected property. Default variant is Inertial Bounce;
 * holding Cmd/Ctrl at launch (ScriptUI.environment.keyboardState — unavailable
 * in the sandbox, so the default variant runs) switches to the Bounce variant.
 *
 * Scenarios:
 *  1. success — selected Position gets a controller effect + expression
 *  2. guard — no active composition
 *  3. guard — no layer selected
 *  4. guard — no property selected
 */

import { validateFixture } from '../../src/contracts/index.js';

const COMP = {
  id: 'comp-elast-1',
  name: 'Bounce Comp',
  width: 1920,
  height: 1080,
  duration: 10,
  frameRate: 24,
  pixelAspect: 1,
  layers: [
    {
      id: 'layer-elast-1',
      index: 1,
      name: 'Ball',
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
              matchName: 'ADBE Position',
              name: 'Position',
              path: 'ADBE Transform Group/ADBE Position',
              propertyValueType: 'TwoD',
              canSetExpression: true,
              value: [960, 540],
              keyframes: [
                { time: 0, value: [960, 540] },
                { time: 1, value: [960, 200] }
              ]
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
    name: 'Elast-o-matic',
    category: 'keyframes',
    relPath: 'keyframes/Elast-o-matic.jsx',
    ui: false
  },
  scenarios: [
    {
      name: 'success — selected Position rigged with controller + expression',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-elast-1', name: 'Bounce Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-elast-1',
        comps: [COMP],
        selection: {
          layerIds: ['layer-elast-1'],
          propertyPaths: ['Ball/Transform/Position']
        }
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
      expectedAlerts: ['Please select a composition first.'],
      expectedConfidence: 'high'
    },
    {
      name: 'guard — no layer selected alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-elast-1', name: 'Bounce Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-elast-1',
        comps: [COMP],
        selection: { layerIds: [], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['Please select a layer.'],
      expectedConfidence: 'high'
    },
    {
      name: 'guard — no property selected alerts and exits',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: { items: [{ id: 'comp-elast-1', name: 'Bounce Comp', typeName: 'Composition' }] },
        activeItemId: 'comp-elast-1',
        comps: [COMP],
        selection: { layerIds: ['layer-elast-1'], propertyPaths: [] }
      },
      actions: [{ type: 'run' }],
      expectedOperations: [{ kind: 'alert' }],
      expectedAlerts: ['Please select at least one property (e.g. Position) to apply the bounce to.'],
      expectedConfidence: 'high'
    }
  ]
};

const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(`Elast-o-matic.fixture.js failed self-validation:\n  ${check.errors.join('\n  ')}`);
}

export default fixture;
